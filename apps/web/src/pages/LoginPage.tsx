import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/login" },
      });
      if (oauthError) throw oauthError;
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Gagal memulai login Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
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
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">S</div>
              <h2 className="text-xl font-bold text-neutral-900 text-center">
                {isRegister ? "Registrasi Tenaga Pendidik" : "Masuk Portal Guru"}
              </h2>
              <p className="text-xs text-neutral-500 text-center">Semai · Menyemai generasi, mengefisiensi profesi.</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={handleGoogleLogin}>
              Masuk dengan Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-neutral-200" />
              <span className="text-xs text-neutral-400">atau</span>
              <div className="flex-1 border-t border-neutral-200" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isRegister && (
                <div className="flex flex-col gap-1">
                  <Label>Nama Lengkap Guru</Label>
                  <Input placeholder="Contoh: Rina S.Pd" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Label>Email Sekolah / Pribadi</Label>
                <Input type="email" placeholder="nama@sekolah.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Kata Sandi</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Memproses..." : isRegister ? "Daftar Akun Guru" : "Masuk Dashboard"}
              </Button>
            </form>

            <p className="text-xs text-neutral-500 text-center">
              {isRegister ? "Sudah memiliki akun?" : "Belum memiliki akun?"}{" "}
              <button type="button" className="text-blue-600 hover:underline font-medium" onClick={() => { setIsRegister(!isRegister); setError(null); }}>
                {isRegister ? "Masuk di sini" : "Registrasi di sini"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
