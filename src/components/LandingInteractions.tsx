"use client";

import { useEffect, type ReactNode } from "react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMemberAvatarPath, normalizeAvatarStyle } from "@/lib/avatar";
import { openAdminWhatsApp, reserveAdminWhatsAppWindow } from "@/lib/whatsapp";

type DemoUser = { name: string; email: string };
type PickupSummary = { count: number; points: number; date: string; time: string };
type LandingSnapshot = {
  fullName: string;
  email: string;
  role: string;
  points: number;
  avatarStyle: string;
};
type IconKey = "arrow-up-right" | "sparkles" | "recycle" | "gift" | "check" | "x";

const modalIconPaths: Record<IconKey, string> = {
  "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  sparkles:
    '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="M19 14v4"/><path d="M21 16h-4"/><path d="M5 2v4"/><path d="M8 5H2"/>',
  recycle:
    '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7 10"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2"/><path d="m14 16 3 3-3 3"/><path d="m3.5 5.5 1.1-1.9a1.8 1.8 0 0 1 1.6-.9h6.3"/><path d="m12 2 3 3-3 3"/><path d="m17 10 1.9-3.3"/><path d="m18.9 6.7 3.1.3-.4 3.1"/>',
  gift:
    '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13"/><path d="M3 12h18"/><path d="M12 8H7.5a2.5 2.5 0 1 1 2.4-3.2L12 8Z"/><path d="M12 8h4.5a2.5 2.5 0 1 0-2.4-3.2L12 8Z"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

function iconHtml(name: IconKey) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-inline icon-lucide" aria-hidden="true" focusable="false">${modalIconPaths[name]}</svg>`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

export default function LandingInteractions({ children }: { children: ReactNode }) {
  useEffect(() => {
    const hamburger = document.getElementById("hamburger") as HTMLButtonElement | null;
    const mobileNav = document.getElementById("mobileNav");
    const backdrop = document.getElementById("modalBackdrop");
    const modalBody = document.getElementById("modalBody");
    const modalClose = document.getElementById("modalClose") as HTMLButtonElement | null;
    const toastElement = document.getElementById("toast");
    const desktopAuthHost = document.getElementById("landingAuthDesktop");
    const mobileAuthHost = document.getElementById("landingAuthMobile");

    if (!backdrop || !modalBody || !modalClose || !toastElement) return;

    const supabase = createSupabaseBrowserClient();
    let currentUser: User | null = null;
    let demoUser: DemoUser | null = null;
    let lastPickup: PickupSummary | null = null;
    let previousFocus: HTMLElement | null = null;
    let toastTimer: number | undefined;
    let authUnsubscribe: (() => void) | undefined;
    let landingStatsChannel: RealtimeChannel | null = null;
    let landingStatsPollTimer: number | undefined;

    const landingStatsStatus = document.getElementById("landingStatsStatus");
    const landingStatElements = {
      packages: document.querySelector<HTMLElement>('[data-stat="packages"]'),
      members: document.querySelector<HTMLElement>('[data-stat="members"]'),
      points: document.querySelector<HTMLElement>('[data-stat="points"]'),
    };

    function formatLandingStat(value: unknown) {
      const numericValue = Number(value);
      return Number.isFinite(numericValue)
        ? Math.max(0, Math.floor(numericValue)).toLocaleString("id-ID")
        : "—";
    }

    function renderLandingStats(row: Record<string, unknown>) {
      if (landingStatElements.packages) {
        landingStatElements.packages.textContent = formatLandingStat(row.total_packages);
      }
      if (landingStatElements.members) {
        landingStatElements.members.textContent = formatLandingStat(row.total_members);
      }
      if (landingStatElements.points) {
        landingStatElements.points.textContent = formatLandingStat(row.total_points);
      }
      if (landingStatsStatus) {
        const updatedAt = row.updated_at ? new Date(String(row.updated_at)) : new Date();
        const timeLabel = Number.isNaN(updatedAt.getTime())
          ? "baru saja"
          : updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        landingStatsStatus.textContent = `Data live dari database RE-SKIN · diperbarui ${timeLabel}`;
      }
    }

    async function refreshLandingStats() {
      if (!supabase) {
        if (landingStatsStatus) landingStatsStatus.textContent = "Statistik akan tampil setelah database RE-SKIN terhubung.";
        return;
      }

      const { data, error } = await supabase
        .from("landing_stats")
        .select("total_packages,total_members,total_points,updated_at")
        .eq("id", 1)
        .maybeSingle();

      if (error || !data) {
        if (landingStatsStatus) {
          landingStatsStatus.textContent = "Statistik belum dapat dimuat. Periksa koneksi database RE-SKIN.";
        }
        return;
      }

      renderLandingStats(data as Record<string, unknown>);
    }

    const onLandingStatsVisibilityChange = () => {
      if (!document.hidden) void refreshLandingStats();
    };

    async function fetchLandingSnapshot(user: User): Promise<LandingSnapshot> {
      if (!supabase) {
        return {
          fullName: String(user.user_metadata?.full_name ?? user.email ?? "Beauty Bestie"),
          email: user.email ?? "",
          role: "member",
          points: 0,
          avatarStyle: normalizeAvatarStyle(user.user_metadata?.avatar_style),
        };
      }

      const [profileResult, balanceResult] = await Promise.all([
        supabase.from("profiles").select("full_name,email,role,avatar_style").eq("id", user.id).maybeSingle(),
        supabase.rpc("get_my_point_balance"),
      ]);

      return {
        fullName: String(
          profileResult.data?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "Beauty Bestie",
        ),
        email: String(profileResult.data?.email ?? user.email ?? ""),
        role: String(profileResult.data?.role ?? "member"),
        points: Number(balanceResult.data ?? 0),
        avatarStyle: normalizeAvatarStyle(profileResult.data?.avatar_style ?? user.user_metadata?.avatar_style),
      };
    }

    function closeAuthMenus() {
      document.querySelectorAll<HTMLElement>(".landing-account-wrap").forEach((wrap) => {
        wrap.classList.remove("is-open");
        const trigger = wrap.querySelector<HTMLElement>(".account-profile-trigger");
        trigger?.classList.remove("is-open");
        trigger?.setAttribute("aria-expanded", "false");
        const popover = wrap.querySelector<HTMLElement>(".account-profile-popover");
        if (popover) popover.hidden = true;
      });
    }

    function renderGuestAuth() {
      if (desktopAuthHost) {
        desktopAuthHost.innerHTML = `<button class="simple" data-action="login" style="border:none;background:transparent">Masuk</button><button class="btn" data-action="signup">Daftar Sekarang <span class="arrow">${iconHtml("arrow-up-right")}</span></button>`;
      }
      if (mobileAuthHost) {
        mobileAuthHost.innerHTML = `<button data-action="login">Masuk</button><button class="mobile-cta" data-action="signup">Daftar Sekarang ${iconHtml("arrow-up-right")}</button>`;
      }
    }

    function renderLoggedInAuth(snapshot: LandingSnapshot) {
      const isAdmin = snapshot.role === "admin";
      const firstName = snapshot.fullName.trim().split(/\s+/)[0] || (isAdmin ? "Admin" : "Beauty Bestie");
      const dashboardHref = isAdmin ? "/admin" : "/dashboard";
      const dashboardLabel = isAdmin ? "Dashboard Admin" : "Dashboard Member";
      const subLabel = isAdmin ? "Administrator" : "Beauty Bestie";
      const pointSummary = isAdmin ? "Akses admin aktif" : `${snapshot.points.toLocaleString("id-ID")} SKINPoint`;
      const detailCopy = isAdmin
        ? "Buka dashboard admin untuk memantau pickup, anggota, dan distribusi SKINPoint."
        : "Pantau pickup, cek saldo poin, dan lihat hadiah favoritmu langsung dari dashboard member.";
      const avatar = isAdmin ? "/admin-avatar.svg" : getMemberAvatarPath(snapshot.avatarStyle);

      if (desktopAuthHost) {
        desktopAuthHost.innerHTML = `<div class="account-profile-wrap landing-account-wrap"><button class="account-profile-trigger" type="button" data-auth-toggle="desktop" aria-expanded="false"><img class="account-profile-photo" src="${avatar}" alt="Profil ${escapeHtml(snapshot.fullName)}"><span class="account-profile-trigger-copy"><strong>${escapeHtml(snapshot.fullName)}</strong><small>${escapeHtml(subLabel)} · ${escapeHtml(pointSummary)}</small></span><span class="account-profile-chevron"></span></button><div class="account-profile-popover landing-account-popover" hidden><div class="account-profile-popover-head"><img class="account-profile-photo account-profile-photo-large" src="${avatar}" alt="Profil ${escapeHtml(snapshot.fullName)}"><div><strong>${escapeHtml(snapshot.fullName)}</strong><span>${escapeHtml(snapshot.email)}</span><small>${iconHtml("sparkles")} ${escapeHtml(subLabel)} · login aktif</small></div></div><div class="account-profile-details landing-account-details"><div><span>${isAdmin ? "Akses" : "Saldo SKINPoint"}</span><strong>${escapeHtml(pointSummary)}</strong></div><div><span>Pintasan cepat</span><strong>${escapeHtml(dashboardLabel)}</strong></div></div><a class="btn landing-account-dashboard" href="${dashboardHref}">Buka ${escapeHtml(dashboardLabel)} ${iconHtml("arrow-up-right")}</a><p class="account-profile-demo-note landing-account-note">${escapeHtml(detailCopy)}</p><button type="button" class="account-profile-logout" data-auth-signout>Keluar dari akun</button></div></div>`;
      }

      if (mobileAuthHost) {
        mobileAuthHost.innerHTML = `<div class="mobile-auth-card"><div class="mobile-auth-head"><img class="mobile-auth-avatar" src="${avatar}" alt="Profil ${escapeHtml(snapshot.fullName)}"><div><strong>${escapeHtml(firstName)}</strong><small>${escapeHtml(subLabel)}</small></div></div><p>${isAdmin ? "Akses admin aktif di perangkat ini." : `Saldo saat ini: ${snapshot.points.toLocaleString("id-ID")} SKINPoint.`}</p><a class="mobile-cta" href="${dashboardHref}">Buka ${escapeHtml(dashboardLabel)} ${iconHtml("arrow-up-right")}</a><button type="button" class="mobile-auth-logout" data-auth-signout>Keluar dari akun</button></div>`;
      }
    }

    async function refreshAuthNav() {
      if (currentUser) {
        const snapshot = await fetchLandingSnapshot(currentUser);
        renderLoggedInAuth(snapshot);
        return;
      }
      renderGuestAuth();
    }

    if (supabase) {
      void refreshLandingStats();
      landingStatsChannel = supabase
        .channel("landing-stats-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "landing_stats" },
          (payload) => {
            const row = payload.new as Record<string, unknown> | null;
            if (row && row.total_packages !== undefined) {
              renderLandingStats(row);
            } else {
              void refreshLandingStats();
            }
          },
        )
        .subscribe();
      // Polling is a fallback in case a browser temporarily misses a Realtime event.
      landingStatsPollTimer = window.setInterval(() => void refreshLandingStats(), 30000);
      document.addEventListener("visibilitychange", onLandingStatsVisibilityChange);

      void supabase.auth.getUser().then(async ({ data }) => {
        currentUser = data.user;
        await refreshAuthNav();
      });
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session?.user ?? null;
        await refreshAuthNav();
      });
      authUnsubscribe = () => data.subscription.unsubscribe();
    } else {
      renderGuestAuth();
      void refreshLandingStats();
    }

    function closeMenu() {
      mobileNav?.classList.remove("show");
      hamburger?.setAttribute("aria-expanded", "false");
    }

    function openModal(html: string) {
      previousFocus = document.activeElement as HTMLElement | null;
      modalBody!.innerHTML = html;
      backdrop!.classList.add("show");
      document.body.style.overflow = "hidden";
      modalClose!.focus();
    }

    function closeModal() {
      backdrop!.classList.remove("show");
      document.body.style.overflow = "";
      modalBody!.innerHTML = "";
      previousFocus?.focus?.();
    }

    function toast(message: string) {
      toastElement!.textContent = message;
      toastElement!.classList.add("show");
      if (toastTimer) window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toastElement!.classList.remove("show"), 3500);
    }

    function dashboard() {
      if (currentUser) {
        window.location.assign("/dashboard");
        return;
      }
      if (!demoUser) return login();

      const requestDetails = lastPickup
        ? `<div class="mini-row"><strong>Pickup terakhir</strong><span>${escapeHtml(lastPickup.date)} · ${escapeHtml(lastPickup.time)}</span></div>
           <div class="mini-row"><strong>Jumlah diajukan</strong><span>${lastPickup.count} kemasan</span></div>
           <div class="mini-row"><strong>Estimasi poin (belum disetujui)</strong><span>${lastPickup.points} pts</span></div>`
        : "";

      openModal(`<div class="tag">MY RE-SKIN</div>
        <h3 id="modalTitle">Hi, ${escapeHtml(demoUser.name.split(" ")[0])}! ${iconHtml("sparkles")}</h3>
        <p>Dashboard pengguna versi simulasi. Saldo nyata nanti dihitung dari hasil verifikasi admin di Supabase.</p>
        <div class="dash-stat"><div class="small-label">TOTAL SKINPOINT TERVERIFIKASI</div><strong>0 <span style="font-size:16px">PTS</span></strong><p style="margin:6px 0 0">Belum ada kemasan yang disetujui admin.</p></div>
        <div class="mini-row"><strong>Botol lolos verifikasi</strong><span>0 kemasan</span></div>
        <div class="mini-row"><strong>Pickup diajukan</strong><span>${lastPickup ? "1 pengajuan demo" : "Belum ada"}</span></div>
        ${requestDetails}
        <button class="btn" id="startPickup">Ajukan Pickup ${iconHtml("arrow-up-right")}</button>
        <button class="btn btn-outline" id="logout" style="box-shadow:none;margin-top:12px">Keluar dari Demo</button>`);

      document.getElementById("startPickup")?.addEventListener("click", pickup);
      document.getElementById("logout")?.addEventListener("click", () => {
        demoUser = null;
        lastPickup = null;
        closeModal();
        toast("Keluar dari simulasi dashboard");
      });
    }

    function login(initialMode: "login" | "signup" = "login") {
      if (currentUser) {
        if (supabase) {
          void supabase.from("profiles").select("role").eq("id", currentUser.id).maybeSingle()
            .then(({ data }) => window.location.assign(data?.role === "admin" ? "/admin" : "/dashboard"));
        } else {
          window.location.assign("/dashboard");
        }
        return;
      }
      if (!supabase && demoUser) {
        dashboard();
        return;
      }

      const isConnected = Boolean(supabase);
      openModal(`<div class="tag">RE-SKIN MEMBER ${iconHtml("sparkles")}</div>
        <h3 id="modalTitle">Halo, beauty bestie!</h3>
        <p id="authIntro">${isConnected ? "Masuk atau buat akun menggunakan email dan password. Untuk akun baru, konfirmasi email diperlukan sebelum login." : "Coba dashboard demo terlebih dahulu. Akun demo hanya tersimpan selama halaman ini terbuka dan belum dikirim ke server."}</p>
        ${isConnected ? `
        <section id="passwordAuthPanel">
          <div class="auth-tabs" role="tablist" aria-label="Masuk atau buat akun">
            <button class="auth-tab active" id="authLoginTab" type="button" role="tab" aria-selected="true">Masuk</button>
            <button class="auth-tab" id="authSignupTab" type="button" role="tab" aria-selected="false">Buat Akun</button>
          </div>
        ` : ""}
        <form id="loginForm">
          <label class="form-field ${isConnected ? "hidden" : ""}" id="signupNameField">Nama lengkap<input name="name" autocomplete="name" maxlength="80" placeholder="Nama kamu" ${isConnected ? "" : "required"}></label>
          ${isConnected ? `<fieldset class="avatar-choice-field hidden" id="signupAvatarField"><legend>Jenis kelamin &amp; tampilan avatar</legend><p>Pilih avatar yang ingin digunakan di Member Area.</p><div class="avatar-choice-grid"><label class="avatar-choice-card"><input type="radio" name="avatarStyle" value="male"><img src="/avatar-male.svg" alt="Avatar laki-laki"><span>Laki-laki</span></label><label class="avatar-choice-card"><input type="radio" name="avatarStyle" value="female_hijab" checked><img src="/member-avatar.svg" alt="Avatar perempuan berhijab"><span>Perempuan berhijab</span></label><label class="avatar-choice-card"><input type="radio" name="avatarStyle" value="female_no_hijab"><img src="/avatar-female-no-hijab.svg" alt="Avatar perempuan tanpa hijab"><span>Perempuan tanpa hijab</span></label></div></fieldset>` : ""}
          <label class="form-field">Email<input name="email" type="email" autocomplete="email" maxlength="120" required placeholder="nama@email.com"></label>
          ${isConnected ? '<label class="form-field" id="passwordField">Password<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Masukkan password"></label><button class="forgot-password-link" id="forgotPasswordBtn" type="button">Lupa password?</button>' : ""}
          ${isConnected ? '<label class="privacy-consent-row hidden" id="privacyConsentRow"><input id="privacyConsent" type="checkbox"><span>Saya telah membaca dan menyetujui Kebijakan Privasi RE-SKIN.</span></label><div class="privacy-notice signup-verification-notice hidden" id="signupVerificationNotice"><strong>Konfirmasi email untuk mengaktifkan akun</strong><p>Setelah mendaftar, Supabase Auth akan mengirim email konfirmasi ke alamat yang kamu daftarkan. Buka email tersebut dan klik tautan verifikasi sebelum login. Jika belum terlihat, periksa folder Spam. Password dikelola oleh Supabase Auth dan tidak ditampilkan kepada admin RE-SKIN. Data digunakan untuk menjalankan layanan RE-SKIN sesuai kebijakan privasi.</p></div>' : ""}
          <div class="notice" id="authNotice">${isConnected ? "Masuk menggunakan email dan password yang sudah terdaftar." : "Mode demo: data hanya dipakai selama halaman terbuka, tidak disimpan ke database."}</div>
          <div class="auth-actions">
            ${isConnected ? '<button class="btn" id="authSubmitBtn" type="submit">Masuk</button>' : '<button class="btn" id="demoLoginBtn" type="button">Buka Dashboard Demo</button>'}
          </div>
          <p class="auth-message" id="authMessage" aria-live="polite"></p>
        </form>
        ${isConnected ? `</section>` : ""}
        ${isConnected ? `<div class="privacy-notice auth-shared-privacy" id="authPrivacyNotice"><strong>Keamanan &amp; privasi Beauty Bestie</strong><p>Autentikasi dan sesi akun dikelola oleh Supabase Auth. Password tidak ditampilkan kepada admin RE-SKIN dan aplikasi tidak menyimpan password sebagai teks biasa. Data profil dan layanan meliputi nama, email, pilihan jenis kelamin/avatar, nomor WhatsApp, alamat pickup, serta riwayat pengajuan, verifikasi, SKINPoint, penukaran hadiah, dan notifikasi. Data digunakan untuk menjalankan layanan RE-SKIN, tidak dijual atau digunakan untuk iklan, dan akses dibatasi sesuai akun serta peran. Tidak ada sistem digital yang 100% bebas risiko. <a href="/kebijakan-privasi" target="_blank" rel="noreferrer">Baca kebijakan privasi</a> · <a href="/syarat-ketentuan" target="_blank" rel="noreferrer">Baca syarat &amp; ketentuan</a>.</p></div>` : ""}`);

      const form = document.getElementById("loginForm") as HTMLFormElement | null;
      const message = document.getElementById("authMessage");
      if (!form) return;

      if (!supabase) {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          (document.getElementById("demoLoginBtn") as HTMLButtonElement | null)?.click();
        });
        document.getElementById("demoLoginBtn")?.addEventListener("click", () => {
          if (!form.reportValidity()) return;
          const formData = new FormData(form);
          demoUser = {
            name: String(formData.get("name") ?? "").trim(),
            email: String(formData.get("email") ?? "").trim(),
          };
          dashboard();
        });
        return;
      }

      async function redirectAfterAuthentication(user: User) {
        const { data: profile } = await supabase!
          .from("profiles")
          .select("role,gender")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          window.location.assign("/admin");
        } else if (!profile?.gender) {
          window.location.assign("/profile-setup");
        } else {
          window.location.assign("/dashboard");
        }
      }

      const nameField = document.getElementById("signupNameField");
      const avatarField = document.getElementById("signupAvatarField");
      const nameInput = form.elements.namedItem("name") as HTMLInputElement;
      const emailInput = form.elements.namedItem("email") as HTMLInputElement;
      const passwordInput = form.elements.namedItem("password") as HTMLInputElement;
      const loginTab = document.getElementById("authLoginTab");
      const signupTab = document.getElementById("authSignupTab");
      const submitButton = document.getElementById("authSubmitBtn") as HTMLButtonElement;
      const notice = document.getElementById("authNotice");
      const privacyConsent = document.getElementById("privacyConsent") as HTMLInputElement | null;
      const privacyConsentRow = document.getElementById("privacyConsentRow");
      const forgotPasswordButton = document.getElementById("forgotPasswordBtn") as HTMLButtonElement | null;
      const signupVerificationNotice = document.getElementById("signupVerificationNotice");
      let authMode: "login" | "signup" = "login";

      const setAuthMode = (mode: "login" | "signup") => {
        authMode = mode;
        const isSignup = mode === "signup";
        nameField?.classList.toggle("hidden", !isSignup);
        avatarField?.classList.toggle("hidden", !isSignup);
        privacyConsentRow?.classList.toggle("hidden", !isSignup);
        signupVerificationNotice?.classList.toggle("hidden", !isSignup);
        forgotPasswordButton?.classList.toggle("hidden", isSignup);
        nameInput.required = isSignup;
        passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
        submitButton.textContent = isSignup ? "Buat Akun" : "Masuk";
        if (privacyConsent) privacyConsent.required = isSignup;
        if (notice) {
          notice.textContent = isSignup
            ? "Lengkapi data pendaftaran. Setelah mendaftar, konfirmasi email diperlukan untuk mengaktifkan akun."
            : "Masuk menggunakan email dan password yang sudah terdaftar. Nama lengkap tidak diperlukan.";
        }
        loginTab?.classList.toggle("active", !isSignup);
        signupTab?.classList.toggle("active", isSignup);
        loginTab?.setAttribute("aria-selected", String(!isSignup));
        signupTab?.setAttribute("aria-selected", String(isSignup));
        if (message) message.textContent = "";
      };

      loginTab?.addEventListener("click", () => setAuthMode("login"));
      signupTab?.addEventListener("click", () => setAuthMode("signup"));
      setAuthMode(initialMode);

      forgotPasswordButton?.addEventListener("click", async () => {
        if (!emailInput.checkValidity()) {
          emailInput.reportValidity();
          if (message) message.textContent = "Masukkan email akunmu terlebih dahulu untuk menerima tautan reset password.";
          emailInput.focus();
          return;
        }
        forgotPasswordButton.disabled = true;
        forgotPasswordButton.textContent = "Mengirim tautan...";
        if (message) message.textContent = "";
        const { error } = await supabase!.auth.resetPasswordForEmail(emailInput.value.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        });
        forgotPasswordButton.disabled = false;
        forgotPasswordButton.textContent = "Lupa password?";
        if (message) {
          message.textContent = error
            ? "Tautan reset belum dapat dikirim. Periksa email dan coba lagi."
            : "Jika email tersebut terdaftar, Supabase akan mengirim tautan untuk mengatur ulang password. Periksa Inbox dan Spam.";
        }
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const formData = new FormData(form);
        const email = String(formData.get("email") ?? "").trim().toLowerCase();
        const password = String(formData.get("password") ?? "");
        if (authMode === "signup" && !privacyConsent?.checked) {
          if (message) message.textContent = "Silakan setujui pemberitahuan penggunaan data sebelum membuat akun.";
          privacyConsent?.focus();
          return;
        }

        submitButton.disabled = true;
        submitButton.textContent = authMode === "signup" ? "Membuat akun..." : "Memproses...";
        if (message) message.textContent = "";

        if (authMode === "login") {
          const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
          submitButton.disabled = false;
          submitButton.textContent = "Masuk";
          if (error || !data.user) {
            const authError = error?.message.toLowerCase() ?? "";
            if (message) {
              message.textContent = authError.includes("email not confirmed")
                ? "Email kamu belum dikonfirmasi. Buka email dari Supabase dan klik tautan verifikasi terlebih dahulu. Periksa juga folder Spam."
                : "Email atau password belum sesuai. Periksa kembali lalu coba lagi.";
            }
            return;
          }
          currentUser = data.user;
          await redirectAfterAuthentication(data.user);
          return;
        }

        const fullName = nameInput.value.trim();
        const avatarStyle = normalizeAvatarStyle(formData.get("avatarStyle"));
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_style: avatarStyle,
              gender: avatarStyle === "male" ? "male" : "female",
              privacy_consent_at: new Date().toISOString(),
              privacy_policy_version: "2026-11-19-v22",
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        submitButton.disabled = false;
        submitButton.textContent = "Buat Akun";
        if (error) {
          if (message) message.textContent = error.message;
          return;
        }

        if (data.session && data.user) {
          currentUser = data.user;
          await redirectAfterAuthentication(data.user);
        } else if (message) {
          message.textContent = `Akun berhasil dibuat untuk ${email}. Supabase telah mengirim email konfirmasi. Buka email tersebut dan klik tautan verifikasi sebelum masuk. Periksa juga folder Spam.`;
        }
      });
    }

    function pickup() {
      if (supabase && !currentUser) return login();
      if (!supabase && !demoUser) return login();

      openModal(`<div class="tag">REQUEST PICKUP ${iconHtml("recycle")}</div>
        <h3 id="modalTitle">Setor empties-mu!</h3>
        <p>Pilih jumlah kemasan berdasarkan volume, tanggal dan jam pickup, alamat penjemputan, serta nomor WhatsApp aktif.</p>
        <form id="pickupForm">
          <div class="pair-inputs">
            <label class="form-field">5–40 ml <small>5 poin/kemasan</small><input type="number" name="small" min="0" max="999" required value="2"></label>
            <label class="form-field">50–100 ml <small>10 poin/kemasan</small><input type="number" name="medium" min="0" max="999" required value="1"></label>
          </div>
          <label class="form-field">200–500 ml <small>15 poin/kemasan</small><input type="number" name="large" min="0" max="999" required value="0"></label>
          <div id="pickupPoints" class="pickup-preview" aria-live="polite">Estimasi: <strong>20 SKINPoint</strong> <small>· setelah verifikasi admin</small></div>
          <div class="pair-inputs">
            <label class="form-field">Tanggal pickup<input type="date" name="date" required></label>
            <label class="form-field">Jam pickup<input type="time" name="time" required value="13:00"></label>
          </div>
          <label class="form-field">Alamat / lokasi penjemputan<textarea name="location" rows="2" maxlength="300" required placeholder="Misalnya: Area kampus, gedung, titik temu, dan patokan"></textarea></label>
          <label class="form-field">Nomor WhatsApp yang bisa dihubungi<input type="tel" name="phone" minlength="8" maxlength="22" pattern="[0-9+ .()\\-]{8,22}" required placeholder="08xxxxxxxxxx"></label>
          <label class="form-field">Catatan (opsional)<textarea name="note" rows="2" maxlength="300" placeholder="Contoh: jenis bahan, kondisi botol, petunjuk lokasi"></textarea></label>
          <div class="notice">Estimasi poin bukan saldo final. Poin hanya diberikan untuk kemasan yang lolos verifikasi petugas.</div>
          <button class="btn" type="submit">${supabase ? "Kirim Pengajuan Pickup" : "Siapkan Pesan Pickup"} ${iconHtml("arrow-up-right")}</button>
        </form>`);

      const form = document.getElementById("pickupForm") as HTMLFormElement | null;
      const output = document.getElementById("pickupPoints");
      if (!form || !output) return;

      const dateInput = form.elements.namedItem("date") as HTMLInputElement;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      dateInput.min = `${yyyy}-${mm}-${dd}`;
      dateInput.value = dateInput.min;

      function compute() {
        const getNumber = (name: string) =>
          Number((form!.elements.namedItem(name) as HTMLInputElement).value) || 0;
        const small = getNumber("small");
        const medium = getNumber("medium");
        const large = getNumber("large");
        const count = small + medium + large;
        const points = small * 5 + medium * 10 + large * 15;
        output!.innerHTML = `Estimasi: <strong>${points} SKINPoint</strong> <small>· ${count} kemasan, baru aktif setelah admin memverifikasi</small>`;
        return { small, medium, large, count, points };
      }

      form.querySelectorAll('input[type="number"]').forEach((input) => {
        input.addEventListener("input", compute);
      });
      compute();

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const { small, medium, large, count, points } = compute();
        if (count < 1) {
          toast("Masukkan setidaknya 1 kemasan");
          return;
        }
        const formData = new FormData(form);
        const date = String(formData.get("date"));
        const time = String(formData.get("time"));
        const location = String(formData.get("location") ?? "").trim();
        const phone = String(formData.get("phone") ?? "").trim();
        const note = String(formData.get("note") ?? "").trim();
        const whatsappTab = reserveAdminWhatsAppWindow();
        const authenticatedUser = currentUser;

        if (supabase && authenticatedUser) {
          const { data, error } = await supabase.rpc("submit_pickup_request", {
            p_pickup_date: date,
            p_pickup_time: time,
            p_location: location,
            p_phone: phone,
            p_note: note || null,
            p_small_quantity: small,
            p_medium_quantity: medium,
            p_large_quantity: large,
            p_total_packages: count,
            p_estimated_points: points,
          });
          if (error) {
            whatsappTab?.close();
            toast(`Pengajuan gagal: ${error.message}`);
            return;
          }
          const requestId = String(data ?? "");
          const { data: savedPickup } = await supabase
            .from("pickup_requests")
            .select("request_code")
            .eq("id", requestId)
            .maybeSingle();
          const requestCode = savedPickup?.request_code || requestId;
          const memberName = String(authenticatedUser.user_metadata?.full_name ?? authenticatedUser.email ?? "Member RE-SKIN");
          const whatsappMessage = [
            "Halo Admin RE-SKIN!",
            "",
            "*PENGAJUAN PICKUP BARU*",
            `Nomor Pengajuan: ${requestCode}`,
            `Nama: ${memberName}`,
            `Email: ${authenticatedUser.email ?? "-"}`,
            `WhatsApp Member: ${phone}`,
            "",
            "*Detail kemasan:*",
            `- 5–40 ml: ${small} kemasan`,
            `- 50–100 ml: ${medium} kemasan`,
            `- 200–500 ml: ${large} kemasan`,
            `Total: ${count} kemasan`,
            `Estimasi SKINPoint: ${points} pts (menunggu verifikasi)`,
            "",
            `Tanggal pickup: ${date}`,
            `Waktu pickup: ${time} WIB`,
            `Alamat penjemputan: ${location}`,
            ...(note ? [`Catatan member: ${note}`] : []),
            "",
            "Mohon konfirmasi jadwal dan cakupan area pickup. Terima kasih.",
          ].join("\n");
          const whatsappOpened = openAdminWhatsApp(whatsappMessage, whatsappTab);
          openModal(`<div class="tag">PICKUP TERSIMPAN ${iconHtml("check")}</div>
            <h3 id="modalTitle">Pengajuan berhasil dikirim.</h3>
            <p>Permintaan pickup sudah tersimpan di database RE-SKIN dan menunggu konfirmasi petugas. ${whatsappOpened ? "WhatsApp Admin juga sudah dibuka dengan rincian pesan. Tekan Kirim di WhatsApp agar admin langsung menerima pemberitahuan." : "Nomor WhatsApp Admin belum dikonfigurasi; pengajuan tetap tersimpan di dashboard admin."}</p>
            <div class="pickup-preview"><strong>${count} kemasan · ${points} estimasi SKINPoint</strong><br><small>Saldo poin belum bertambah sampai verifikasi selesai.</small></div>
            <div class="mini-row"><strong>Nomor pengajuan</strong><span>${escapeHtml(requestCode)}</span></div>
            <div class="notice">Admin akan memeriksa jumlah dan kondisi kemasan. Poin final mengikuti hasil verifikasi.</div>
            <button class="btn" id="goDashboard">Lihat Dashboard ${iconHtml("arrow-up-right")}</button>`);
          document.getElementById("goDashboard")?.addEventListener("click", () => {
            window.location.assign("/dashboard");
          });
          return;
        }

        const memberName = demoUser?.name ?? "Pengguna demo";
        const memberEmail = demoUser?.email ?? "";
        const message = [
          "Halo Admin RE-SKIN!",
          "",
          "*PENGAJUAN PICKUP DEMO*",
          `Nama: ${memberName}`,
          `Email: ${memberEmail || "-"}`,
          `WhatsApp Member: ${phone}`,
          "",
          "*Detail kemasan:*",
          `- 5–40 ml: ${small} kemasan`,
          `- 50–100 ml: ${medium} kemasan`,
          `- 200–500 ml: ${large} kemasan`,
          `Total: ${count} kemasan`,
          `Estimasi SKINPoint: ${points} pts (menunggu verifikasi)`,
          "",
          `Tanggal pilihan: ${date}`,
          `Jam pilihan: ${time} WIB`,
          `Alamat penjemputan: ${location}`,
          ...(note ? [`Catatan member: ${note}`] : []),
          "",
          "Ini pengajuan simulasi dari RE-SKIN. Mohon konfirmasi area dan jadwal. Terima kasih.",
        ].join("\n");
        lastPickup = { count, points, date, time };
        let copied = false;
        try {
          await navigator.clipboard.writeText(message);
          copied = true;
        } catch {
          copied = false;
        }
        const whatsappOpened = openAdminWhatsApp(message, whatsappTab);
        openModal(`<div class="tag">PESAN PICKUP SIAP</div>
          <h3 id="modalTitle">Yay, siap pickup! ${iconHtml("recycle")}</h3>
          <p>Pengajuanmu masih berstatus <strong>simulasi</strong> dan belum tersimpan di Supabase. ${whatsappOpened ? "WhatsApp Admin sudah dibuka dengan pesan siap kirim. Tekan Kirim di WhatsApp agar admin menerima pengajuan." : copied ? "Nomor WhatsApp Admin belum dikonfigurasi; pesan sudah disalin ke clipboard." : "Nomor WhatsApp Admin belum dikonfigurasi. Isi variabel kontak admin agar pesan bisa dibuka otomatis."}</p>
          <div class="pickup-preview"><strong>${count} kemasan · ${points} pts</strong><br><small>Perkiraan poin, bukan saldo terverifikasi.</small></div>
          <label class="form-field">Pesan WhatsApp<textarea readonly rows="9" id="pickupText">${escapeHtml(message)}</textarea></label>
          <div class="notice">Poin aktual hanya diberikan dari kemasan yang dinyatakan diterima admin, dengan perhitungan sesuai kelompok ukuran.</div>
          <button class="btn" id="selectMessage">Pilih Teks Pesan ${iconHtml("arrow-up-right")}</button>
          <button class="btn btn-outline" id="backDash" style="margin-left:9px;box-shadow:none">Lihat Dashboard</button>`);
        document.getElementById("selectMessage")?.addEventListener("click", () => {
          (document.getElementById("pickupText") as HTMLTextAreaElement | null)?.select();
        });
        document.getElementById("backDash")?.addEventListener("click", dashboard);
      });
    }

    function reward(name: string, points: string) {
      openModal(`<div class="tag">RE-SKIN GIVEAWAY ${iconHtml("gift")}</div>
        <h3 id="modalTitle">${escapeHtml(name)}</h3>
        <p>Kategori giveaway ini tercantum pada rentang <strong>${escapeHtml(points)} SKINPoint</strong> dalam dokumen konsep.</p>
        <div class="notice">Rentang bukan harga pasti untuk setiap hadiah. Stok, produk yang tersedia, dan harga poin final perlu diisi oleh admin sebelum katalog aktif. Klaim hadiah membutuhkan saldo poin dari botol yang lolos verifikasi.</div>
        <button class="btn" id="rewardLogin">${currentUser ? "Cek Saldo" : "Masuk untuk Cek Saldo"} ${iconHtml("arrow-up-right")}</button>`);
      document.getElementById("rewardLogin")?.addEventListener("click", login);
    }

    function guide() {
      openModal(`<div class="tag">PACKAGING GUIDE</div>
        <h3 id="modalTitle">Bersihkan empties-mu ${iconHtml("sparkles")}</h3>
        <p>Kemasan skincare dan makeup berbahan kaca/plastik boleh diajukan jika kosong, bersih, dan aman ditangani.</p>
        <div class="mini-row"><strong>5–40 ml</strong><span>5 SKINPoint/kemasan</span></div>
        <div class="mini-row"><strong>50–100 ml</strong><span>10 SKINPoint/kemasan</span></div>
        <div class="mini-row"><strong>200–500 ml</strong><span>15 SKINPoint/kemasan</span></div>
        <div class="notice">Ukuran lain belum tercantum dalam aturan konsep. Admin akan menghitung jumlah diterima, ditolak, dan alasan penolakan. Hanya kemasan lolos yang menambah saldo.</div>
        <button class="btn" id="guidePickup">Ajukan Pickup ${iconHtml("arrow-up-right")}</button>`);
      document.getElementById("guidePickup")?.addEventListener("click", pickup);
    }

    function help() {
      openModal(`<div class="tag">SAY HELLO</div>
        <h3 id="modalTitle">Hubungi RE-SKIN.</h3>
        <p>Dokumen program menyebut TikTok dan Instagram untuk promosi. Namun nomor WhatsApp, akun resmi, serta lokasi kampus belum dicantumkan.</p>
        <div class="notice">Kontak dan tautan media sosial asli perlu diisi saat konfigurasi. Prototipe ini tidak menggunakan nomor atau akun rekaan.</div>
        <button class="btn" id="helpClose">Oke, Mengerti</button>`);
      document.getElementById("helpClose")?.addEventListener("click", closeModal);
    }

    function legal(type: "privacy" | "terms") {
      window.location.assign(type === "privacy" ? "/kebijakan-privasi" : "/syarat-ketentuan");
    }

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const authToggle = target.closest<HTMLElement>("[data-auth-toggle]");
      if (authToggle) {
        const wrap = authToggle.closest<HTMLElement>(".landing-account-wrap");
        if (wrap) {
          const isOpen = wrap.classList.contains("is-open");
          closeAuthMenus();
          if (!isOpen) {
            wrap.classList.add("is-open");
            authToggle.classList.add("is-open");
            authToggle.setAttribute("aria-expanded", "true");
            const popover = wrap.querySelector<HTMLElement>(".account-profile-popover");
            if (popover) popover.hidden = false;
          }
        }
        return;
      }

      const signoutTrigger = target.closest<HTMLElement>("[data-auth-signout]");
      if (signoutTrigger) {
        closeAuthMenus();
        if (supabase) {
          void supabase.auth.signOut().then(() => {
            currentUser = null;
            renderGuestAuth();
            toast("Kamu sudah keluar dari akun.");
          });
        } else {
          renderGuestAuth();
        }
        closeMenu();
        return;
      }

      if (!target.closest(".landing-account-wrap")) closeAuthMenus();

      const actionElement = target.closest<HTMLElement>("[data-action]");
      if (actionElement) {
        const action = actionElement.dataset.action;
        switch (action) {
          case "login":
            login("login");
            break;
          case "signup":
            login("signup");
            break;
          case "pickup":
            pickup();
            break;
          case "guide":
            guide();
            break;
          case "catalog":
            document.querySelector("#katalog-hadiah")?.scrollIntoView({ behavior: "smooth" });
            toast("Pilih giveaway untuk melihat detail kategori.");
            break;
          case "help":
            help();
            break;
          case "legal":
            legal("privacy");
            break;
          case "terms":
            legal("terms");
            break;
        }
      }

      const rewardButton = target.closest<HTMLElement>(".reward-btn");
      if (rewardButton) {
        const card = rewardButton.closest<HTMLElement>(".reward-card");
        if (card) reward(card.dataset.name ?? "Hadiah RE-SKIN", card.dataset.points ?? "Belum ditentukan");
      }

      if (target.closest("#modalClose") || target === backdrop) closeModal();
      if (mobileNav && target.closest("#mobileNav a, #mobileNav button")) closeMenu();
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape" && backdrop!.classList.contains("show")) closeModal();
    }

    const onHamburgerClick = () => {
      const isOpen = mobileNav?.classList.toggle("show") ?? false;
      hamburger?.setAttribute("aria-expanded", String(isOpen));
    };
    hamburger?.addEventListener("click", onHamburgerClick);

    document.querySelectorAll<HTMLButtonElement>(".filter").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll<HTMLButtonElement>(".filter").forEach((filter) => {
          filter.classList.remove("active");
          filter.setAttribute("aria-pressed", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
        document.querySelectorAll<HTMLElement>(".reward-card").forEach((card) => {
          card.classList.toggle(
            "hidden",
            button.dataset.filter !== "semua" && card.dataset.category !== button.dataset.filter,
          );
        });
      });
    });

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);

    return () => {
      hamburger?.removeEventListener("click", onHamburgerClick);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeydown);
      authUnsubscribe?.();
      if (landingStatsChannel && supabase) void supabase.removeChannel(landingStatsChannel);
      if (landingStatsPollTimer) window.clearInterval(landingStatsPollTimer);
      document.removeEventListener("visibilitychange", onLandingStatsVisibilityChange);
      if (toastTimer) window.clearTimeout(toastTimer);
      document.body.style.overflow = "";
    };
  }, []);

  return <>{children}</>;
}
