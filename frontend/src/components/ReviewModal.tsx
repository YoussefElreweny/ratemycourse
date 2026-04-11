import { useState, FormEvent } from "react";
import { X, Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { useAuth } from "../App";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: number;
  courseName?: string;
  courses?: { id: number; name: string; code: string }[];
  onSuccess: () => void;
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  courseId: initialCourseId, 
  courseName: initialCourseName,
  courses = [],
  onSuccess
}: ReviewModalProps) {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState<number | string>(initialCourseId || "");
  const [professorName, setProfessorName] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [workload, setWorkload] = useState(3);
  const [examDifficulty, setExamDifficulty] = useState(3);
  const [gradingFairness, setGradingFairness] = useState(3);
  const [term, setTerm] = useState("Fall");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [advice, setAdvice] = useState("");
  const [professorFeedback, setProfessorFeedback] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
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
        professor_name: professorName.trim() || null,
        difficulty,
        workload,
        exam_difficulty: examDifficulty,
        grading_fairness: gradingFairness,
        term,
        recommend,
        advice,
        professor_feedback: professorFeedback || null,
        is_anonymous: isAnonymous
      }]);

      if (!error) {
        onSuccess();
        onClose();
        // Reset form
        setProfessorName("");
        setDifficulty(3);
        setWorkload(3);
        setExamDifficulty(3);
        setGradingFairness(3);
        setRecommend(null);
        setAdvice("");
        setProfessorFeedback("");
        setIsAnonymous(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Write a Review</h2>
            <p className="text-sm text-zinc-500">{initialCourseName || "Share your experience"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Post Anonymously Toggle */}
          <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
            <label htmlFor="isAnonymous" className="text-sm font-medium text-zinc-700 cursor-pointer select-none">
              Post anonymously <span className="text-zinc-400 font-normal">(hide my name from this review)</span>
            </label>
          </div>

          {/* Course Selection */}
          {!initialCourseId && (
            <div className="space-y-2">
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

          {/* Term Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">When did you take this?</label>
            <div className="flex gap-3">
              {["Fall", "Spring", "Summer"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm ${term === t ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-100 text-zinc-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Professor Name — freeform text */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Professor Name <span className="text-zinc-400 normal-case font-normal">(optional)</span></label>
            <input
              type="text"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              placeholder="e.g. Dr. Ahmed Hassan"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            />
          </div>

          {/* Professor Feedback */}
          {professorName && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Professor Feedback <span className="text-zinc-400 normal-case font-normal">(optional)</span></label>
              <textarea 
                value={professorFeedback}
                onChange={(e) => setProfessorFeedback(e.target.value)}
                placeholder="Teaching style, focus areas, exam approach, etc."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 h-20 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Ratings */}
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { label: "Difficulty", value: difficulty, setter: setDifficulty, desc: "1: Easy → 5: Hard" },
              { label: "Workload", value: workload, setter: setWorkload, desc: "1: Light → 5: Heavy" },
              { label: "Exams", value: examDifficulty, setter: setExamDifficulty, desc: "1: Easy → 5: Hard" },
              { label: "Grading", value: gradingFairness, setter: setGradingFairness, desc: "1: Harsh → 5: Fair" },
            ].map((rating, i) => (
              <div key={i} className="space-y-2">
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Would you recommend?</label>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setRecommend(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm ${recommend === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-100 text-zinc-400'}`}
                >
                  <ThumbsUp size={16} /> Yes
                </button>
                <button 
                  type="button"
                  onClick={() => setRecommend(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm ${recommend === false ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-zinc-100 text-zinc-400'}`}
                >
                  <ThumbsDown size={16} /> No
                </button>
              </div>
            </div>
          </div>

          {/* Advice */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Advice for students</label>
            <textarea 
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="What should students know before taking this course?"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 h-28 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              required
            />
          </div>
        </form>

        <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-700"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 text-sm"
          >
            {submitting ? "Submitting..." : <><Send size={16} /> Submit Review</>}
          </button>
        </div>
      </div>
    </div>
  );
}
