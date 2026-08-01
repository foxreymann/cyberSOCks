import { summaryForPrompt } from './collect.js'

const systemPrompt = `You are the lead analyst in a Cyber Security Operations Center (SOC).
You receive a host security audit bundle collected from a production server
(or any Linux host under SOC monitoring).

Produce a concise daily SOC briefing:
1. Overall posture: GREEN / AMBER / RED (one word first line after a short header)
2. Top findings (max 5 bullets) with severity and why it matters
3. Recommended actions (max 5, concrete, ordered by priority)
4. Watch items for the next 24h

Be direct, technical, and actionable. Do not invent vulnerabilities that are not supported
by the evidence. If data is missing, say so. Keep the full briefing under 450 words.
Format for both a terminal and a Telegram message (plain text, light markdown ok).`

function backend() {
  return global.activeBackend()
}

function ensureKey() {
  const b = backend()
  if (b.apiKey) return
  if (global.mode === 'tee') {
    throw new Error(
      'Missing NEAR_AI_API_KEY. Get one at https://cloud.near.ai and put it in .env'
    )
  }
  throw new Error(
    'Missing OPENCODE_API_KEY. Get one at https://opencode.ai/auth and put it in .env'
  )
}

function errorLabel() {
  return global.mode === 'tee' ? 'NEAR AI Cloud' : 'OpenCode Zen'
}

function requestBody(auditText, stream) {
  const body = {
    model: backend().model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          "Analyze this host security audit bundle and write today's SOC briefing.\n\n" +
          auditText
      }
    ],
    temperature: 0.3,
    max_tokens: 1200,
    stream
  }
  if (global.mode === 'tee') {
    body.enable_thinking = false
    body.chat_template_kwargs = { enable_thinking: false }
  }
  return body
}

function messageText(data) {
  const msg = data.choices?.[0]?.message || {}
  return (msg.content || msg.reasoning_content || '').trim()
}

function withTimeout(ms) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  return {
    signal: ctrl.signal,
    clear: () => clearTimeout(timer)
  }
}

/** Non-streaming analysis. Returns { text, model, usage, mode }. */
export async function analyze(bundle) {
  ensureKey()
  const b = backend()
  const timeoutMs = global.mode === 'tee' ? b.timeoutMs || 90000 : 120000
  const { signal, clear } = withTimeout(timeoutMs)
  let res
  try {
    res = await fetch(`${b.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${b.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody(summaryForPrompt(bundle), false)),
      signal
    })
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`${errorLabel()} timed out after ${timeoutMs}ms`)
    }
    throw e
  } finally {
    clear()
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${errorLabel()} error ${res.status}: ${err.slice(0, 500)}`)
  }
  const data = await res.json()
  const text = messageText(data)
  if (!text) throw new Error(`${errorLabel()} returned empty content`)
  return {
    text,
    model: b.model,
    usage: data.usage || {},
    mode: global.mode
  }
}

/**
 * Yield briefing text.
 * TEE uses non-stream (NEAR Qwen thinking streams hang); non-TEE streams OpenCode.
 */
export async function* analyzeStream(bundle) {
  if (global.mode === 'tee') {
    const result = await analyze(bundle)
    const text = result.text
    const size = 48
    for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size)
    return
  }

  ensureKey()
  const b = backend()
  const timeoutMs = 120000
  const { signal, clear } = withTimeout(timeoutMs)
  let res
  try {
    res = await fetch(`${b.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${b.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody(summaryForPrompt(bundle), true)),
      signal
    })
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`${errorLabel()} timed out after ${timeoutMs}ms`)
    }
    throw e
  } finally {
    clear()
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${errorLabel()} error ${res.status}: ${err.slice(0, 500)}`)
  }
  let buffer = ''
  let saw = false
  for await (const chunk of res.body) {
    buffer += typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const payload = trimmed.slice(6)
      if (payload === '[DONE]') {
        if (!saw) throw new Error(`${errorLabel()} stream ended with no content`)
        return
      }
      let parsed
      try {
        parsed = JSON.parse(payload)
      } catch {
        continue
      }
      const delta = parsed.choices?.[0]?.delta || {}
      const content = delta.content || delta.reasoning_content
      if (content) {
        saw = true
        yield content
      }
    }
  }
  if (!saw) throw new Error(`${errorLabel()} stream ended with no content`)
}
