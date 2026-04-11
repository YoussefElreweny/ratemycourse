import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, BookOpen, ChevronRight, MessageSquare, Plus, User } from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import { useAuth } from "../App";

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchData = async () => {
    const { supabase } = await import("../lib/supabase");
    try {
      const { data: cData, error: cError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      if (cError) throw cError;

      const { data: bData } = await supabase
        .from("program_courses")
        .select("departments(name, faculties(name))")
        .eq("course_id", id)
        .limit(1);

      // Fetch reviews — use professor_name text field now
      const { data: rData, error: rErr } = await supabase
        .from("reviews")
        .select("*, users(name)")
        .eq("course_id", id)
        .order("created_at", { ascending: false });

      if (rErr) console.error("Reviews fetch error:", rErr);

      const formattedReviews = rData?.map(r => ({
        ...r,
        user_name: r.is_anonymous ? "Anonymous" : (r.users?.name || "Anonymous"),
      })) || [];

      const dep = bData && bData.length > 0 ? (bData[0].departments as any) : null;

      setCourse({
        ...cData,
        department_name: dep?.name || "Common Course",
        faculty_name: dep?.faculties?.name || "Faculty of Engineering",
      });

      setReviews(formattedReviews);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const reviewCount = reviews.length;
  const avgDifficulty = reviewCount > 0
    ? reviews.reduce((a, r) => a + r.difficulty, 0) / reviewCount
    : null;
  const avgWorkload = reviewCount > 0
    ? reviews.reduce((a, r) => a + r.workload, 0) / reviewCount
    : null;
  const avgExams = reviewCount > 0
    ? reviews.reduce((a, r) => a + r.exam_difficulty, 0) / reviewCount
    : null;
  const avgGrading = reviewCount > 0
    ? reviews.reduce((a, r) => a + r.grading_fairness, 0) / reviewCount
    : null;
  const recommendPct = reviewCount > 0
    ? (reviews.filter(r => r.recommend).length / reviewCount) * 100
    : null;

  const getDifficultyColor = (val: number) => {
    if (val <= 2) return "text-emerald-600";
    if (val <= 3) return "text-amber-600";
    return "text-red-600";
  };

  if (loading) return <div className="p-20 text-center text-zinc-400">Loading course...</div>;
  if (!course) return <div className="p-20 text-center text-zinc-400">Course not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/reviews" className="text-emerald-600 font-bold hover:underline">Course Reviews</Link>
        <ChevronRight size={14} className="text-zinc-400" />
        <span className="text-zinc-400">{course.code}</span>
      </div>

      {/* Course Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">{course.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-zinc-500 text-sm">
          <div className="flex items-center gap-1.5">
            <BookOpen size={16} />
            <span>{course.credit_hours} Credit Hours</span>
          </div>
          <span className="px-2.5 py-1 bg-zinc-100 rounded-lg text-zinc-600 font-medium text-xs">{course.faculty_name}</span>
          <span className="px-2.5 py-1 bg-zinc-100 rounded-lg text-zinc-600 font-medium text-xs">{course.code}</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-zinc-900">{reviewCount}</div>
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wide mt-1">Reviews</div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm text-center">
          <div className={`text-2xl font-bold ${avgDifficulty ? getDifficultyColor(avgDifficulty) : "text-zinc-900"}`}>
            {avgDifficulty !== null ? avgDifficulty.toFixed(1) : "—"}
          </div>
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wide mt-1">Difficulty</div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-zinc-900">{recommendPct !== null ? Math.round(recommendPct) + "%" : "—"}</div>
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wide mt-1">Recommend</div>
        </div>
      </div>

      {/* Two-column layout: Reviews left, Write a Review sidebar right */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Reviews */}
        <section className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-zinc-900 mb-5">Student Reviews ({reviewCount})</h2>

          {reviewCount === 0 ? (
            <div className="py-16 text-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
              <Star size={32} className="mx-auto mb-3 text-zinc-300" />
              <p className="text-zinc-500 font-medium">No reviews yet for this course.</p>
              <p className="text-zinc-400 text-sm mt-1">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors"
                >
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 text-xs font-bold border border-emerald-100 shrink-0">
                        {review.user_name ? review.user_name.split(" ").map((n: string) => n[0]).join("").slice(0,2) : "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-900 truncate">{review.user_name}</div>
                        <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                          {review.term && `${review.term} • `}{new Date(review.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${review.recommend ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                      {review.recommend ? "Recommended" : "Not Rec."}
                    </span>
                  </div>

                  {/* Professor Name Badge — colored for contrast */}
                  {review.professor_name && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg">
                      <User size={12} className="text-violet-500" />
                      <span className="text-xs font-bold text-violet-700">Prof. {review.professor_name}</span>
                    </div>
                  )}

                  {/* Ratings */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                    {[
                      { label: "Difficulty", val: review.difficulty },
                      { label: "Workload", val: review.workload },
                      { label: "Exams", val: review.exam_difficulty },
                      { label: "Grading", val: review.grading_fairness },
                    ].map(({ label, val }) => (
                      <div key={label} className="text-center p-2.5 bg-zinc-50 rounded-xl">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">{label}</div>
                        <div className="font-bold text-zinc-900 text-sm">{val ?? "—"}/5</div>
                      </div>
                    ))}
                  </div>

                  {/* Advice */}
                  <div className="bg-zinc-50 px-4 py-3 rounded-xl text-zinc-700 text-sm leading-relaxed italic">
                    <MessageSquare size={14} className="inline text-emerald-400 mr-1.5 mb-0.5" />
                    "{review.advice}"
                  </div>

                  {/* Professor Feedback */}
                  {review.professor_feedback && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Professor Insight</div>
                      <p className="text-sm text-amber-900 leading-relaxed">{review.professor_feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Write a Review Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-emerald-600 p-6 rounded-2xl text-white">
              <h3 className="font-bold text-lg mb-2">Taken this course?</h3>
              <p className="text-emerald-100 text-sm mb-5 leading-relaxed">Share your experience and help fellow students make better choices.</p>
              <button
                onClick={() => user ? setIsReviewModalOpen(true) : alert("Please sign in to write a review.")}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors text-sm"
              >
                <Plus size={16} /> Write a Review
              </button>
            </div>

            {/* Quick Stats sidebar */}
            {reviewCount > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quick Stats</h4>
                {[
                  { label: "Avg Difficulty", value: avgDifficulty ? `${avgDifficulty.toFixed(1)}/5` : "—" },
                  { label: "Avg Workload", value: avgWorkload ? `${avgWorkload.toFixed(1)}/5` : "—" },
                  { label: "Avg Exams", value: avgExams ? `${avgExams.toFixed(1)}/5` : "—" },
                  { label: "Avg Grading", value: avgGrading ? `${avgGrading.toFixed(1)}/5` : "—" },
                  { label: "Recommend", value: recommendPct !== null ? `${Math.round(recommendPct)}%` : "—" },
                  { label: "Total Reviews", value: reviewCount },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center py-2 border-b border-zinc-50 last:border-0">
                    <span className="text-xs text-zinc-500">{s.label}</span>
                    <span className="text-sm font-bold text-zinc-900">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        courseId={course.id}
        courseName={course.name}
        onSuccess={fetchData}
      />
    </div>
  );
}
