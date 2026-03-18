export async function sendOccurrenceEmail(payload: { to: string; subject: string; html: string; }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !from) {
    return { ok: false, message: 'Configuração de email em falta.' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [payload.to], subject: payload.subject, html: payload.html }),
  });

  const result = await response.text();
  return { ok: response.ok, message: result };
}
