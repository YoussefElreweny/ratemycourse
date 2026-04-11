import { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  Star,
  MessageSquare,
  Trash2,
  Search,
  ChevronRight,
  Shield,
  AlertCircle,
  RefreshCw,
  Filter,
  Mail
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";

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
  department_name: string;
  level: number;
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
}

const levels = [
  { id: 0, name: "Freshman" },
  { id: 1, name: "Sophomore" },
  { id: 2, name: "Junior" },
  { id: 3, name: "Senior" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"reviews" | "courses" | "users" | "messages">("reviews");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [stats, setStats] = useState({ totalCourses: 0, totalUsers: 0, totalReviews: 0, totalMessages: 0 });

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/"); return; }
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Reviews
      const { data: reviewData, error: revErr } = await supabase
        .from("reviews")
        .select(`id, advice, difficulty, recommend, term, created_at, is_anonymous, users(name), courses(code, name)`)
        .order("created_at", { ascending: false });

      if (revErr) console.error("Reviews fetch error:", revErr);
      if (reviewData) {
        const mapped = reviewData.map((r: any) => ({
          id: r.id,
          user_name: r.is_anonymous ? "Anonymous" : (r.users?.name || "Anonymous"),
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

      // Departments (for filter)
      const { data: deptData } = await supabase.from("departments").select("id, name").order("name");
      if (deptData) setDepartments(deptData);

      // Courses with department info via program_courses
      const { data: pcData, error: pcErr } = await supabase
        .from("program_courses")
        .select(`semester, program_id, course:courses(*, reviews(id, difficulty, recommend))`)
        .order("semester");

      if (pcErr) console.error("Courses fetch error:", pcErr);
      if (pcData) {
        const deptMap = Object.fromEntries((deptData || []).map(d => [d.id, d.name]));
        const uniqueMap = new Map<number, Course>();
        pcData.forEach((pc: any) => {
          const c = pc.course;
          if (!c || uniqueMap.has(c.id)) return;
          const revs = c.reviews || [];
          const count = revs.length;
          const avgDiff = count > 0 ? revs.reduce((a: number, r: any) => a + r.difficulty, 0) / count : null;
          const recPct = count > 0 ? (revs.filter((r: any) => r.recommend).length / count) * 100 : null;
          uniqueMap.set(c.id, {
            id: c.id, code: c.code, name: c.name,
            review_count: count, avg_difficulty: avgDiff, recommend_percent: recPct,
            department_name: deptMap[pc.program_id] || "General",
            level: Math.floor(((pc.semester || 1) - 1) / 2),
          });
        });
        const mapped = Array.from(uniqueMap.values());
        setCourses(mapped);
        setStats(prev => ({ ...prev, totalCourses: mapped.length }));
      }

      // Users
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("id, email, name, role")
        .order("role");

      if (userData) {
        setUsers(userData);
        setStats(prev => ({ ...prev, totalUsers: userData.length }));
      }

      // Contact Messages
      const { data: contactData, error: contactErr } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (contactErr) console.error("Contact messages fetch error:", contactErr);
      if (contactData) {
        setMessages(contactData);
        setStats(prev => ({ ...prev, totalMessages: contactData.length }));
      }
    } catch (e) {
      console.error("Admin data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) {
      setReviews(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, totalReviews: prev.totalReviews - 1 }));
    } else { alert("Failed to delete review."); }
  };

  const deleteCourse = async (id: number, code: string) => {
    if (!confirm(`Delete course ${code}? This will also delete all its reviews.`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (!error) {
      setCourses(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, totalCourses: prev.totalCourses - 1 }));
    } else { alert("Failed to delete course."); }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user ${name}? This will also delete all their reviews.`)) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } else { alert("Failed to delete user."); }
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "student") => {
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== id));
      setStats(prev => ({ ...prev, totalMessages: prev.totalMessages - 1 }));
    } else { alert("Failed to delete message."); }
  };

  // Filtered data
  const filteredReviews = reviews.filter(r =>
    r.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.advice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === null || c.department_name === departments.find(d => d.id === selectedDept)?.name;
    const matchesLevel = selectedLevel === null || c.level === selectedLevel;
    return matchesSearch && matchesDept && matchesLevel;
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "reviews", label: "Reviews", count: reviews.length, icon: MessageSquare },
    { id: "courses", label: "Courses", count: courses.length, icon: BookOpen },
    { id: "users", label: "Users", count: users.length, icon: Users },
    { id: "messages", label: "Messages", count: messages.length, icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">Admin Dashboard</h1>
              <p className="text-zinc-500 text-sm">Welcome back, {user?.name}</p>
            </div>
          </div>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          {[
            { label: "Courses", value: stats.totalCourses, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
            { label: "Reviews", value: stats.totalReviews, icon: Star, color: "bg-amber-50 text-amber-600" },
            { label: "Users", value: stats.totalUsers, icon: Users, color: "bg-emerald-50 text-emerald-600" },
            { label: "Messages", value: stats.totalMessages, icon: Mail, color: "bg-purple-50 text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900">{loading ? "—" : stat.value}</div>
                <div className="text-xs sm:text-sm font-medium text-zinc-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
            />
          </div>
          {activeTab === "courses" && (
            <>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <select
                  value={selectedDept || ""}
                  onChange={(e) => setSelectedDept(e.target.value ? parseInt(e.target.value) : null)}
                  className="pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none appearance-none font-medium text-zinc-600 text-sm min-w-[160px]"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <select
                  value={selectedLevel !== null ? selectedLevel : ""}
                  onChange={(e) => setSelectedLevel(e.target.value !== "" ? parseInt(e.target.value) : null)}
                  className="pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none appearance-none font-medium text-zinc-600 text-sm min-w-[140px]"
                >
                  <option value="">All Levels</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(""); setSelectedDept(null); setSelectedLevel(null); }}
              className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
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
                    <div key={review.id} className="p-4 sm:p-6 hover:bg-zinc-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-zinc-900 text-sm">{review.user_name}</span>
                            <ChevronRight size={14} className="text-zinc-300" />
                            <span className="text-emerald-600 font-bold text-sm">{review.course_code}</span>
                            <span className="text-zinc-400 text-xs hidden sm:inline truncate max-w-[180px]">{review.course_name}</span>
                            {review.term && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase">{review.term}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              review.recommend ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                              {review.recommend ? "👍 Rec." : "👎 Not Rec."}
                            </span>
                          </div>
                          <p className="text-zinc-600 text-sm italic leading-relaxed line-clamp-2">"{review.advice}"</p>
                          <p className="text-zinc-400 text-xs mt-1.5">{new Date(review.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</p>
                        </div>
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shrink-0 self-start"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Courses Tab */}
              {activeTab === "courses" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Code</th>
                        <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Name</th>
                        <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Dept</th>
                        <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Reviews</th>
                        <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Diff.</th>
                        <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Rec.</th>
                        <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-emerald-600 text-sm">{course.code}</td>
                          <td className="px-5 py-4 font-medium text-zinc-900 text-sm">{course.name}</td>
                          <td className="px-5 py-4 text-xs text-zinc-400">{course.department_name}</td>
                          <td className="px-5 py-4 text-center text-sm text-zinc-500">{course.review_count}</td>
                          <td className="px-5 py-4 text-center">
                            {course.avg_difficulty ? (
                              <span className="text-sm font-bold text-zinc-800">{course.avg_difficulty.toFixed(1)}/5</span>
                            ) : <span className="text-zinc-300">—</span>}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {course.recommend_percent !== null ? (
                              <span className="text-sm font-bold text-zinc-800">{Math.round(course.recommend_percent)}%</span>
                            ) : <span className="text-zinc-300">—</span>}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => deleteCourse(course.id, course.code)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
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
                    <div key={u.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700 font-bold text-xs shrink-0">
                          {u.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-sm">{u.name}</div>
                          <div className="text-zinc-400 text-xs">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          u.role === "admin" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {u.role}
                        </span>
                        {u.id !== user?.id && (
                          <>
                            <button
                              onClick={() => updateUserRole(u.id, u.role === "admin" ? "student" : "admin")}
                              className="text-xs px-3 py-1.5 border border-zinc-200 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-all font-bold"
                            >
                              {u.role === "admin" ? "Demote" : "Make Admin"}
                            </button>
                            <button
                              onClick={() => deleteUser(u.id, u.name)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-100"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === "messages" && (
                <div className="divide-y divide-zinc-100">
                  {filteredMessages.length === 0 ? (
                    <div className="p-20 text-center text-zinc-400">
                      <Mail size={40} className="mx-auto mb-4 opacity-50" />
                      <p>No messages found.</p>
                    </div>
                  ) : filteredMessages.map((m) => (
                    <div key={m.id} className="p-4 sm:p-6 hover:bg-zinc-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-zinc-900 text-sm">{m.name}</span>
                            <span className="text-zinc-400 text-xs px-2 py-0.5 bg-zinc-100 rounded-lg">{m.email}</span>
                            <span className="text-zinc-400 text-[10px] ml-auto">
                              {new Date(m.created_at).toLocaleDateString("en-GB", { 
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {m.message}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shrink-0 self-start mt-2 sm:mt-0"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
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
