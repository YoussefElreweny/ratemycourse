import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ChevronRight, Star, GraduationCap, Search, ThumbsUp, MessageSquare, BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >

            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-zinc-900 mb-8">
              RateMy<span className="text-emerald-600">Course</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-zinc-500 mb-12 leading-relaxed font-medium">
              Join thousands of students sharing their experiences,
              find the best professors, and choose your courses with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                to="/reviews"
                className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                <Search size={22} />
                Find a Course
              </Link>
              <Link
                to="/reviews"
                className="w-full sm:w-auto px-10 py-5 bg-white text-zinc-900 border-2 border-zinc-100 rounded-2xl font-bold text-xl hover:bg-zinc-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-lg shadow-zinc-100"
              >
                <Star size={22} className="text-yellow-500 fill-yellow-500" />
                Write a Review
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-60" />
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-20 bg-emerald-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: "Active Users", val: "5,000+" },
              { label: "Course Reviews", val: "12,000+" },
              { label: "Professors", val: "800+" },
              { label: "Departments", val: "45+" }
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-black mb-2">{s.val}</div>
                <div className="text-emerald-300 font-bold uppercase tracking-widest text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-zinc-900 mb-4 uppercase tracking-tight">Why RateMyCourse?</h2>
            <div className="h-1.5 w-24 bg-emerald-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 bg-zinc-50 rounded-[40px] border border-zinc-100 hover:border-emerald-200 transition-all group">
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform">
                <ThumbsUp size={32} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Unbiased Insights</h3>
              <p className="text-zinc-500 leading-relaxed font-medium">
                Get real feedback from students who actually took the course. Learn about the difficulty, workload, and grading style.
              </p>
            </div>

            <div className="p-10 bg-zinc-50 rounded-[40px] border border-zinc-100 hover:border-emerald-200 transition-all group">
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Professor Reviews</h3>
              <p className="text-zinc-500 leading-relaxed font-medium">
                Find out which professors explain well and who is fair in exams. Our professor-specific feedback is second to none.
              </p>
            </div>

            <div className="p-10 bg-zinc-50 rounded-[40px] border border-zinc-100 hover:border-emerald-200 transition-all group">
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform">
                <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Plan Your Semester</h3>
              <p className="text-zinc-500 leading-relaxed font-medium">
                See course metrics like Interest and Usefulness at a glance to build a schedule that you'll actually enjoy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported University */}
      <section className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-900 rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Starting with the best.</h2>
            <p className="text-zinc-400 text-xl mb-12 max-w-2xl mx-auto">
              We are currently focused on providing the most detailed course data for Ain Shams University.
            </p>
            <Link to="/reviews" className="inline-flex items-center gap-4 p-8 bg-zinc-800 border border-zinc-700 rounded-3xl hover:border-emerald-500 transition-all group">
              <div className="w-12 h-12 bg-zinc-700 rounded-2xl flex items-center justify-center text-white group-hover:bg-emerald-600 transition-colors">
                <GraduationCap size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white">Ain Shams University</h3>
                <p className="text-zinc-500 text-sm">Faculty of Engineering</p>
              </div>
              <ChevronRight size={24} className="text-zinc-600 group-hover:text-emerald-500 transition-colors ml-4" />
            </Link>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
      </section>
    </div>
  );
}
