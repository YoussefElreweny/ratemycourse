import React from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Star, 
  User, 
  CheckCircle2, 
  Clock, 
  Layout, 
  LogOut,
  Menu,
  X,
  GraduationCap
} from "lucide-react";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";

// --- Types ---
interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "student";
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Protected Route ---
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-20 text-center text-zinc-400">Loading...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

// --- Navbar ---
const Navbar = ({ onOpenProfile }: { onOpenProfile: () => void }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
              <Star size={24} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-zinc-900">RateMyCourse</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/reviews" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Course Reviews</Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                <Layout size={16} /> Admin
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-zinc-200">
                <button 
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 hover:bg-zinc-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700">{user.name}</span>
                </button>
                <button onClick={logout} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
                Sign In
              </Link>
            )}
          </div>

          <button className="md:hidden text-zinc-600" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-zinc-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/reviews" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-zinc-900">Course Reviews</Link>
              {user?.role === "admin" && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-emerald-600">Admin Dashboard</Link>
              )}
              {user ? (
                <div className="pt-4 border-t border-zinc-100">
                  <button 
                    onClick={() => { onOpenProfile(); setIsOpen(false); }}
                    className="flex items-center gap-3 mb-4 w-full text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900">{user.name}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => { logout(); setIsOpen(false); }} 
                    className="flex items-center gap-2 text-red-500 font-medium"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center py-3 bg-zinc-900 text-white rounded-xl">Sign In</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Profile Panel ---
const ProfilePanel = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ completed: 0, inProgress: 0, reviews: 0 });

  useEffect(() => {
    if (user && isOpen) {
      supabase
        .from("user_courses")
        .select("status")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) {
            const statuses = data.reduce((acc: any, curr: any) => {
              acc[curr.status] = (acc[curr.status] || 0) + 1;
              return acc;
            }, {});
            setStats(prev => ({
              ...prev,
              completed: statuses.completed || 0,
              inProgress: statuses.in_progress || 0
            }));
          }
        });

      supabase
        .from("reviews")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .then(({ count }) => {
          setStats(prev => ({ ...prev, reviews: count || 0 }));
        });
    }
  }, [user, isOpen]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-zinc-900">My Profile</h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-2xl mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 text-2xl font-bold">
                  {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-lg">{user.name}</div>
                  <div className="text-zinc-500 text-sm">{user.email}</div>
                  {user.role === "admin" && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Admin</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Reviews", value: stats.reviews, icon: Star, color: "text-amber-500 bg-amber-50" },
                  { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                  { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-blue-600 bg-blue-50" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="p-4 bg-zinc-50 rounded-2xl text-center">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={20} />
                    </div>
                    <div className="text-2xl font-bold text-zinc-900">{value}</div>
                    <div className="text-xs text-zinc-500 font-medium">{label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-8">
                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Academic Info</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                    <span className="text-sm text-zinc-500">University</span>
                    <span className="text-sm font-bold text-zinc-900">Ain Shams University</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                    <span className="text-sm text-zinc-500">Faculty</span>
                    <span className="text-sm font-bold text-zinc-900">Engineering</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { logout(); onClose(); }}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-colors border border-red-100"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Page Imports ---
import HomePage from "./pages/HomePage";
import ReviewPage from "./pages/ReviewPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Clean the /#hash URL after Google OAuth redirect
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes("access_token")) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    // Set user immediately from session — don't block on DB
    const setUserFromSession = (session: any) => {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const su = session.user;
      const email = su.email || "";
      const name =
        su.user_metadata?.full_name ||
        su.user_metadata?.name ||
        email.split("@")[0];

      // Set immediately so the navbar updates right away
      const role: "admin" | "student" = email === "y.reweny@gmail.com" ? "admin" : "student";
      setUser({ id: su.id, email, name, role });
      setLoading(false);

      // Sync with DB in background (to pick up actual role if changed)
      supabase
        .from("users")
        .select("role")
        .eq("email", email)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.role) {
            setUser(prev => prev ? { ...prev, role: data.role } : null);
          } else {
            // First time: insert profile
            supabase.from("users").upsert(
              [{ id: su.id, email, name, role }],
              { onConflict: "email" }
            ).then(() => {});
          }
        });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserFromSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };


  return (
    <AuthContext.Provider value={{ user, session, logout, loading }}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans">
          <Navbar onOpenProfile={() => setIsProfileOpen(true)} />
          <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/reviews" element={<ReviewPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Routes>
          </main>
          
          <footer className="bg-white border-t border-zinc-200 py-12 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600">
                    <Star size={18} />
                  </div>
                  <span className="font-bold text-zinc-900">RateMyCourse</span>
                </div>
                <div className="flex gap-8 text-sm text-zinc-500">
                  <Link to="/" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
                  <Link to="/" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
                  <Link to="/contact" className="hover:text-emerald-600 transition-colors">Contact Us</Link>
                </div>
                <p className="text-sm text-zinc-400">© 2026 RateMyCourse. Built for students.</p>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
