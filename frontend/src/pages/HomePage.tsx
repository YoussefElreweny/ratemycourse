import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ChevronRight, Map as MapIcon, Star, Layout, GraduationCap, Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 mb-6">
              Now live for Ain Shams University
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 mb-6">
              Plan smarter. <br />
              <span className="text-emerald-600">Choose better.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-zinc-500 mb-10 leading-relaxed">
              Built by students, for students. Navigate your degree with interactive course trees
              and course reviews.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/tree"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <Layout size={20} />
                Open Interactive Tree
              </Link>
              <Link
                to="/reviews"
                className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 border border-zinc-200 rounded-xl font-bold text-lg hover:bg-zinc-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <Star size={20} className="text-yellow-500" />
                Explore Reviews
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <Layout size={32} />
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                Visualize Your <br /> Academic Journey
              </h2>
              <p className="text-lg text-zinc-500 leading-relaxed">
                No more static PDFs. Our interactive vertical course tree lets you drag nodes between levels,
                visualize prerequisites, and track your progress in real-time.
                See exactly what you need to take next.
              </p>
              <ul className="space-y-4">
                {[
                  "Visual prerequisite mapping",
                  "Drag-and-drop planning",
                  "Status tracking (Completed, In Progress)",
                  "Custom layout saving"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ChevronRight size={14} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square bg-zinc-50 rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Mock Tree UI */}
                <div className="w-4/5 space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg" />
                      <div>
                        <div className="h-3 w-24 bg-zinc-200 rounded mb-2" />
                        <div className="h-2 w-16 bg-zinc-100 rounded" />
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-emerald-500" />
                  </div>
                  <div className="ml-12 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-300 rounded-lg" />
                      <div>
                        <div className="h-3 w-24 bg-zinc-200 rounded mb-2" />
                        <div className="h-2 w-16 bg-zinc-100 rounded" />
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-zinc-200" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* University Selection */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">Supported Universities</h2>
          <p className="text-zinc-500">We're starting with the top faculties in Egypt.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/reviews" className="p-8 bg-white border border-zinc-200 rounded-2xl hover:border-emerald-500 transition-all hover:shadow-lg cursor-pointer group">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600 mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Ain Shams University</h3>
            <p className="text-zinc-500 text-sm mb-4">Faculty of Engineering</p>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              Explore Reviews <ChevronRight size={16} />
            </div>
          </Link>

          <div className="p-8 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
            <h3 className="text-lg font-bold text-zinc-400 mb-2">More Universities</h3>
            <p className="text-zinc-400 text-sm italic">Coming Soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}
