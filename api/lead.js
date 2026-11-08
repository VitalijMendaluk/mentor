// Vercel Serverless Function: приймає заявку з квізу і надсилає її в Telegram-групу.
// Виконується на сервері Vercel — у браузері цей код не видно.
//
// ОБОВ'ЯЗКОВО: у Vercel → проєкт квізу → Settings → Environment Variables додай:
//   TG_BOT_TOKEN — токен того самого бота, що й у старому квізі (через @BotFather / зі старого проєкту)
//   TG_CHAT_ID   — ID Telegram-групи заявок (можна не додавати: за замовчуванням стоїть стара група)
// Після додавання змінних зроби Redeploy.

const TOKEN = process.env.TG_BOT_TOKEN || '';
const CHAT_ID = process.env.TG_CHAT_ID || '-4934715371';

const esc = (v) => String(v ?? '')
  .replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))
  .slice(0, 300);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!TOKEN) {
    console.error('TG_BOT_TOKEN не задано у Vercel → Settings → Environment Variables');
    return res.status(500).json({ ok: false });
  }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  const name = String(b.name || '').trim();
  const phone = String(b.phone || '').replace(/[^\d+]/g, '');
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || digits.length < 7) return res.status(400).json({ ok: false });

  const u = b.utm || {};
  const text = [
    `🔥 <b>Нова заявка — квіз «TikTok Європа»</b>`,
    ``,
    `👤 <b>${esc(name)}</b>`,
    `📞 ${esc(phone)}`,
    `👉 <a href="https://wa.me/${digits}">WhatsApp</a> · <a href="https://t.me/+${digits}">Telegram</a> · <a href="viber://chat?number=%2B${digits}">Viber</a>`,
    ``,
    `🎯 Мета: ${esc(b.goal)}`,
    `🛑 Заважає: ${esc(b.barrier)}`,
    `💰 ${esc(b.filter)}`,
    `🌍 Пояс: ${esc(b.userTZ)}`,
    `🏷 ${esc([u.utm_campaign, u.utm_content].filter(Boolean).join(' / ') || 'без UTM')}`
  ].join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    if (!r.ok) throw new Error(await r.text());
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('TG error', e);
    return res.status(500).json({ ok: false });
  }
};
