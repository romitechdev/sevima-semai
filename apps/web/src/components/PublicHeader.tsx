import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Wordmark } from "../components/Wordmark";

const LINKS = [
  { label: "Beranda", to: "/" },
  { label: "Kuis", to: "/quiz" },
  { label: "Materi", to: "/materi" },
  { label: "Tentang", to: "/tentang" },
];

interface PublicHeaderProps {
  active: string;
  showLogin?: boolean;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ active, showLogin = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" aria-label="Kembali ke beranda Semai">
          <span className="text-lg">
            <Wordmark taglineClassName="hidden sm:inline" />
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5" aria-label="Navigasi utama">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-xs transition-colors ${
                active === l.to ? "text-neutral-950 font-medium" : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {showLogin && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-sm text-xs"
              onClick={() => navigate(user ? "/dashboard" : "/login")}
            >
              {user ? "Dashboard" : "Masuk"}
            </Button>
          )}
        </nav>

        <button
          className="md:hidden flex items-center justify-center w-9 h-9 -mr-2 hover:bg-neutral-100 rounded-sm"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          aria-controls="public-menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.5" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" />
                <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav id="public-menu" className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 flex flex-col gap-1" aria-label="Navigasi menu">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={`text-sm py-2 px-2 rounded-sm ${
                active === l.to ? "text-neutral-950 font-medium" : "text-neutral-600 hover:text-neutral-950"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {showLogin && (
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(user ? "/dashboard" : "/login");
              }}
              className="text-left text-sm font-medium py-2 px-2 mt-1 rounded-sm bg-neutral-900 text-white"
            >
              {user ? "Buka Dashboard" : "Masuk Pengajar"}
            </button>
          )}
        </nav>
      )}
    </header>
  );
};
