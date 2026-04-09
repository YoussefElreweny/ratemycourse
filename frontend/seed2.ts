import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Reading program_trees.json and courses.json...");
  const rawData = fs.readFileSync(path.join(__dirname, 'program_trees.json'), 'utf8');
  const data = JSON.parse(rawData);

  const rawCoursesEnv = fs.readFileSync(path.join(__dirname, 'courses.json'), 'utf8');
  const oldCoursesData = JSON.parse(rawCoursesEnv);
  
  // Create a fast lookup for prereqs from the old json
  const prereqLookup: Record<string, string[]> = {};
  for (const item of oldCoursesData) {
    if (item.code && item.prerequisite_codes) {
      prereqLookup[item.code] = item.prerequisite_codes;
    }
  }

  // 1. Ensure University and Faculty exist
  console.log("Creating University and Faculty...");
  let { data: uni } = await supabase.from('universities').select('id').eq('name', 'Ain Shams University').single();
  if (!uni) {
    const { data, error } = await supabase.from('universities').insert({ name: 'Ain Shams University' }).select().single();
    if (error) throw error;
    uni = data;
  }

  let { data: fac } = await supabase.from('faculties').select('id').eq('name', 'Faculty of Engineering').eq('university_id', uni.id).single();
  if (!fac) {
    const { data, error } = await supabase.from('faculties').insert({ university_id: uni.id, name: 'Faculty of Engineering' }).select().single();
    if (error) throw error;
    fac = data;
  }

  // 2. Iterate programs to fetch their courses
  const programs = data.metadata.programs;
  console.log(`Found ${programs.length} programs.`);

  const programIdMap: Record<string, number> = {};
  for (const p of programs) {
    let { data: dept } = await supabase.from('departments').select('id').eq('name', p.code).eq('faculty_id', fac.id).single();
    if (!dept) {
      const { data, error } = await supabase.from('departments').insert({ faculty_id: fac.id, name: p.code }).select().single();
      if (error) throw error;
      dept = data;
    }
    programIdMap[p.code] = dept.id;
  }

  // Extract all unique courses and prerequisite relationships
  const allCoursesMap = new Map();
  const allPrereqs = new Set();
  const programCoursesToInsert: any[] = [];

  for (const progCode of Object.keys(data.program_trees)) {
    const progId = programIdMap[progCode];
    const tree = data.program_trees[progCode];

    for (const sem of tree.semesters) {
      const semNumber = sem.semester;
      for (const course of sem.courses) {
        if (!allCoursesMap.has(course.code)) {
          allCoursesMap.set(course.code, {
            code: course.code,
            name: course.name,
            credit_hours: course.credit_hours,
            category: course.category
          });
        }
        
        programCoursesToInsert.push({
          program_id: progId,
          course_code: course.code, // temporary map
          semester: semNumber
        });

        const prereqsForThisCourse = prereqLookup[course.code] || [];
        if (prereqsForThisCourse.length > 0) {
          for (const pc of prereqsForThisCourse) {
            allPrereqs.add(JSON.stringify({ cCode: course.code, pCode: pc }));
          }
        }
      }
    }
  }

  console.log(`Inserting ${allCoursesMap.size} unique courses...`);
  const courseIdMap: Record<string, number> = {};
  for (const [code, cData] of allCoursesMap.entries()) {
    let { data: c } = await supabase.from('courses').select('id').eq('code', code).single();
    if (!c) {
      const { data, error } = await supabase.from('courses').insert(cData).select().single();
      if (error) {
         console.warn(`Failed to insert course ${code}:`, error.message);
         continue;
      }
      c = data;
    } else {
      // Opt-in: we update existing course details
      const { data, error } = await supabase.from('courses').update(cData).eq('id', c.id).select().single();
      if (error) console.warn(`Failed to update course ${code}:`, error.message);
    }
    courseIdMap[code] = c.id;
  }

  console.log("Inserting program_courses links...");
  // Bulk clean the program_courses first or handle softly
  await supabase.from('program_courses').delete().neq('id', -1); // deletes all rows

  const finalProgramCourses = programCoursesToInsert.map(pc => ({
    program_id: pc.program_id,
    course_id: courseIdMap[pc.course_code],
    semester: pc.semester
  })).filter(pc => pc.course_id);

  // Batched insert
  const pcChunks = [];
  for (let i = 0; i < finalProgramCourses.length; i += 100) {
    pcChunks.push(finalProgramCourses.slice(i, i + 100));
  }
  for (const chunk of pcChunks) {
    const { error } = await supabase.from('program_courses').insert(chunk);
    if (error) console.warn("Error inserting chunk of program_courses:", error.message);
  }

  console.log("Linking prerequisites...");
  // Bulk clean prerequisites
  await supabase.from('prerequisites').delete().neq('course_id', -1); // deletes all rows

  for (const cp of allPrereqs) {
    const { cCode, pCode } = JSON.parse(cp as string);
    const cId = courseIdMap[cCode];
    const pId = courseIdMap[pCode];
    if (cId && pId) {
      const { error } = await supabase.from('prerequisites').upsert({
        course_id: cId,
        prerequisite_id: pId
      });
      if (error) {
        console.warn(`Warning: Could not link prereq ${pCode} to ${cCode}:`, error.message);
      }
    } else {
      console.warn(`Warning: Course mappings missing for prereq link ${pCode} -> ${cCode}`);
    }
  }

  console.log("✅ Database seeded accurately with program trees!");
  process.exit(0);
}

seed().catch(console.error);
