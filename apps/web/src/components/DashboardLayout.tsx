import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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
    { label: "Koreksi Esai AI", path: "/essay" },
    { label: "Arsip Dokumentasi", path: "/documents" },
    { label: "Gradebook & Rapor", path: "/gradebook" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col w-full">
      {/* Header */}
      <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between sticky top-0 z-30 w-full">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded hover:bg-neutral-100 text-neutral-600 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">S</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-neutral-900">Semai</span>
              <span className="text-xs text-neutral-400">v1.0</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-neutral-700">{user?.email}</span>
            <span className="text-xs text-neutral-400">Tenaga Pendidik</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 w-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-neutral-200 overflow-hidden flex flex-col justify-between sticky top-16 z-20 flex-shrink-0 transition-all duration-200",
            sidebarOpen ? "w-60 p-4" : "w-0 p-0"
          )}
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <div>
            <p className="sr-only">Navigasi utama</p>
            <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-neutral-700 hover:bg-neutral-100"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <p className="text-xs text-neutral-400 text-center py-2 border-t border-neutral-100">
            Semai · Sistem Pembelajaran Terpadu
          </p>
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 p-6 max-w-6xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
