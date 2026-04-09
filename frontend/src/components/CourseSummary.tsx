import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, MessageSquareQuote } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CourseSummaryProps {
  courseName: string;
  reviews: any[];
}

export default function CourseSummary({ courseName, reviews }: CourseSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (reviews.length === 0) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Summarize the student reviews for the course "${courseName}". 
        Focus on the overall sentiment, common advice, and what to watch out for.
        Keep it concise and helpful for a student considering taking this course.
        
        Reviews:
        ${reviews.map(r => `- ${r.advice}`).join('\n')}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setSummary(response.text || "Could not generate summary.");
    } catch (e) {
      console.error(e);
      setSummary("Failed to generate AI summary. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={20} />
          AI Course Summary
        </h2>
        {!summary && !loading && (
          <button 
            onClick={generateSummary}
            disabled={reviews.length === 0}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest disabled:opacity-50"
          >
            Generate
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center justify-center gap-4 text-zinc-400"
          >
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Analyzing {reviews.length} reviews...</p>
          </motion.div>
        ) : summary ? (
          <motion.div 
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 relative">
              <MessageSquareQuote className="absolute -top-3 -left-3 text-emerald-200" size={32} />
              <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
            </div>
            <button 
              onClick={() => setSummary(null)}
              className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors"
            >
              Regenerate
            </button>
          </motion.div>
        ) : (
          <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-sm text-zinc-500">
              {reviews.length > 0 
                ? "Get an AI-powered summary of what students are saying." 
                : "Not enough reviews to generate a summary."}
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
