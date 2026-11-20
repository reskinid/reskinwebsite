"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  name: string;
  email: string;
  role?: string;
  joinedAt?: string;
  demo?: boolean;
};

export default function AdminProfileMenu({
  name,
  email,
  role = "Administrator",
  joinedAt = "01 Nov 2026",
  demo = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function logout() {
    if (!demo) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) await supabase.auth.signOut();
    }
    window.location.assign("/");
  }

  return (
    <div className="account-profile-wrap" ref={rootRef}>
      <button
        className={`account-profile-trigger${open ? " is-open" : ""}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Buka informasi profil administrator"
      >
        <Image src="/admin-avatar.svg" alt="Foto profil Admin RE-SKIN" width={42} height={42} className="account-profile-photo" priority />
        <span className="account-profile-trigger-copy">
          <strong>{name}</strong>
          <small>{role}</small>
        </span>
        <span className="account-profile-chevron" />
      </button>

      {open ? (
        <section className="account-profile-popover" aria-label="Informasi profil administrator">
          <div className="account-profile-popover-head">
            <Image src="/admin-avatar.svg" alt="" width={54} height={54} className="account-profile-photo account-profile-photo-large" />
            <div>
              <strong>{name}</strong>
              <span>{email}</span>
              <small><Icon name="shield-check" size={12} /> {role}</small>
            </div>
          </div>
          <div className="account-profile-details">
            <div><span>Status akun</span><strong><i className="account-active-dot" /> Aktif</strong></div>
            <div><span>Bergabung sejak</span><strong>{joinedAt}</strong></div>
            <div><span>Jenis akses</span><strong>{demo ? "Pratinjau lokal" : "Akun terverifikasi"}</strong></div>
          </div>
          {demo ? <p className="account-profile-demo-note">Profil contoh untuk Demo Mode. Logout hanya mengakhiri tampilan dashboard demo.</p> : null}
          <button className="account-profile-logout" type="button" onClick={logout}>
            <Icon name="log-out" size={16} /> Keluar dari akun
          </button>
        </section>
      ) : null}
    </div>
  );
}
