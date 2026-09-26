import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat otentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-900">
      <div className="w-full max-w-sm bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded bg-emerald-800 text-white font-bold flex items-center justify-center mx-auto text-base">
            S
          </div>
          <h1 className="text-xl font-bold text-slate-900 pt-2">
            {isRegister ? "Registrasi Tenaga Pendidik" : "Masuk Portal Guru"}
          </h1>
          <p className="text-xs text-slate-500">
            Semai — Menyemai generasi, mengefisiensi profesi.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label htmlFor="nameInput" className="text-xs font-semibold text-slate-700">Nama Lengkap Guru</label>
              <input
                id="nameInput"
                type="text"
                placeholder="Contoh: Rina S.Pd"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="emailInput" className="text-xs font-semibold text-slate-700">Email Sekolah / Pribadi</label>
            <input
              id="emailInput"
              type="email"
              placeholder="nama@sekolah.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="passwordInput" className="text-xs font-semibold text-slate-700">Kata Sandi</label>
            <input
              id="passwordInput"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition-colors"
            disabled={loading}
          >
            {loading ? "Memproses..." : isRegister ? "Daftar Akun Guru" : "Masuk Dashboard"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          {isRegister ? "Sudah memiliki akun?" : "Belum memiliki akun?"}{" "}
          <button
            type="button"
            className="text-emerald-800 font-bold underline ml-1"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
          >
            {isRegister ? "Masuk di sini" : "Registrasi di sini"}
          </button>
        </div>
      </div>
    </div>
  );
};
