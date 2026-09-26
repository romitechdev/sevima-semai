import React, { useState, useEffect } from "react";
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

  // On mobile: sidebar closed by default; on desktop: open by default
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar when resizing to mobile, auto-open on desktop
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when navigating on mobile
  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

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
      <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 w-full">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded hover:bg-neutral-100 text-neutral-600 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
            aria-expanded={sidebarOpen}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">S</div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-semibold text-neutral-900">Semai</span>
              <span className="hidden sm:inline text-xs text-neutral-400">v1.0</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="hidden sm:flex flex-col items-end min-w-0">
            <span className="text-xs text-neutral-700 truncate max-w-[160px]">{user?.email}</span>
            <span className="text-xs text-neutral-400">Tenaga Pendidik</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()} className="flex-shrink-0">
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 w-full relative">
        {/* Mobile overlay backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-neutral-200 flex flex-col justify-between flex-shrink-0 transition-all duration-200 z-30",
            // Mobile: fixed drawer overlay; Desktop: sticky inline sidebar
            isMobile
              ? cn(
                  "fixed top-16 left-0 h-[calc(100vh-4rem)]",
                  sidebarOpen ? "w-64 p-4 shadow-xl" : "w-0 p-0 overflow-hidden"
                )
              : cn(
                  "sticky top-16 h-[calc(100vh-4rem)]",
                  sidebarOpen ? "w-60 p-4" : "w-0 p-0 overflow-hidden"
                )
          )}
        >
          <div className="min-w-[13rem]">
            <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
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

          <p className="text-xs text-neutral-400 text-center py-2 border-t border-neutral-100 whitespace-nowrap min-w-[13rem]">
            Semai · Sistem Pembelajaran Terpadu
          </p>
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
