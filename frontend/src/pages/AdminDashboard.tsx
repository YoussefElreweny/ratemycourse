import { useState } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  MoreVertical,
  Trash2,
  Edit2,
  AlertCircle,
  Check,
  X
} from "lucide-react";

interface Suggestion {
  id: number;
  type: "course" | "professor";
  content: string;
  student: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: 1, type: "professor", content: "Add Dr. Ahmed Ali to CS101", student: "Omar Khaled", date: "2026-03-19", status: "pending" },
  { id: 2, type: "course", content: "Update prerequisites for Math 2", student: "Sara Hassan", date: "2026-03-18", status: "pending" },
  { id: 3, type: "professor", content: "Remove Dr. Ibrahim from Physics 1", student: "Youssef Ali", date: "2026-03-17", status: "pending" },
];

const MOCK_COURSES = [
  { id: "CS101", name: "Intro to Programming", year: "Level 1", semester: "Semester 1", professors: ["Dr. Ahmed", "Dr. Mona"] },
  { id: "MATH1", name: "Calculus 1", year: "Level 1", semester: "Semester 1", professors: ["Dr. Samir"] },
  { id: "PHYS1", name: "Physics 1", year: "Level 1", semester: "Semester 1", professors: ["Dr. Ibrahim"] },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"suggestions" | "courses" | "professors">("suggestions");
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

  const handleApprove = (id: number) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: "approved" } : s));
  };

  const handleReject = (id: number) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: "rejected" } : s));
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Admin Dashboard</h1>
            <p className="text-zinc-500">Manage your academic data and student suggestions.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <Plus size={20} />
            Add New Course
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Courses", value: "42", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
            { label: "Total Professors", value: "86", icon: Users, color: "bg-purple-50 text-purple-600" },
            { label: "Pending Suggestions", value: suggestions.filter(s => s.status === "pending").length.toString(), icon: AlertCircle, color: "bg-amber-50 text-amber-600" },
            { label: "Approved Changes", value: suggestions.filter(s => s.status === "approved").length.toString(), icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className={stat.color + " w-12 h-12 rounded-xl flex items-center justify-center mb-4"}>
                <stat.icon size={24} />
              </div>
              <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
              <div className="text-sm font-medium text-zinc-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 mb-8 overflow-x-auto">
          {[
            { id: "suggestions", label: "Suggestions", count: suggestions.filter(s => s.status === "pending").length },
            { id: "courses", label: "Course Manager" },
            { id: "professors", label: "Professor Manager" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id 
                  ? "border-emerald-600 text-emerald-600" 
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          {activeTab === "suggestions" && (
            <div className="divide-y divide-zinc-100">
              {suggestions.length === 0 ? (
                <div className="p-20 text-center">
                  <p className="text-zinc-400">No suggestions yet.</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        suggestion.type === "course" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      }`}>
                        {suggestion.type === "course" ? <BookOpen size={20} /> : <Users size={20} />}
                      </div>
                      <div>
                        <p className="text-zinc-900 font-bold">{suggestion.content}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                          <span className="font-medium text-zinc-700">Suggested by {suggestion.student}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300" />
                          <span>{suggestion.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {suggestion.status === "pending" ? (
                        <>
                          <button 
                            onClick={() => handleApprove(suggestion.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-all"
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button 
                            onClick={() => handleReject(suggestion.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-all"
                          >
                            <X size={16} /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                          suggestion.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {suggestion.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "courses" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Course</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Level/Semester</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Professors</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {MOCK_COURSES.map((course) => (
                    <tr key={course.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900">{course.name}</div>
                        <div className="text-xs text-zinc-500">{course.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-700">{course.year}</div>
                        <div className="text-xs text-zinc-500">{course.semester}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {course.professors.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "professors" && (
            <div className="p-20 text-center">
              <Users size={48} className="text-zinc-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-900">Professor Manager</h3>
              <p className="text-zinc-500">Manage faculty members and their assigned courses.</p>
              <button className="mt-6 px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all">
                Add Professor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
