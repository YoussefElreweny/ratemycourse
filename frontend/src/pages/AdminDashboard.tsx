import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  Star,
  MessageSquare,
  Trash2,
  Search,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Shield,
  AlertCircle
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../App";

interface Review {
  id: number;
  user_name: string;
  course_name: string;
  course_code: string;
  advice: string;
  difficulty: number;
  recommend: boolean;
  term: string | null;
  created_at: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
  review_count: number;
  avg_difficulty: number | null;
  recommend_percent: number | null;
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"reviews" | "courses" | "users">("reviews");

  // Data states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({ totalCourses: 0, totalUsers: 0, totalReviews: 0 });

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch reviews with joined user and course info
      const { data: reviewData } = await supabase
        .from("reviews")
        .select(`
          id, advice, difficulty, recommend, term, created_at,
          users(name),
          courses(code, name)
        `)
        .order("created_at", { ascending: false });

      if (reviewData) {
        const mapped = reviewData.map((r: any) => ({
          id: r.id,
          user_name: r.users?.name || "Anonymous",
          course_code: r.courses?.code || "N/A",
          course_name: r.courses?.name || "Unknown",
          advice: r.advice || "",
          difficulty: r.difficulty,
          recommend: r.recommend,
          term: r.term,
          created_at: r.created_at,
        }));
        setReviews(mapped);
        setStats(prev => ({ ...prev, totalReviews: mapped.length }));
      }

      // Fetch courses with review aggregations
      const { data: courseData } = await supabase
        .from("courses")
        .select(`*, reviews(id, difficulty, recommend)`)
        .order("code");

      if (courseData) {
        const mapped = courseData.map((c: any) => {
          const revs = c.reviews || [];
          const count = revs.length;
          const avgDiff = count > 0 ? revs.reduce((a: number, r: any) => a + r.difficulty, 0) / count : null;
          const recPct = count > 0 ? (revs.filter((r: any) => r.recommend).length / count) * 100 : null;
          return { id: c.id, code: c.code, name: c.name, review_count: count, avg_difficulty: avgDiff, recommend_percent: recPct };
        });
        setCourses(mapped);
        setStats(prev => ({ ...prev, totalCourses: mapped.length }));
      }

      // Fetch users
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .order("role");

      if (userData) {
        setUsers(userData);
        setStats(prev => ({ ...prev, totalUsers: userData.length }));
      }
    } catch (e) {
      console.error("Admin data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm("Are you sure you want to delete this review? This cannot be undone.")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) setReviews(prev => prev.filter(r => r.id !== id));
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "student") => {
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const filteredReviews = reviews.filter(r =>
    r.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.advice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "reviews", label: "Reviews", count: reviews.length, icon: MessageSquare },
    { id: "courses", label: "Courses", count: courses.length, icon: BookOpen },
    { id: "users", label: "Users", count: users.length, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900">Admin Dashboard</h1>
              <p className="text-zinc-500 text-sm">Welcome back, {user?.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
            { label: "Total Reviews", value: stats.totalReviews, icon: Star, color: "bg-amber-50 text-amber-600" },
            { label: "Registered Users", value: stats.totalUsers, icon: Users, color: "bg-emerald-50 text-emerald-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900">{loading ? "—" : stat.value}</div>
                <div className="text-sm font-medium text-zinc-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(""); }}
              className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? "border-emerald-600 text-emerald-600" 
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                activeTab === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-zinc-400">
              <AlertCircle size={40} className="mx-auto mb-4 animate-pulse" />
              Loading data...
            </div>
          ) : (
            <>
              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="divide-y divide-zinc-100">
                  {filteredReviews.length === 0 ? (
                    <div className="p-20 text-center text-zinc-400">
                      <MessageSquare size={40} className="mx-auto mb-4 opacity-50" />
                      <p>No reviews found.</p>
                    </div>
                  ) : filteredReviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-zinc-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-zinc-900 text-sm">{review.user_name}</span>
                            <ChevronRight size={14} className="text-zinc-300" />
                            <span className="text-emerald-600 font-bold text-sm">{review.course_code}</span>
                            <span className="text-zinc-500 text-sm hidden sm:inline truncate max-w-[200px]">{review.course_name}</span>
                            {review.term && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase">{review.term}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              review.recommend ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                              {review.recommend ? "👍 Recommend" : "👎 Not Rec."}
                            </span>
                          </div>
                          <p className="text-zinc-600 text-sm italic leading-relaxed line-clamp-2">"{review.advice}"</p>
                          <p className="text-zinc-400 text-xs mt-2">{new Date(review.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</p>
                        </div>
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="flex items-center gap-1 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shrink-0"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Courses Tab */}
              {activeTab === "courses" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Code</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Reviews</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Difficulty</th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Recommend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-emerald-600">{course.code}</td>
                          <td className="px-6 py-4 font-medium text-zinc-900">{course.name}</td>
                          <td className="px-6 py-4 text-center text-sm text-zinc-500">{course.review_count}</td>
                          <td className="px-6 py-4 text-center">
                            {course.avg_difficulty ? (
                              <span className="text-sm font-bold text-zinc-800">{course.avg_difficulty.toFixed(1)}/5</span>
                            ) : <span className="text-zinc-300">—</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {course.recommend_percent !== null ? (
                              <span className="text-sm font-bold text-zinc-800">{Math.round(course.recommend_percent)}%</span>
                            ) : <span className="text-zinc-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <div className="divide-y divide-zinc-100">
                  {filteredUsers.length === 0 ? (
                    <div className="p-20 text-center text-zinc-400">
                      <Users size={40} className="mx-auto mb-4 opacity-50" />
                      <p>No users found.</p>
                    </div>
                  ) : filteredUsers.map((u) => (
                    <div key={u.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700 font-bold text-sm shrink-0">
                          {u.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-sm">{u.name}</div>
                          <div className="text-zinc-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          u.role === "admin" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {u.role}
                        </span>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => updateUserRole(u.id, u.role === "admin" ? "student" : "admin")}
                            className="text-xs px-3 py-1.5 border border-zinc-200 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-all font-bold"
                          >
                            {u.role === "admin" ? "Demote" : "Make Admin"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
