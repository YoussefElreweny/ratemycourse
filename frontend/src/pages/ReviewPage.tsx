import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen, ChevronRight, Star, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
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

  useEffect(() => {
    supabase.from("universities").select("*").then(({ data: unis }) => {
      if (unis) {
        setUniversities(unis);
        const ainShams = unis.find((u: any) => u.name.includes("Ain Shams"));
        if (ainShams) setSelectedUni(ainShams.id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedUni) {
      supabase.from("faculties").select("*").eq("university_id", selectedUni).then(({ data: facs }) => {
        if (facs) {
          setFaculties(facs);
          const eng = facs.find((f: any) => f.name.includes("Engineering"));
          if (eng) setSelectedFaculty(eng.id);
        }
      });
      setSelectedDept(null);
      setCourses([]);
    }
  }, [selectedUni]);

  const processCourseData = (rawData: any[], facultyNameFallback?: string): Course[] => {
    const uniqueMap = new Map<number, Course>();

    rawData.forEach((pc: any) => {
      const c = pc.course || pc; // fallback in case direct course
      if (!c || uniqueMap.has(c.id)) return;

      const reviewCount = c.reviews?.length || 0;
      const avgDiff = reviewCount > 0 ? (c.reviews.reduce((acc: number, r: any) => acc + r.difficulty, 0) / reviewCount) : null;
      const recCount = c.reviews?.filter((r: any) => r.recommend).length || 0;
      const recPercent = reviewCount > 0 ? (recCount / reviewCount) * 100 : null;

      // Derived level from semester if it's a bridge object
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
    if (selectedFaculty) {
      supabase.from("departments").select("*").eq("faculty_id", selectedFaculty).then(({ data }) => {
        if (data) setDepartments(data);
      });

      const facultyName = faculties.find(f => f.id === selectedFaculty)?.name;
      supabase
        .from("program_courses")
        .select(`
          semester, 
          departments!inner(name, faculty_id), 
          course:courses(*, reviews(id, difficulty, recommend))
        `)
        .eq("departments.faculty_id", selectedFaculty)
        .then(({ data }) => {
          if (data) setCourses(processCourseData(data, facultyName));
        });
      setSelectedDept(null);
    }
  }, [selectedFaculty]);

  useEffect(() => {
    if (selectedDept) {
      supabase
        .from("program_courses")
        .select(`
          semester, 
          departments!inner(name, faculties(name)), 
          course:courses(*, reviews(id, difficulty, recommend))
        `)
        .eq("program_id", selectedDept)
        .then(({ data }) => {
          if (data) setCourses(processCourseData(data));
        });
    }
  }, [selectedDept]);

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === null || c.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Course Reviews</h1>
        <p className="text-zinc-500 text-lg">Exploring courses at Ain Shams University.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Selectors */}
          <div className="space-y-6">
            {selectedFaculty && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-widest">Department</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedDept(null)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                        selectedDept === null 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" 
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      All Departments
                    </button>
                    {departments.map(dept => (
                      <button
                        key={dept.id}
                        onClick={() => setSelectedDept(dept.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                          selectedDept === dept.id 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" 
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-3 uppercase tracking-widest">Level</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedLevel(null)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                        selectedLevel === null 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" 
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      All Levels
                    </button>
                    {levels.map(level => (
                      <button
                        key={level.id}
                        onClick={() => setSelectedLevel(level.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                          selectedLevel === level.id 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" 
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {level.name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        {/* Course List */}
        <div className="lg:col-span-3">
          {selectedFaculty ? (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="text"
                  placeholder={`Search courses in ${faculties.find(f => f.id === selectedFaculty)?.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {filteredCourses.map(course => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    className="p-6 bg-white border border-zinc-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-2 py-1 bg-zinc-100 rounded text-xs font-bold text-zinc-600 uppercase tracking-wider">
                        {course.code}
                      </div>
                      <div className="text-xs text-zinc-400 font-medium">
                        Level {course.level} • {course.credit_hours} Credit Hours
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                      {course.name}
                      {course.recommend_percent && course.recommend_percent >= 80 && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase border border-emerald-100">Top</span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-1">
                      {course.faculty_name} • {course.department_name}
                    </p>
                    <div className="flex items-center justify-between text-sm text-zinc-500 pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-1">
                        <Star size={14} className={course.review_count > 0 ? "text-yellow-500 fill-yellow-500" : "text-zinc-300"} />
                        <span className="font-semibold text-zinc-700">
                          {course.avg_difficulty ? (5 - course.avg_difficulty + 1).toFixed(1) : "N/A"}
                        </span>
                        <span className="text-xs">({course.review_count} reviews)</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
                {filteredCourses.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4">
                      <BookOpen size={32} />
                    </div>
                    <h3 className="text-zinc-900 font-bold text-lg">No courses found</h3>
                    <p className="text-zinc-500">Try adjusting your search query.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-zinc-300 mb-6">
                <GraduationCap size={40} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Select a Faculty</h3>
              <p className="text-zinc-500 max-w-xs">Please select a university and faculty to start exploring courses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
