import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Wordmark } from "../components/Wordmark";
import { MaterialDialog } from "../components/MaterialDialog";

export const TakeMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inputCode, setInputCode] = useState(searchParams.get("code") || "");
  const [studentName, setStudentName] = useState("");
  const [material, setMaterial] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const materialQuery = trpc.material.getByCode.useQuery(
    { code: inputCode },
    { enabled: false }
  );

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inputCode || !studentName) {
      setError("Silakan isi kode materi dan nama kamu.");
      return;
    }
    const res = await materialQuery.refetch();
    if (res.isError || !res.data) {
      setError("Materi tidak ditemukan dengan kode tersebut.");
      return;
    }
    setMaterial(res.data);
  };

  if (material) {
    return (
      <main id="main-content" className="min-dvh bg-neutral-50 flex items-center justify-center p-4">
        <MaterialDialog material={material} open onOpenChange={(o) => !o && navigate("/")} />
      </main>
    );
  }

  return (
    <main id="main-content" className="min-dvh bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">
              <Wordmark />
            </span>
            <h1 className="text-lg font-medium text-neutral-950">Buka Materi Belajar</h1>
            <p className="text-xs text-neutral-400 text-center">
              Masukkan kode materi dari pengajar untuk mulai membaca.
            </p>
          </div>
          <form onSubmit={handleOpen} className="flex flex-col gap-4" noValidate>
            {error && <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="flex flex-col gap-1">
              <Label htmlFor="material-code">Kode Materi</Label>
              <Input
                id="material-code"
                className="font-mono text-center"
                placeholder="Contoh: FOTOSIN5"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={10}
                required
                autoComplete="off"
                inputMode="text"
                enterKeyHint="next"
                style={{ fontSize: "1rem" }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="material-name">Nama Lengkap Siswa</Label>
              <Input
                id="material-name"
                placeholder="Ketik nama lengkapmu"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                autoComplete="name"
                enterKeyHint="go"
                style={{ fontSize: "1rem" }}
              />
            </div>
            <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm">
              Buka Materi
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};
