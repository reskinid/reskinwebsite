"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AvatarStyle } from "@/lib/avatar";

type Props = { fullName: string; email: string };

const avatarOptions: { value: AvatarStyle; label: string; gender: "male" | "female"; src: string }[] = [
  { value: "male", label: "Laki-laki", gender: "male", src: "/avatar-male.svg" },
  { value: "female_hijab", label: "Perempuan berhijab", gender: "female", src: "/member-avatar.svg" },
  { value: "female_no_hijab", label: "Perempuan tanpa hijab", gender: "female", src: "/avatar-female-no-hijab.svg" },
];

export default function ProfileSetupForm({ fullName, email }: Props) {
  const router = useRouter();
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("female_hijab");
  const [displayName, setDisplayName] = useState(fullName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Koneksi RE-SKIN belum tersedia. Silakan coba kembali.");
      setBusy(false);
      return;
    }

    const selected = avatarOptions.find((option) => option.value === avatarStyle)!;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setBusy(false);
      return;
    }

    const metadataName = displayName.trim() || String(
      userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || fullName,
    );
    if (!metadataName) {
      setError("Nama lengkap perlu diisi agar profil RE-SKIN dapat dibuat.");
      setBusy(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ gender: selected.gender, avatar_style: selected.value, full_name: metadataName })
      .eq("id", userData.user.id);

    if (profileError) {
      setError(profileError.message.includes("gender")
        ? "Kolom gender belum tersedia. Jalankan migration Supabase yang disertakan dalam project."
        : profileError.message);
      setBusy(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: metadataName, gender: selected.gender, avatar_style: selected.value },
    });

    if (metadataError) {
      setError(metadataError.message);
      setBusy(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-card">
        <div className="profile-setup-kicker">✦ RE-SKIN · BEAUTY BESTIE</div>
        <h1>Selamat datang{fullName ? `, ${fullName.split(/\s+/)[0]}` : ""}!</h1>
        <p className="profile-setup-intro">
          Lengkapi profil RE-SKIN dengan memilih jenis kelamin dan avatar yang ingin kamu gunakan.
        </p>
        <div className="profile-account-summary">
          <span className="profile-account-mark">✦</span>
          <div><strong>{fullName || "Beauty Bestie"}</strong><small>{email}</small></div>
          <span className="profile-account-check">✓</span>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="profile-setup-name-field">
            Nama lengkap
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="name" placeholder="Nama yang ingin ditampilkan" required />
          </label>
          <fieldset className="profile-avatar-options">
            <legend>Jenis kelamin & tampilan avatar</legend>
            <p>Pilih avatar yang paling nyaman kamu gunakan. Pilihan ini akan digunakan di profil RE-SKIN.</p>
            <div className="profile-avatar-grid">
              {avatarOptions.map((option) => (
                <label className={`profile-avatar-option${avatarStyle === option.value ? " selected" : ""}`} key={option.value}>
                  <input
                    type="radio"
                    name="avatarStyle"
                    value={option.value}
                    checked={avatarStyle === option.value}
                    onChange={() => setAvatarStyle(option.value)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={option.src} alt={option.label} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="profile-setup-privacy">
            <strong>Privasi data kamu</strong>
            <p>RE-SKIN menggunakan nama dan email untuk akun. Jenis kelamin dan avatar dipilih langsung oleh pengguna. Data profil dan layanan meliputi nama, email, pilihan jenis kelamin/avatar, nomor WhatsApp, alamat pickup, riwayat aktivitas layanan, serta ID akun dan sesi autentikasi yang dikelola Supabase. Data dipakai untuk menjalankan RE-SKIN, tidak dijual atau digunakan untuk iklan. <a href="/kebijakan-privasi" target="_blank" rel="noreferrer">Baca kebijakan privasi</a>.</p>
          </div>
          {error ? <p className="profile-setup-error" role="alert">{error}</p> : null}
          <button className="btn profile-setup-submit" type="submit" disabled={busy}>
            {busy ? "Menyimpan profil..." : "Simpan & Buka Dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
