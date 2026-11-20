"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Koneksi RE-SKIN belum tersedia. Coba buka kembali melalui tautan email.");
      setReady(true);
      return;
    }
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setHasSession(Boolean(data.user && !error));
      setReady(true);
      if (error || !data.user) {
        setMessage("Tautan reset password tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru dari halaman login.");
      }
    });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("Password baru minimal 8 karakter.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Konfirmasi password belum sama.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !hasSession) {
      setMessage("Sesi pemulihan tidak ditemukan. Minta tautan reset password yang baru.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage("Password belum berhasil diperbarui. Periksa persyaratan password dan coba lagi.");
      return;
    }
    setMessage("Password berhasil diperbarui. Kamu akan diarahkan ke halaman utama.");
    window.setTimeout(() => {
      router.replace("/?password=updated");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-card">
        <div className="profile-setup-kicker">RE-SKIN · BEAUTY BESTIE</div>
        <h1>Atur ulang password</h1>
        <p className="profile-setup-intro">Buat password baru untuk melanjutkan akses ke akun RE-SKIN kamu.</p>
        {!ready ? <p className="profile-setup-intro">Memeriksa tautan pemulihan...</p> : null}
        {ready && hasSession ? (
          <form onSubmit={handleSubmit}>
            <label className="profile-setup-name-field">
              Password baru
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required placeholder="Minimal 8 karakter" />
            </label>
            <label className="profile-setup-name-field">
              Ulangi password baru
              <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} autoComplete="new-password" required placeholder="Masukkan ulang password" />
            </label>
            <button className="btn profile-setup-submit" type="submit" disabled={busy}>{busy ? "Menyimpan password..." : "Simpan password baru"}</button>
          </form>
        ) : null}
        {message ? <p className="profile-setup-error" role="status">{message}</p> : null}
        <Link className="btn privacy-back-button" href="/">Kembali ke Beranda</Link>
      </section>
    </main>
  );
}
