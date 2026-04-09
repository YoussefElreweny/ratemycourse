import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { useAuth } from "../App";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: number;
  courseName?: string;
  courses?: { id: number; name: string; code: string }[];
  professorId?: number;
  professorName?: string;
  professors?: { id: number; name: string }[];
  onSuccess: () => void;
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  courseId: initialCourseId, 
  courseName: initialCourseName,
  courses = [],
  professorId: initialProfessorId,
  professorName,
  professors = [],
  onSuccess
}: ReviewModalProps) {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState<number | string>(initialCourseId || "");
  const [professorId, setProfessorId] = useState<number | string>(initialProfessorId || "");
  const [difficulty, setDifficulty] = useState(3);
  const [workload, setWorkload] = useState(3);
  const [examDifficulty, setExamDifficulty] = useState(3);
  const [gradingFairness, setGradingFairness] = useState(3);
  const [attendanceStrictness, setAttendanceStrictness] = useState(3);
  const [term, setTerm] = useState("Fall");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [advice, setAdvice] = useState("");
  const [professorFeedback, setProfessorFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to submit a review.");
    if (!courseId) return alert("Please select a course.");
    if (recommend === null) return alert("Please specify if you recommend this.");

    setSubmitting(true);
    try {
      const { supabase } = await import("../lib/supabase");
      const { error } = await supabase.from('reviews').insert([{
        user_id: user.id,
        course_id: parseInt(courseId.toString()),
        professor_id: professorId ? parseInt(professorId.toString()) : null,
        difficulty,
        workload,
        exam_difficulty: examDifficulty,
        grading_fairness: gradingFairness,
        attendance_strictness: attendanceStrictness,
        term,
        recommend,
        advice,
        professor_feedback: professorFeedback || null
      }]);

      if (!error) {
        onSuccess();
        onClose();
      } else {
        console.error(error);
        alert("Failed to submit review.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Write a Review</h2>
                <p className="text-sm text-zinc-500">{initialCourseName || "Share your experience"}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Course Selection */}
              {!initialCourseId && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Course</label>
                  <select 
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Professor Selection */}
              {/* Term Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">When did you take this?</label>
                <div className="flex gap-4">
                  {["Fall", "Spring", "Summer"].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTerm(t)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${term === t ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {!initialProfessorId && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Professor (Optional)</label>
                  <select 
                    value={professorId}
                    onChange={(e) => setProfessorId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select a professor</option>
                    {professors.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {initialProfessorId && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Reviewing</span>
                  <span className="font-bold text-emerald-900">{professorName}</span>
                </div>
              )}

              {/* Professor Feedback (Optional) */}
              {professorId && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Professor Feedback (Optional)</label>
                  <textarea 
                    value={professorFeedback}
                    onChange={(e) => setProfessorFeedback(e.target.value)}
                    placeholder="What should students know about this professor's teaching style, focus, etc.?"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 h-24 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  { label: "Easiness", value: 6 - difficulty, setter: (v: number) => setDifficulty(6 - v), desc: "1: Hard, 5: Easy" },
                  { label: "Workload", value: workload, setter: setWorkload, desc: "1: Low, 5: High" },
                  { label: "Exams", value: examDifficulty, setter: setExamDifficulty, desc: "1: Easy, 5: Hard" },
                  { label: "Grading", value: gradingFairness, setter: setGradingFairness, desc: "1: Harsh, 5: Fair" },
                ].map((rating, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">{rating.label}</label>
                      <span className="text-emerald-600 font-bold">{rating.value}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      value={rating.value}
                      onChange={(e) => rating.setter(parseInt(e.target.value))}
                      className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium uppercase">{rating.desc}</p>
                  </div>
                ))}

                {/* Recommendation */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Would you recommend?</label>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setRecommend(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${recommend === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                    >
                      <ThumbsUp size={18} /> Yes
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRecommend(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${recommend === false ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                    >
                      <ThumbsDown size={18} /> No
                    </button>
                  </div>
                </div>
              </div>

              {/* Advice */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Advice for students</label>
                <textarea 
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="What should students know before taking this course with this professor?"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 h-32 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  required
                />
              </div>
            </form>

            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex justify-end gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Submitting..." : <><Send size={18} /> Submit Review</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
