import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Star, Users, BookOpen, ChevronRight, MessageSquare, ThumbsUp, ThumbsDown, Filter, Plus } from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import { useAuth } from "../App";

interface Professor {
  id: number;
  name: string;
  avg_difficulty: number | null;
  avg_workload: number | null;
  recommend_percent: number | null;
  review_count: number;
  latest_feedback: string | null;
}

interface Course {
  id: number;
  code: string;
  name: string;
  credit_hours: number;
  department_name: string;
  faculty_name: string;
  professors: Professor[];
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"rating" | "difficulty" | "recommend">("rating");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchData = async () => {
    const { supabase } = await import("../lib/supabase");
    
    try {
      const { data: cData, error: cError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
        
      if (cError) throw cError;

      const { data: bData } = await supabase
        .from('program_courses')
        .select('departments(name, faculties(name))')
        .eq('course_id', id)
        .limit(1);

      const { data: rData } = await supabase
        .from('reviews')
        .select('*, users(name), professors(name)')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      const { data: prefData } = await supabase
        .from('course_professors')
        .select('professors(id, name)')
        .eq('course_id', id);

      const formattedReviews = rData?.map(r => ({
        ...r,
        user_name: r.users?.name || 'Anonymous',
        professor_name: r.professors?.name || null
      })) || [];

      const processedProfessors = prefData?.map((cp: any) => {
        const p = cp.professors;
        const profReviews = formattedReviews.filter(r => r.professor_id === p.id);
        
        const revCount = profReviews.length;
        const avgDiff = revCount ? profReviews.reduce((a, r) => a + r.difficulty, 0) / revCount : null;
        const avgWork = revCount ? profReviews.reduce((a, r) => a + r.workload, 0) / revCount : null;
        const recCount = profReviews.filter(r => r.recommend).length;
        const recPercent = revCount ? (recCount / revCount) * 100 : null;
        
        const latestFeedback = profReviews.find(r => r.professor_feedback)?.professor_feedback || null;

        return {
          id: p.id,
          name: p.name,
          avg_difficulty: avgDiff,
          avg_workload: avgWork,
          recommend_percent: recPercent,
          review_count: revCount,
          latest_feedback: latestFeedback
        };
      }) || [];

      const dep = bData && bData.length > 0 ? (bData[0].departments as any) : null;

      const formattedCourse = cData ? {
        ...cData,
        department_name: dep?.name || 'Common Course',
        faculty_name: dep?.faculties?.name || 'Faculty of Engineering',
        professors: processedProfessors
      } : null;

      setCourse(formattedCourse);
      setReviews(formattedReviews);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const sortedProfessors = useMemo(() => {
    if (!course) return [];
    return [...course.professors].sort((a, b) => {
      if (sortBy === "rating") {
        return (b.recommend_percent || 0) - (a.recommend_percent || 0);
      }
      if (sortBy === "difficulty") {
        return (a.avg_difficulty || 0) - (b.avg_difficulty || 0);
      }
      if (sortBy === "recommend") {
        return (b.recommend_percent || 0) - (a.recommend_percent || 0);
      }
      return 0;
    });
  }, [course, sortBy]);

  if (loading) return <div className="p-20 text-center">Loading course...</div>;
  if (!course) return <div className="p-20 text-center">Course not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <Link to="/reviews" className="text-emerald-600 font-bold text-sm hover:underline">Course Reviews</Link>
          <ChevronRight size={14} className="text-zinc-400" />
          <span className="text-zinc-400 text-sm">{course.code}</span>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">{course.name}</h1>
        <div className="flex items-center gap-6 text-zinc-500">
          <div className="flex items-center gap-2">
            <BookOpen size={18} />
            <span>{course.credit_hours} Credit Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={18} />
            <span>{course.professors.length} Professors</span>
          </div>
          <div className="text-sm font-medium px-2 py-0.5 bg-zinc-100 rounded text-zinc-600">
            {course.faculty_name}
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Course Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Easiness</div>
                <div className="text-2xl font-bold text-zinc-900">
                  {course.professors.length > 0 && course.professors.some(p => p.avg_difficulty !== null)
                    ? (6 - (course.professors.reduce((acc, p) => acc + (p.avg_difficulty || 0), 0) / course.professors.filter(p => p.avg_difficulty !== null).length)).toFixed(1)
                    : "N/A"}
                </div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl col-span-2 lg:col-span-2">
                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Recommend</div>
                <div className="text-2xl font-bold text-zinc-900">
                  {course.professors.length > 0 && course.professors.some(p => p.recommend_percent !== null)
                    ? (course.professors.reduce((acc, p) => acc + (p.recommend_percent || 0), 0) / course.professors.filter(p => p.recommend_percent !== null).length).toFixed(0) + "%"
                    : "N/A"}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-zinc-900">Student Reviews ({reviews.length})</h2>
            </div>

            <div className="space-y-6">
              {reviews.map((review, i) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:border-emerald-500 transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 text-xs font-bold border border-zinc-200">
                        {review.user_name ? review.user_name.split(' ').map((n: string) => n[0]).join('') : "?"}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900 mb-0.5">
                          {review.user_name}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                          {review.term} • {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${review.recommend ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {review.recommend ? 'Recommended' : 'Not Recommended'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-zinc-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Easiness</div>
                      <div className="font-bold text-zinc-900">{6 - review.difficulty}/5</div>
                    </div>
                    <div className="text-center p-3 bg-zinc-50 rounded-2xl col-span-1">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Workload</div>
                      <div className="font-bold text-zinc-900">{review.workload}/5</div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-6 rounded-2xl italic text-zinc-700 text-sm leading-relaxed relative mb-4">
                    <MessageSquare className="absolute -top-2 -left-2 text-emerald-200" size={24} />
                    "{review.advice}"
                  </div>

                  {review.professor_feedback && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Professor Insight</div>
                        {review.professor_name && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            Prof. {review.professor_name}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-amber-900 leading-relaxed">{review.professor_feedback}</p>
                    </div>
                  )}
                </motion.div>
              ))}

              {reviews.length === 0 && (
                <div className="py-20 text-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                  <p className="text-zinc-500">No reviews found for this course yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-200">
            <h3 className="text-lg font-bold mb-2">Contribute Insight</h3>
            <p className="text-emerald-100 text-sm mb-6">Help your fellow students make better choices by sharing your experience.</p>
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full py-3 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Write a Review
            </button>
          </div>

          <ReviewModal 
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            courseId={course.id}
            courseName={course.name}
            professors={course.professors}
            onSuccess={fetchData}
          />

          <section className="bg-white p-6 rounded-3xl border border-zinc-200">
            <div className="mb-6">
              <h2 className="font-bold text-zinc-900">Professors</h2>
            </div>

            <div className="space-y-3">
              {sortedProfessors.map(prof => (
                <div
                  key={prof.id}
                  className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-600 text-xs font-bold border border-zinc-100 shadow-sm">
                      {prof.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 truncate max-w-[140px]">{prof.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
