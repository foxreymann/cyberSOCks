/** Telegram delivery — business logic only. */

export function telegramConfigured() {
  return Boolean(global.telegram?.token && global.telegram?.chatId)
}

export async function sendTelegram(text, { html = false } = {}) {
  if (!telegramConfigured()) {
    throw new Error('Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env')
  }
  const body = text.length <= 3900 ? text : `${text.slice(0, 3890)}\n…`
  const payload = {
    chat_id: global.telegram.chatId,
    text: body,
    disable_web_page_preview: true
  }
  if (html) payload.parse_mode = 'HTML'
  const url = `https://api.telegram.org/bot${global.telegram.token}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram API error: ${JSON.stringify(data)}`)
  return data
}
