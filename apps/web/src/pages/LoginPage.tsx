import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/Wordmark";

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
    <div className="min-dvh flex items-center justify-center bg-neutral-100 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">
                <Wordmark />
              </span>
              <h1 className="text-xl font-medium text-neutral-950 text-center tracking-tight">
                {isRegister ? "Registrasi Tenaga Pendidik" : "Masuk Portal Guru"}
              </h1>
              <p className="text-xs text-neutral-400 text-center">Semai, Menyemai generasi, mengefisiensi profesi.</p>
            </div>

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="button" variant="outline" className="w-full rounded-sm" disabled={loading} onClick={handleGoogleLogin}>
              Masuk dengan Google
            </Button>

            <div className="flex items-center gap-3" role="separator" aria-label="atau">
              <div className="flex-1 border-t border-neutral-200" />
              <span className="text-xs text-neutral-400" aria-hidden="true">atau</span>
              <div className="flex-1 border-t border-neutral-200" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {isRegister && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="register-name">Nama Lengkap Guru</Label>
                  <Input
                    id="register-name"
                    placeholder="Contoh: Rina S.Pd"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    style={{ fontSize: "1rem" }}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Label htmlFor="login-email">Email Sekolah / Pribadi</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nama@sekolah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete={isRegister ? "email" : "username"}
                  inputMode="email"
                  enterKeyHint="next"
                  style={{ fontSize: "1rem" }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="login-password">Kata Sandi</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  enterKeyHint="done"
                  style={{ fontSize: "1rem" }}
                />
              </div>
              <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm" disabled={loading}>
                {loading ? "Memproses..." : isRegister ? "Daftar Akun Guru" : "Masuk Dashboard"}
              </Button>
            </form>

            <p className="text-xs text-neutral-400 text-center">
              {isRegister ? "Sudah memiliki akun?" : "Belum memiliki akun?"}{" "}
              <button type="button" className="text-neutral-900 hover:underline font-medium" onClick={() => { setIsRegister(!isRegister); setError(null); }}>
                {isRegister ? "Masuk di sini" : "Registrasi di sini"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
