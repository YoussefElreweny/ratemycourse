
import { Link } from "react-router-dom";
import { ChevronRight, Star, GraduationCap, Search, ThumbsUp, MessageSquare, BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-zinc-900 mb-6 sm:mb-8">
              RateMy<span className="text-emerald-600">Course</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-500 mb-8 sm:mb-12 leading-relaxed font-medium px-2">
              Join thousands of students sharing their experiences,
              find the best professors, and choose your courses with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                to="/reviews"
                className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg sm:text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
              >
                <Search size={22} />
                Find a Course
              </Link>
              <Link
                to="/reviews"
                className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-white text-zinc-900 border-2 border-zinc-100 rounded-2xl font-bold text-lg sm:text-xl hover:bg-zinc-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 shadow-lg shadow-zinc-100"
              >
                <Star size={22} className="text-yellow-500 fill-yellow-500" />
                Write a Review
              </Link>
            </div>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-60" />
        </div>
      </section>


      {/* Supported University */}
      <section className="py-20 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-900 rounded-[40px] sm:rounded-[50px] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">Starting with the best.</h2>
            <p className="text-zinc-400 text-lg sm:text-xl mb-8 sm:mb-12 max-w-2xl mx-auto">
              We are currently focused on providing the most detailed course data for Ain Shams University.
            </p>
            <Link to="/reviews" className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 sm:p-8 bg-zinc-800 border border-zinc-700 rounded-3xl hover:border-emerald-500 transition-all group w-full sm:w-auto">
              <div className="w-12 h-12 bg-zinc-700 rounded-2xl flex items-center justify-center text-white group-hover:bg-emerald-600 transition-colors shrink-0">
                <GraduationCap size={24} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-white">Ain Shams University</h3>
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
