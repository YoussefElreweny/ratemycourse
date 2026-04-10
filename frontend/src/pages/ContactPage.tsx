
import { Mail, Phone, MapPin, Send, MessageSquare, Globe } from "lucide-react";
import { useState, FormEvent } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-6">
              Get in <span className="text-emerald-600">touch.</span>
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed">
              Have you spotted a bug? Want to see your university added? 
              Or maybe you have an idea to make CourseMap even better? 
              We'd love to hear from you!
            </p>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-200 shadow-sm">
          {submitted ? (
            <div className="text-center py-16 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <Send size={40} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-3">Message Sent!</h2>
              <p className="text-zinc-500 mb-8">
                Thanks for reaching out. We'll get back to you soon!
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Email</label>
                  <input 
                    required
                    type="email" 
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">How can we help?</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="Tell us about a bug, a new university, or your ideas..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
