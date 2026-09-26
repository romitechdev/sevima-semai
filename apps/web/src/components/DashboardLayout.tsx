import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Wordmark } from "./Wordmark";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { label: "Ringkasan", path: "/dashboard" },
  { label: "Kuis Formatif", path: "/create" },
  { label: "Materi Ajar AI", path: "/material" },
  { label: "Koreksi Esai AI", path: "/essay" },
  { label: "Arsip Dokumentasi", path: "/documents" },
  { label: "Gradebook & Rapor", path: "/gradebook" },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
      setTimeout(() => mainRef.current?.focus(), 50);
    }
  };

  const isDrawerOpen = isMobile && sidebarOpen;

  return (
    <div className="min-dvh bg-neutral-50 text-neutral-900 flex flex-col w-full">
      <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 w-full">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-md hover:bg-neutral-100 text-neutral-600 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-nav"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Kembali ke dashboard Semai"
            className="text-lg hover:opacity-80 transition-opacity rounded-md"
          >
            <Wordmark />
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="hidden sm:flex flex-col items-end min-w-0">
            <span className="text-sm font-medium text-neutral-800 truncate max-w-[200px]">{user?.email}</span>
            <span className="text-xs text-neutral-500">Tenaga Pendidik</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()} className="flex-shrink-0">
            Keluar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 w-full relative">
        <aside
          id="sidebar-nav"
          className={cn(
            "bg-white border-r border-neutral-200 flex flex-col justify-between flex-shrink-0 z-30",
            isMobile
              ? cn(
                  "fixed top-16 left-0 sidebar-transition",
                  isDrawerOpen ? "w-64 p-3 shadow-xl" : "w-0 p-0 overflow-hidden"
                )
              : cn(
                  "sticky top-16 sidebar-transition",
                  sidebarOpen ? "w-60 p-3" : "w-0 p-0 overflow-hidden"
                )
          )}
          style={{ height: "calc(100dvh - 4rem)" }}
          aria-label="Navigasi utama"
          aria-hidden={isMobile && !sidebarOpen}
        >
          <nav aria-label="Menu halaman" className="min-w-[13rem]">
            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavClick(item.path)}
                      aria-current={isActive ? "page" : undefined}
                      tabIndex={isMobile && !sidebarOpen ? -1 : 0}
                      className={cn(
                        "w-full text-left pl-3 pr-2 py-2 rounded-md text-sm transition-colors whitespace-nowrap flex items-center gap-2.5",
                        isActive
                          ? "bg-primary/8 font-semibold text-primary"
                          : "font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1 h-4 rounded-full flex-shrink-0 transition-colors",
                          isActive ? "bg-primary" : "bg-transparent"
                        )}
                        aria-hidden="true"
                      />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="text-xs text-neutral-400 px-3 py-3 border-t border-neutral-100 whitespace-nowrap min-w-[13rem]" aria-hidden="true">
            Semai, Sistem Pembelajaran Terpadu
          </p>
        </aside>

        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden min-w-0 focus-visible:outline-none"
          {...(isDrawerOpen ? { inert: true } : {})}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
