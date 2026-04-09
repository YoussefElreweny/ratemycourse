import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Map as MapIcon, 
  Search, 
  User, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  Clock, 
  Layout, 
  LogOut,
  Menu,
  X,
  GraduationCap
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "student";
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---

const Navbar = ({ onOpenProfile }: { onOpenProfile: () => void }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
              <MapIcon size={24} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-zinc-900">UniRev</span>
              <span className="text-xs block -mt-1 text-emerald-600 font-semibold uppercase tracking-widest">Egypt</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/reviews" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Course Reviews</Link>
            <Link to="/tree" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Course Tree</Link>
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
              <Link to="/tree" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-zinc-900">Course Tree</Link>
              {user ? (
                <div className="pt-4 border-t border-zinc-100">
                  <button 
                    onClick={() => {
                      onOpenProfile();
                      setIsOpen(false);
                    }}
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
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }} 
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

const ProfilePanel = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ completed: 0, inProgress: 0 });

  useEffect(() => {
    if (user && isOpen) {
      import("./lib/supabase").then(({ supabase }) => {
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
              setStats({
                completed: statuses.completed || 0,
                inProgress: statuses.in_progress || 0
              });
            }
          });
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
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[70] flex flex-col"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Student Profile</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <User size={48} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900">{user.name}</h3>
                <p className="text-zinc-500">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {user.role} Account
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-emerald-600 mb-1"><CheckCircle2 size={20} /></div>
                  <div className="text-2xl font-bold text-emerald-900">{stats.completed}</div>
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Completed</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="text-blue-600 mb-1"><Clock size={20} /></div>
                  <div className="text-2xl font-bold text-blue-900">{stats.inProgress}</div>
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">In Progress</div>
                </div>
              </div>

              <div className="space-y-4">
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
            </div>

            <div className="p-6 border-t border-zinc-100">
              <button 
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Pages ---

import HomePage from "./pages/HomePage";
import ReviewPage from "./pages/ReviewPage";
import TreePage from "./pages/TreePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const login = async (email: string) => {
    const { supabase } = await import("./lib/supabase");
    
    // Check if user exists
    let { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!existingUser) {
      const role = email === "y.reweny@gmail.com" ? "admin" : "student";
      const { data: newUser } = await supabase
        .from("users")
        .insert([{ email, name: email.split("@")[0], role }])
        .select()
        .single();
      existingUser = newUser;
    }

    if (existingUser) {
      setUser(existingUser);
      localStorage.setItem("user", JSON.stringify(existingUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans">
          <Navbar onOpenProfile={() => setIsProfileOpen(true)} />
          <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/reviews" element={<ReviewPage />} />
              <Route path="/tree" element={<TreePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          
          <footer className="bg-white border-t border-zinc-200 py-12 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600">
                    <MapIcon size={18} />
                  </div>
                  <span className="font-bold text-zinc-900">UniRev Egypt</span>
                </div>
                <div className="flex gap-8 text-sm text-zinc-500">
                  <Link to="/" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
                  <Link to="/" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
                  <Link to="/contact" className="hover:text-emerald-600 transition-colors">Contact Us</Link>
                </div>
                <p className="text-sm text-zinc-400">© 2026 UniRev Egypt. Built for students.</p>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
