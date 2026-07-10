import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Resend client – initialised lazily so the module can be imported even when
// RESEND_API_KEY is not set (local dev / CI).
// ---------------------------------------------------------------------------
let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resend = new Resend(apiKey);
  return resend;
}

const DEFAULT_FROM = "noreply@openpims.dev";

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function emailLayout(
  practiceName: string,
  body: string,
  footer?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${practiceName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0d9488;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.01em;">${practiceName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              ${
                footer ||
                `<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Email ini dikirim oleh ${practiceName}. Jika kamu menerima ini karena kesalahan, silakan abaikan.</p>`
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function practiceFooter(opts: {
  practiceName: string;
  practicePhone?: string;
  practiceAddress?: string;
}): string {
  const lines: string[] = [];
  lines.push(opts.practiceName);
  if (opts.practicePhone) lines.push(opts.practicePhone);
  if (opts.practiceAddress) lines.push(opts.practiceAddress);
  return `<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">${lines.join(
    "<br/>"
  )}</p>`;
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#0d9488;border-radius:6px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getResend();

  if (!client) {
    // Development fallback – log to console instead of sending
    console.log("──────────────────────────────────────────");
    console.log(
      "[Email] No RESEND_API_KEY configured – logging email to console"
    );
    console.log(`  To:      ${options.to}`);
    console.log(`  From:    ${options.from || DEFAULT_FROM}`);
    console.log(`  Subject: ${options.subject}`);
    console.log("  HTML:    (omitted – check server logs for full content)");
    console.log("──────────────────────────────────────────");
    return { success: true, id: "dev-console" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: options.from || DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[Email] Exception:", message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Appointment reminder
// ---------------------------------------------------------------------------

export async function sendAppointmentReminder(data: {
  to: string;
  clientName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  practiceName: string;
  practicePhone?: string;
  practiceAddress?: string;
}): Promise<{ success: boolean }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Halo ${
      data.clientName
    },</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">Ini adalah pengingat tentang jadwal janji temu yang akan datang untuk <strong>${
      data.patientName
    }</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Tanggal</p>
          <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">${
            data.appointmentDate
          }</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Waktu</p>
          <p style="margin:0;color:#0f172a;font-size:18px;font-weight:600;">${
            data.appointmentTime
          }</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">Jika kamu perlu membatalkan atau menjadwalkan ulang, silakan hubungi kami${
      data.practicePhone ? ` di <strong>${data.practicePhone}</strong>` : ""
    } sesegera mungkin.</p>
    <p style="margin:24px 0 0;color:#111827;font-size:15px;line-height:1.6;">Kami sangat menantikan kedatangan kamu dan ${
      data.patientName
    }!</p>
  `;

  const footer = practiceFooter({
    practiceName: data.practiceName,
    practicePhone: data.practicePhone,
    practiceAddress: data.practiceAddress,
  });

  const html = emailLayout(data.practiceName, body, footer);

  const result = await sendEmail({
    to: data.to,
    subject: `Pengingat Janji Temu untuk ${data.patientName} – ${data.appointmentDate}`,
    html,
  });

  return { success: result.success };
}

// ---------------------------------------------------------------------------
// Vaccination reminder
// ---------------------------------------------------------------------------

export async function sendVaccinationReminder(data: {
  to: string;
  clientName: string;
  patientName: string;
  vaccineName: string;
  dueDate: string;
  practiceName: string;
  practicePhone?: string;
}): Promise<{ success: boolean }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Halo ${
      data.clientName
    },</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">Telah tiba waktunya untuk menjadwalkan vaksinasi <strong>${
      data.vaccineName
    }</strong> untuk <strong>${data.patientName}</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#fffbeb;border:1px solid #fef3c7;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Vaksin</p>
          <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">${
            data.vaccineName
          }</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Tanggal Jadwal</p>
          <p style="margin:0;color:#0f172a;font-size:18px;font-weight:600;">${
            data.dueDate
          }</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Silakan hubungi kami${
      data.practicePhone ? ` di <strong>${data.practicePhone}</strong>` : ""
    } untuk menjadwalkan janji temu bagi ${data.patientName}.</p>
    ${ctaButton(
      "Jadwalkan Janji Temu Hewan Kamu",
      `tel:${data.practicePhone || ""}`
    )}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Menjaga vaksinasi tetap terbaru sangat penting untuk kesehatan dan keselamatan hewan kesayangan kamu.</p>
  `;

  const footer = practiceFooter({
    practiceName: data.practiceName,
    practicePhone: data.practicePhone,
  });

  const html = emailLayout(data.practiceName, body, footer);

  const result = await sendEmail({
    to: data.to,
    subject: `Pengingat Vaksinasi: ${data.vaccineName} untuk ${data.patientName}`,
    html,
  });

  return { success: result.success };
}

// ---------------------------------------------------------------------------
// Invoice email
// ---------------------------------------------------------------------------

export async function sendInvoiceEmail(data: {
  to: string;
  clientName: string;
  patientName?: string;
  invoiceTotal: string;
  dueDate?: string;
  portalUrl?: string;
  practiceName: string;
  practicePhone?: string;
}): Promise<{ success: boolean }> {
  const patientLine = data.patientName
    ? ` untuk perawatan <strong>${data.patientName}</strong>`
    : "";

  const dueDateBlock = data.dueDate
    ? `<p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Jatuh Tempo</p>
       <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${data.dueDate}</p>`
    : "";

  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Halo ${
      data.clientName
    },</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">Berikut adalah tagihan kamu${patientLine} dari ${
    data.practiceName
  }.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Total Tagihan</p>
          <p style="margin:0${
            data.dueDate ? " 0 16px" : ""
          };color:#0f172a;font-size:28px;font-weight:700;">${
    data.invoiceTotal
  }</p>
          ${dueDateBlock}
        </td>
      </tr>
    </table>
    ${data.portalUrl ? ctaButton("Lihat di Portal", data.portalUrl) : ""}
    <p style="margin:0;color:#111827;font-size:15px;line-height:1.6;">Jika kamu memiliki pertanyaan tentang tagihan ini, silakan hubungi kami${
      data.practicePhone ? ` di <strong>${data.practicePhone}</strong>` : ""
    }.</p>
  `;

  const footer = practiceFooter({
    practiceName: data.practiceName,
    practicePhone: data.practicePhone,
  });

  const html = emailLayout(data.practiceName, body, footer);

  const result = await sendEmail({
    to: data.to,
    subject: `Tagihan dari ${data.practiceName} – ${data.invoiceTotal}`,
    html,
  });

  return { success: result.success };
}

// ---------------------------------------------------------------------------
// Account: email verification + password reset (hosted auth)
// ---------------------------------------------------------------------------

export async function sendVerificationEmail(data: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<{ success: boolean }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Halo ${
      data.name
    },</p>
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">Selamat datang di DraftKlinik! Mohon konfirmasi alamat email kamu untuk mengaktifkan akun dan memulai masa uji coba gratis kamu.</p>
    ${ctaButton("Verifikasi email saya", data.verifyUrl)}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Tautan ini akan kedaluwarsa dalam 24 jam. Jika kamu tidak pernah membuat akun DraftKlinik, kamu dapat mengabaikan email ini dengan aman.</p>
  `;
  const html = emailLayout("DraftKlinik", body);
  const result = await sendEmail({
    to: data.to,
    subject: "Verifikasi email DraftKlinik kamu",
    html,
  });
  return { success: result.success };
}

export async function sendPasswordResetEmail(data: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">Halo ${
      data.name
    },</p>
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi DraftKlinik kamu. Klik tombol di bawah ini untuk membuat kata sandi baru.</p>
    ${ctaButton("Atur ulang kata sandi", data.resetUrl)}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Tautan ini akan kedaluwarsa dalam 1 jam. Jika kamu tidak pernah meminta pengaturan ulang kata sandi, abaikan saja email ini — kata sandi kamu tidak akan berubah.</p>
  `;
  const html = emailLayout("DraftKlinik", body);
  const result = await sendEmail({
    to: data.to,
    subject: "Atur ulang kata sandi DraftKlinik kamu",
    html,
  });
  return { success: result.success };
}
