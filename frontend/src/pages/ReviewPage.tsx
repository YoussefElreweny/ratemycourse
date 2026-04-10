import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookOpen, ChevronRight, Star, GraduationCap, Filter } from "lucide-react";

import { supabase } from "../lib/supabase";

interface University {
  id: number;
  name: string;
}

interface Faculty {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
  credit_hours: number;
  level: number;
  department_name: string;
  faculty_name: string;
  avg_difficulty: number | null;
  recommend_percent: number | null;
  review_count: number;
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUni, setSelectedUni] = useState<number | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const levels = [
    { id: 0, name: "Freshman" },
    { id: 1, name: "Sophomore" },
    { id: 2, name: "Junior" },
    { id: 3, name: "Senior" },
  ];

  // Boot: load all faculties directly, pick Engineering or first available
  useEffect(() => {
    const boot = async () => {
      // Load universities (for reference, not gating)
      const { data: unis } = await supabase.from("universities").select("*");
      if (unis && unis.length > 0) setUniversities(unis);

      // Load faculties directly (don't depend on university being selected first)
      const { data: facs } = await supabase.from("faculties").select("*");
      if (facs && facs.length > 0) {
        setFaculties(facs);
        const eng = facs.find((f: any) => f.name.toLowerCase().includes("engineering"));
        const chosen = eng || facs[0];
        setSelectedUni(chosen.university_id || null);
        setSelectedFaculty(chosen.id);
      }
    };
    boot();
  }, []);


  const processCourseData = (rawData: any[], facultyNameFallback?: string): Course[] => {
    const uniqueMap = new Map<number, Course>();

    rawData.forEach((pc: any) => {
      const c = pc.course || pc;
      if (!c || uniqueMap.has(c.id)) return;

      const reviewCount = c.reviews?.length || 0;
      const avgDiff = reviewCount > 0 ? (c.reviews.reduce((acc: number, r: any) => acc + r.difficulty, 0) / reviewCount) : null;
      
      const recCount = c.reviews?.filter((r: any) => r.recommend).length || 0;
      const recPercent = reviewCount > 0 ? (recCount / reviewCount) * 100 : null;

      let derivedLevel = 0;
      if (pc.semester !== undefined) {
        derivedLevel = Math.floor((pc.semester - 1) / 2);
      }

      uniqueMap.set(c.id, {
        id: c.id,
        code: c.code,
        name: c.name,
        credit_hours: c.credit_hours,
        level: derivedLevel,
        department_name: pc.departments?.name || "General",
        faculty_name: facultyNameFallback || pc.departments?.faculties?.name || "Engineering",
        avg_difficulty: avgDiff,
        recommend_percent: recPercent,
        review_count: reviewCount
      });
    });

    return Array.from(uniqueMap.values());
  };

  useEffect(() => {
    if (!selectedFaculty) return;

    const loadCoursesForFaculty = async () => {
      // Step 1: Get departments for this faculty
      const { data: depts, error: deptErr } = await supabase
        .from("departments")
        .select("*")
        .eq("faculty_id", selectedFaculty);

      if (deptErr) { console.error("Dept fetch error:", deptErr); return; }
      if (!depts || depts.length === 0) { console.warn("No departments found for faculty", selectedFaculty); return; }

      setDepartments(depts);
      const deptIds = depts.map((d: any) => d.id);

      // Step 2: Get program_courses filtered by those department IDs
      const { data, error } = await supabase
        .from("program_courses")
        .select(`
          semester,
          program_id,
          course:courses(*, reviews(id, difficulty, recommend))
        `)
        .in("program_id", deptIds);

      if (error) { console.error("Program courses fetch error:", error); return; }
      if (!data) return;

      // Map department name onto each record
      const deptMap = Object.fromEntries(depts.map((d: any) => [d.id, d.name]));
      const facultyName = faculties.find(f => f.id === selectedFaculty)?.name || "";

      const uniqueMap = new Map<number, any>();
      data.forEach((pc: any) => {
        const c = pc.course;
        if (!c || uniqueMap.has(c.id)) return;
        const revs = c.reviews || [];
        const count = revs.length;
        const avgDiff = count > 0 ? revs.reduce((a: number, r: any) => a + r.difficulty, 0) / count : null;
        const recPct = count > 0 ? (revs.filter((r: any) => r.recommend).length / count) * 100 : null;
        uniqueMap.set(c.id, {
          id: c.id,
          code: c.code,
          name: c.name,
          credit_hours: c.credit_hours,
          level: Math.floor(((pc.semester || 1) - 1) / 2),
          department_name: deptMap[pc.program_id] || "General",
          faculty_name: facultyName,
          avg_difficulty: avgDiff,
          recommend_percent: recPct,
          review_count: count,
        });
      });

      setCourses(Array.from(uniqueMap.values()));
    };

    setSelectedDept(null);
    loadCoursesForFaculty();
  }, [selectedFaculty]);

  useEffect(() => {
    if (!selectedDept) return;
    const loadCoursesForDept = async () => {
      const { data, error } = await supabase
        .from("program_courses")
        .select(`semester, program_id, course:courses(*, reviews(id, difficulty, recommend))`)
        .eq("program_id", selectedDept);

      if (error) { console.error("Dept courses error:", error); return; }
      if (!data) return;

      const deptName = departments.find(d => d.id === selectedDept)?.name || "";
      const uniqueMap = new Map<number, any>();
      data.forEach((pc: any) => {
        const c = pc.course;
        if (!c || uniqueMap.has(c.id)) return;
        const revs = c.reviews || [];
        const count = revs.length;
        const avgDiff = count > 0 ? revs.reduce((a: number, r: any) => a + r.difficulty, 0) / count : null;
        const recPct = count > 0 ? (revs.filter((r: any) => r.recommend).length / count) * 100 : null;
        uniqueMap.set(c.id, {
          id: c.id, code: c.code, name: c.name, credit_hours: c.credit_hours,
          level: Math.floor(((pc.semester || 1) - 1) / 2),
          department_name: deptName,
          faculty_name: "",
          avg_difficulty: avgDiff, recommend_percent: recPct, review_count: count,
        });
      });
      setCourses(Array.from(uniqueMap.values()));
    };
    loadCoursesForDept();
  }, [selectedDept]);


  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === null || c.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const getRatingColor = (val: number | null) => {
    if (val === null) return "bg-zinc-100 text-zinc-400";
    if (val >= 4) return "bg-emerald-500 text-white";
    if (val >= 3) return "bg-emerald-400 text-white";
    if (val >= 2.5) return "bg-yellow-400 text-white";
    if (val >= 2) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-zinc-900 mb-4 tracking-tight">Course Reviews & Ratings</h1>
        <p className="text-zinc-500 text-xl font-medium tracking-wide italic">Explore experiences from students across all programs.</p>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-xl shadow-zinc-200/50 border border-zinc-100 mb-12">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <select 
              value={selectedDept || ""}
              onChange={(e) => setSelectedDept(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none appearance-none font-medium text-zinc-600"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <select 
              value={selectedLevel !== null ? selectedLevel : ""}
              onChange={(e) => setSelectedLevel(e.target.value !== "" ? parseInt(e.target.value) : null)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none appearance-none font-medium text-zinc-600"
            >
              <option value="">All Levels</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Course Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[580px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-5 text-sm font-bold text-zinc-500 uppercase tracking-widest">Code</th>
                <th className="px-6 py-5 text-sm font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-5 text-sm font-bold text-zinc-500 uppercase tracking-widest text-center">Difficulty</th>
                <th className="px-6 py-5 text-sm font-bold text-zinc-500 uppercase tracking-widest text-center">Recommend</th>
                <th className="px-6 py-5 text-sm font-bold text-zinc-500 uppercase tracking-widest text-center">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredCourses.map(course => {
                return (
                  <tr 
                    key={course.id} 
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-6">
                      <Link to={`/course/${course.id}`} className="text-emerald-600 font-bold hover:underline">
                        {course.code}
                      </Link>
                    </td>
                    <td className="px-6 py-6">
                      <div className="font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">{course.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{course.department_name}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-10 rounded-xl font-bold text-sm shadow-sm ${getRatingColor(course.avg_difficulty)}`}>
                        {course.avg_difficulty ? course.avg_difficulty.toFixed(1) : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      {course.recommend_percent !== null ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-zinc-900">{Math.round(course.recommend_percent)}%</span>
                          <div className="w-12 h-1 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500" 
                              style={{ width: `${course.recommend_percent}%` }}
                            />
                          </div>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-6 text-center text-sm font-medium text-zinc-500">
                      {course.review_count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredCourses.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mx-auto mb-6">
                <BookOpen size={40} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">No courses found</h3>
              <p className="text-zinc-500 italic mt-2">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
