"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <button className="btn btn-outline" type="button" onClick={signOut} disabled={loading}>
      <Icon name="log-out" size={16} />
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
