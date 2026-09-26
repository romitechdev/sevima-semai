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
    { label: "Ringkasan", path: "/dashboard" },
    { label: "Kuis Formatif", path: "/create" },
    { label: "Materi Ajar AI", path: "/material" },
    { label: "Penilaian Khusus P5", path: "/assessment" },
    { label: "Koreksi Esai AI", path: "/essay" },
    { label: "Arsip Dokumentasi", path: "/documents" },
    { label: "Gradebook & Rapor", path: "/gradebook" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors text-sm font-medium"
            aria-label="Toggle Sidebar"
          >
            Menu
          </button>
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Semai <span className="text-xs font-normal text-slate-500">v1.0</span>
            </span>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800">{user?.email}</span>
            <span className="text-[11px] text-slate-500">Tenaga Pendidik</span>
          </div>

          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-medium border border-slate-200"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-60" : "w-0 -translate-x-full"
          } transition-all duration-200 bg-white border-r border-slate-200 overflow-y-auto flex flex-col justify-between p-4 sticky top-16 h-[calc(100vh-4rem)] z-20 shrink-0`}
        >
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Navigasi Utama
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center px-3 py-2 rounded font-medium text-xs transition-colors ${
                        isActive
                          ? "bg-slate-100 text-emerald-800 font-bold border-l-2 border-emerald-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center py-2 border-t border-slate-100">
            Semai — Sistem Pembelajaran Terpadu
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
