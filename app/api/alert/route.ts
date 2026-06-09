import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Tender } from "@/lib/types";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateEmailHtml(tenders: Tender[], recipientEmail: string): string {
  const highMatch = tenders.filter((t) => t.compatibilita === "Alta compatibilità");
  const medMatch = tenders.filter((t) => t.compatibilita === "Media compatibilità");
  const date = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const renderTenderRow = (t: Tender) => {
    const badgeColor =
      t.compatibilita === "Alta compatibilità"
        ? "#16a34a"
        : t.compatibilita === "Media compatibilità"
          ? "#d97706"
          : "#6b7280";

    return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <a href="${t.linkOriginale}" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">${t.titolo}</a>
        <br/>
        <small style="color: #6b7280;">${t.stazioneAppaltante}</small>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 12px; white-space: nowrap;">
          ${t.compatibilita}
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; white-space: nowrap;">${t.fonte}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; white-space: nowrap;">${t.importo}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; white-space: nowrap;">${t.scadenza}</td>
    </tr>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Report Bandi — Gruppo Angelini</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; color: white;">
      <h1 style="margin: 0 0 8px; font-size: 24px;">🗺️ Ulisse — Report Bandi & PNRR</h1>
      <p style="margin: 0; opacity: 0.9;">Monitor bandi pubblici · ${date}</p>
    </div>

    <!-- Stats -->
    <div style="display: flex; gap: 16px; padding: 24px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
      <div style="flex: 1; text-align: center; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 32px; font-weight: 700; color: #16a34a;">${highMatch.length}</div>
        <div style="color: #6b7280; font-size: 14px;">Alta Compatibilità</div>
      </div>
      <div style="flex: 1; text-align: center; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 32px; font-weight: 700; color: #d97706;">${medMatch.length}</div>
        <div style="color: #6b7280; font-size: 14px;">Media Compatibilità</div>
      </div>
      <div style="flex: 1; text-align: center; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 32px; font-weight: 700; color: #1d4ed8;">${tenders.length}</div>
        <div style="color: #6b7280; font-size: 14px;">Totale Bandi</div>
      </div>
    </div>

    <!-- Tenders Table -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Bandi trovati</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 10px 12px; text-align: left; color: #374151; border-bottom: 2px solid #e5e7eb;">Titolo / Stazione Appaltante</th>
            <th style="padding: 10px 12px; text-align: center; color: #374151; border-bottom: 2px solid #e5e7eb;">Compatibilità</th>
            <th style="padding: 10px 12px; text-align: left; color: #374151; border-bottom: 2px solid #e5e7eb;">Fonte</th>
            <th style="padding: 10px 12px; text-align: left; color: #374151; border-bottom: 2px solid #e5e7eb;">Importo</th>
            <th style="padding: 10px 12px; text-align: left; color: #374151; border-bottom: 2px solid #e5e7eb;">Scadenza</th>
          </tr>
        </thead>
        <tbody>
          ${tenders.map(renderTenderRow).join("")}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        Report generato da Ulisse · Monitor bandi pubblici e PNRR.<br>
        Inviato a ${recipientEmail} · ${new Date().toLocaleString("it-IT")}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const { email, tenders } = await req.json();

    if (!email || !tenders) {
      return NextResponse.json({ error: "Email e bandi sono obbligatori" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY non configurata. Aggiungi la variabile d'ambiente." },
        { status: 500 }
      );
    }

    const html = generateEmailHtml(tenders, email);
    const highCount = (tenders as Tender[]).filter(
      (t) => t.compatibilita === "Alta compatibilità"
    ).length;

    const { data, error } = await resend.emails.send({
      from: "Angelini Monitor <noreply@resend.dev>",
      to: [email],
      subject: `🗺️ Ulisse · Bandi & PNRR — ${highCount} ad alta compatibilità — ${new Date().toLocaleDateString("it-IT")}`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
