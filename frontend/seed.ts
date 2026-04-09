import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env from the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Using VITE_SUPABASE_ANON_KEY.");
  console.warn("⚠️ If inserting fails with RLS errors, please provide your Service Role Key.");
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Reading courses.json...');
  const dataPath = path.resolve(__dirname, 'courses.json');
  if (!fs.existsSync(dataPath)) {
    console.error("courses.json not found! Please save the JSON data to frontend/courses.json first.");
    process.exit(1);
  }

  const coursesJson = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Found ${coursesJson.length} courses to import.`);

  // 1. Ensure University Exists
  let { data: uni } = await supabase.from('universities').select('id').eq('name', 'Ain Shams University').single();
  if (!uni) {
    console.log("Creating Ain Shams University...");
    const { data, error } = await supabase.from('universities').insert({ name: 'Ain Shams University' }).select().single();
    if (error) throw error;
    uni = data;
  }

  // 2. Ensure Faculty Exists
  let { data: fac } = await supabase.from('faculties').select('id').eq('name', 'Faculty of Engineering').eq('university_id', uni.id).single();
  if (!fac) {
    console.log("Creating Faculty of Engineering...");
    const { data, error } = await supabase.from('faculties').insert({ name: 'Faculty of Engineering', university_id: uni.id }).select().single();
    if (error) throw error;
    fac = data;
  }

  // 3. Departments/Programs
  // For the MVP, we will group these courses under the specific programs. The user mentioned 11 programs.
  // We will also create a "General Engineering Requirements" department for courses that apply to everyone.
  
  const programCodes = ['MDPE', 'MEPE', 'AUTO', 'MCTR', 'ARCH', 'EPME', 'ELCE', 'CSYE', 'STRE', 'WENG', 'UINE', 'General Engineering Requirements'];
  const devProgramMap: Record<string, number> = {};

  console.log("Ensuring all departments/programs exist...");
  for (const prog of programCodes) {
    let { data: dept } = await supabase.from('departments').select('id').eq('name', prog).eq('faculty_id', fac.id).single();
    if (!dept) {
      const { data, error } = await supabase.from('departments').insert({ name: prog, faculty_id: fac.id }).select().single();
      if (error) throw error;
      dept = data;
    }
    devProgramMap[prog] = dept.id;
  }

  // Level mapping
  const levelMap: Record<string, number> = {
    'Freshman': 0,
    'Sophomore': 1,
    'Junior': 2,
    'Senior': 3
  };

  // Category mapping
  const catMap: Record<string, string> = {
    'University Requirement': 'university',
    'Faculty Requirement': 'faculty'
  };

  // 4. Insert Courses
  console.log("Inserting courses...");
  const courseIdMap: Record<string, number> = {}; // map code -> id

  for (const item of coursesJson) {
    // Determine category
    let category = 'program';
    if (catMap[item.category]) category = catMap[item.category];
    else if (item.category.includes('Basic')) category = 'discipline';
    
    // Determine target departments. If none specified, it's a general requirement
    const targetProgs = (item.programs && item.programs.length > 0) ? item.programs : ['General Engineering Requirements'];
    
    // For simplicity in the MVP, we pick the first program it belongs to. 
    // If it belongs to multiple, we just use the first one, or use 'General Engineering Requirements' if it's a university/faculty req.
    let deptId = devProgramMap['General Engineering Requirements'];
    if (category === 'program' && targetProgs.length > 0) {
      deptId = devProgramMap[targetProgs[0]];
    }

    // Upsert the course (check first since no unique constraint on code)
    let { data: c } = await supabase.from('courses').select('id').eq('code', item.code).single();
    
    if (!c) {
      const { data, error } = await supabase.from('courses').insert({
        department_id: deptId,
        code: item.code,
        name: item.name,
        credit_hours: item.credit_hours,
        level: levelMap[item.level] !== undefined ? levelMap[item.level] : 0,
        category: category
      }).select().single();

      if (error) {
        console.error(`Failed to insert course ${item.code}:`, error);
        continue;
      }
      c = data;
    }
    
    courseIdMap[item.code] = c.id;
  }

  // 5. Insert Prerequisites
  console.log("Linking prerequisites...");
  for (const item of coursesJson) {
    const cid = courseIdMap[item.code];
    if (!cid) continue;

    for (const prereqCode of item.prerequisite_codes || []) {
      const pid = courseIdMap[prereqCode];
      if (!pid) {
        console.warn(`Warning: Prerequisite ${prereqCode} not found for course ${item.code}`);
        continue;
      }
      
      const { error } = await supabase.from('prerequisites').upsert({
        course_id: cid,
        prerequisite_id: pid
      });

      if (error) {
        // Safe to ignore duplicate key errors if we run it twice
        if (!error.message.includes('duplicate key')) {
          console.error(`Failed to link prerequisite ${prereqCode} -> ${item.code}:`, error);
        }
      }
    }
  }

  console.log("✅ Database seeded successfully!");
}

main().catch(console.error);
