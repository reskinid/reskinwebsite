"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { openAdminWhatsApp, reserveAdminWhatsAppWindow } from "@/lib/whatsapp";

export default function MemberRedeemButton({
  rewardId, rewardName, pointsCost, stock, balance, memberName, memberEmail,
}: {
  rewardId: string;
  rewardName: string;
  pointsCost: number | null;
  stock: number;
  balance: number;
  memberName: string;
  memberEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);

  async function requestReward() {
    if (!pointsCost || stock < 1 || balance < pointsCost || loading) return;
    setFeedback("");
    setFeedbackError(false);
    const whatsappTab = reserveAdminWhatsAppWindow();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      whatsappTab?.close();
      setFeedbackError(true);
      setFeedback("Koneksi Supabase belum tersedia. Muat ulang halaman atau hubungi Bestie Care.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("submit_redemption_request", { p_reward_id: rewardId });
    if (error || !data) {
      whatsappTab?.close();
      setLoading(false);
      setFeedbackError(true);
      setFeedback(error?.message.includes("Insufficient") ? "SKINPoint kamu belum mencukupi." : "Pengajuan belum berhasil. Periksa saldo dan stok, lalu coba kembali.");
      return;
    }

    const requestId = String(data);
    const { data: request } = await supabase.from("redemption_requests").select("request_code").eq("id", requestId).maybeSingle();
    const requestCode = request?.request_code || requestId;
    const message = [
      "Halo Bestie Care RE-SKIN!",
      "",
      "*PENGAJUAN PENUKARAN HADIAH BARU*",
      `Nomor pengajuan: ${requestCode}`,
      `Nama Beauty Bestie: ${memberName}`,
      `Email: ${memberEmail}`,
      `Hadiah: ${rewardName}`,
      `SKINPoint: ${pointsCost.toLocaleString("id-ID")} pts`,
      `Tanggal: ${new Date().toLocaleDateString("id-ID")}`,
      "",
      "Mohon konfirmasi pengajuan dan instruksi pengambilan/pengiriman hadiah. Terima kasih.",
    ].join("\n");

    const whatsappOpened = openAdminWhatsApp(message, whatsappTab);
    setLoading(false);
    setFeedbackError(false);
    setFeedback(whatsappOpened
      ? `Pengajuan ${requestCode} tersimpan. WhatsApp Bestie Care dibuka; tekan Kirim agar tim Bestie Care menerima pemberitahuan.`
      : `Pengajuan ${requestCode} tersimpan. Tim RE-SKIN dapat menindaklanjutinya melalui dashboard dan notifikasi.`);
    router.refresh();
  }

  const unavailable = !pointsCost || stock < 1 || balance < pointsCost;
  const contactMessage = `Halo Bestie Care RE-SKIN! Saya ingin bertanya tentang kebutuhan SKINPoint untuk hadiah ${rewardName}.`;
  const contactHref = `https://wa.me/628138809289?text=${encodeURIComponent(contactMessage)}`;
  return (
    <div className="member-redeem-action">
      {!pointsCost ? (
        <a className="btn btn-outline member-redeem-button" href={contactHref} target="_blank" rel="noopener noreferrer">Tanya Bestie Care</a>
      ) : (
        <button className="btn btn-dark member-redeem-button" type="button" disabled={unavailable || loading} onClick={() => void requestReward()}>
          {loading ? "Mengirim..." : stock < 1 ? "Stok habis" : balance < pointsCost ? `Butuh ${(pointsCost - balance).toLocaleString("id-ID")} pts lagi` : <><Icon name="gift" size={15} /> Tukar hadiah</>}
        </button>
      )}
      {feedback ? <small className={feedbackError ? "member-redeem-feedback is-error" : "member-redeem-feedback"}>{feedback}</small> : null}
    </div>
  );
}
