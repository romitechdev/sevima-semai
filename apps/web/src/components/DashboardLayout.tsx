import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Kuis Formatif", path: "/create", icon: "✏️" },
    { label: "Materi Ajar AI", path: "/material", icon: "📚" },
    { label: "Penilaian Khusus P5", path: "/assessment", icon: "📈" },
    { label: "Koreksi Esai AI", path: "/essay", icon: "✍️" },
    { label: "Arsip Dokumentasi", path: "/documents", icon: "📁" },
    { label: "Gradebook & Rapor", path: "/gradebook", icon: "🎓" },
  ];

  return (
    <div className="min-h-screen bg-[#eef2f6] text-slate-800 flex flex-col font-sans">
      {/* Berry Header */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-bold text-sm"
          >
            ☰
          </button>
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-deep-purple-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              S
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Semai <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">BERRY OS</span>
            </span>
          </div>
        </div>

        {/* Right Header User Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">{user?.email?.split("@")[0]}</span>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase">Guru Pengajar</span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center border border-indigo-200 shadow-2xs">
            {user?.email?.charAt(0).toUpperCase() || "G"}
          </div>

          <button
            onClick={() => signOut()}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all text-xs font-bold"
            title="Keluar"
          >
            Logout ➔
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Berry Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0 -translate-x-full"
          } transition-all duration-300 bg-white border-r border-slate-200/80 overflow-y-auto flex flex-col justify-between p-4 sticky top-16 h-[calc(100vh-4rem)] z-20 shrink-0`}
        >
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Dashboard & Alat AI
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 shadow-2xs font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Berry Promo/Agent Callout Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                Semai Agent OS
              </div>
              <div className="text-sm font-extrabold mb-1">OmniRoute Qwen</div>
              <p className="text-[11px] opacity-90 leading-relaxed mb-3">
                Ekosistem pintar guru untuk kuis, materi & rapor Kurikulum Merdeka.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-1.5 bg-white text-indigo-700 rounded-lg text-xs font-extrabold hover:bg-indigo-50 transition-all shadow-xs"
              >
                Command Center →
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center py-2 border-t border-slate-100">
            Berry UI Theme • Semai 🌱
          </div>
        </aside>

        {/* Content Canvas */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
