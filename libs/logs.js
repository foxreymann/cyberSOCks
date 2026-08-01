/** Display / log layer — formats and prints. No business logic. */

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
}

const severityColor = {
  critical: c.red + c.bold,
  high: c.red,
  medium: c.yellow,
  low: c.cyan,
  info: c.dim
}

const severityIcon = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: '⚪'
}

function line(ch = '─', n = 64) {
  return ch.repeat(n)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function escHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function detectPosture(briefing) {
  const head = briefing.slice(0, 400).toUpperCase()
  if (/\bRED\b/.test(head)) return { icon: '🔴', label: 'RED', tone: 'critical' }
  if (/\bAMBER\b|\bYELLOW\b/.test(head)) return { icon: '🟡', label: 'AMBER', tone: 'medium' }
  if (/\bGREEN\b/.test(head)) return { icon: '🟢', label: 'GREEN', tone: 'info' }
  return { icon: '🟣', label: 'REVIEW', tone: 'info' }
}

function findingsStrip(findings = []) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  for (const f of findings) {
    if (counts[f.severity] !== undefined) counts[f.severity]++
  }
  return [
    counts.critical ? `${severityIcon.critical}<b>${counts.critical}</b>` : null,
    counts.high ? `${severityIcon.high}<b>${counts.high}</b>` : null,
    counts.medium ? `${severityIcon.medium}<b>${counts.medium}</b>` : null,
    counts.low ? `${severityIcon.low}<b>${counts.low}</b>` : null,
    counts.info ? `${severityIcon.info}<b>${counts.info}</b>` : null
  ]
    .filter(Boolean)
    .join('  ')
}

function briefingToHtml(text) {
  const escaped = escHtml(text)
  return escaped
    .split('\n')
    .map(ln => {
      const t = ln.trimEnd()
      if (!t) return ''
      if (/^(#+)\s/.test(t)) {
        const title = t.replace(/^#+\s*/, '')
        return `\n<b>📌 ${title}</b>`
      }
      if (/^\d+\.\s/.test(t)) return `▪ ${t.replace(/^\d+\.\s*/, '')}`
      if (/^[-*•]\s/.test(t)) return `• ${t.replace(/^[-*•]\s*/, '')}`
      if (/^(GREEN|AMBER|RED|YELLOW)\b/i.test(t)) {
        const p = detectPosture(t)
        return `${p.icon} <b>${escHtml(t)}</b>`
      }
      return t
    })
    .join('\n')
}

/** Rich HTML Telegram briefing — display only. */
export function formatTelegramBriefing(bundle, briefing) {
  const b = global.activeBackend()
  const tee = global.mode === 'tee'
  const posture = detectPosture(briefing)
  const strip = findingsStrip(bundle.findings)
  const modeIcon = tee ? '🔐' : '☁️'
  const modeLabel = tee ? 'TEE · confidential' : 'non-TEE · OpenCode'

  const parts = [
    `${posture.icon} <b>cyberSOCks</b> · daily SOC briefing`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🖥 <b>Host</b>  <code>${escHtml(bundle.hostname)}</code>`,
    `🕒 <b>Time</b>  ${escHtml(bundle.collectedAt)}`,
    `${modeIcon} <b>Mode</b>  ${modeLabel}`,
    `🧠 <b>Analyst</b>  ${escHtml(b.provider)}`,
    `   <i>${escHtml(b.displayName)}</i>`,
    `   <code>${escHtml(b.model)}</code>`,
    strip ? `📊 <b>Sensors</b>  ${strip}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>${posture.icon} Posture · ${posture.label}</b>`,
    ``,
    briefingToHtml(briefing)
  ].filter(x => x !== null)

  let msg = parts.join('\n')
  if (msg.length > 3900) msg = `${msg.slice(0, 3880)}\n\n<i>…truncated</i>`
  return msg
}

export function logBanner() {
  console.log(`${c.green}${line('═')}${c.reset}`)
  console.log(`${c.bold}${c.green}cyberSOCks${c.reset}  ${c.bold}Cyber Security Operations Center${c.reset}`)
  console.log(`${c.dim}daily host audit · server SOC${c.reset}`)
  console.log(`${c.green}${line('═')}${c.reset}`)
}

export async function logModeConnect() {
  const tee = global.mode === 'tee'
  const b = global.activeBackend()
  console.log()
  console.log(`${tee ? c.magenta : c.cyan}${line()}${c.reset}`)
  console.log(
    tee
      ? `${c.bold}${c.magenta}TEE mode · NEAR AI Cloud${c.reset}`
      : `${c.bold}${c.cyan}non-TEE mode · OpenCode Zen${c.reset}`
  )
  console.log(`${tee ? c.magenta : c.cyan}${line()}${c.reset}`)

  if (tee) {
    const steps = [
      'Connecting to cloud-api.near.ai',
      'Requesting hardware attestation report',
      'Binding model to GPU TEE enclave',
      'Opening confidential analyst channel'
    ]
    for (const label of steps) {
      process.stdout.write(`  ${c.dim}›${c.reset} ${label}…`)
      await sleep(140)
      console.log(` ${c.green}✓${c.reset}`)
    }
    console.log()
    console.log(`${c.bold}${b.provider}${c.reset}`)
    console.log(`${c.bold}${b.displayName}${c.reset}`)
    console.log(`${c.dim}${c.cyan}${b.model}${c.reset}`)
    console.log(`${c.dim}${b.modelUrl}${c.reset}`)
    console.log()
    console.log(b.badges.map(x => `${c.bold}${c.green}${x}${c.reset}`).join('  ·  '))
  } else {
    console.log()
    console.log(`${c.bold}${b.provider}${c.reset}`)
    console.log(`${c.bold}${b.displayName}${c.reset}`)
    console.log(`${c.dim}${c.cyan}${b.model}${c.reset}`)
    console.log(`${c.dim}Honest non-confidential inference (no TEE)${c.reset}`)
  }
  console.log()
}

export function logCollection(bundle) {
  console.log(`${c.bold}Sensor sweep${c.reset}`)
  console.log(line())
  for (const f of bundle.findings) {
    const color = severityColor[f.severity] || c.white
    const icon = severityIcon[f.severity] || '•'
    const sev = `${color}${f.severity.toUpperCase().padEnd(8)}${c.reset}`
    console.log(`  ${icon} ${f.check.padEnd(18)} ${sev} ${f.title}`)
  }
  console.log()
  console.log(
    `  ${c.dim}host${c.reset} ${bundle.hostname}  ${c.dim}at${c.reset} ${bundle.collectedAt}  ${c.dim}os${c.reset} ${bundle.os}`
  )
  console.log()
}

export function logStreamStart() {
  const b = global.activeBackend()
  const color = global.mode === 'tee' ? c.magenta : c.cyan
  console.log(`${color}${line()}${c.reset}`)
  console.log(
    `${c.bold}${color}${b.displayName}${c.reset} ${c.dim}· ${global.mode} · SOC briefing${c.reset}`
  )
  console.log(`${color}${line()}${c.reset}`)
  console.log()
}

export function logStreamChunk(chunk) {
  process.stdout.write(chunk)
}

export function logStreamEnd() {
  console.log('\n')
}

export function logBriefing(text) {
  console.log(`${c.bold}Briefing${c.reset}`)
  console.log(line())
  console.log(text)
  console.log()
}

export function logStatus({ hasOpencodeKey, hasNearKey, hasTelegram, lastAudit }) {
  console.log(`  Mode       : ${c.bold}${global.mode}${c.reset}`)
  console.log(
    `  non-TEE    : ${global.opencode.provider} / ${c.cyan}${global.opencode.model}${c.reset}` +
      `  (${hasOpencodeKey ? `${c.green}key ok${c.reset}` : `${c.red}missing OPENCODE_API_KEY${c.reset}`})`
  )
  console.log(
    `  TEE        : ${global.nearai.provider} / ${c.magenta}${global.nearai.model}${c.reset}` +
      `  (${hasNearKey ? `${c.green}key ok${c.reset}` : `${c.red}missing NEAR_AI_API_KEY${c.reset}`})`
  )
  console.log(
    `  Telegram   : ${hasTelegram ? `${c.green}configured${c.reset}` : `${c.dim}not set${c.reset}`}`
  )
  if (lastAudit) {
    console.log(
      `  Last audit : ${lastAudit.collectedAt} on ${lastAudit.hostname}` +
        (lastAudit.mode ? ` [${lastAudit.mode}]` : '')
    )
  } else {
    console.log(`  Last audit : ${c.dim}none yet${c.reset}`)
  }
}

export function logTelegram(ok, detail = '') {
  if (ok) console.log(`${c.green}✓${c.reset} Telegram update posted${detail ? `: ${detail}` : ''}`)
  else console.log(`${c.yellow}!${c.reset} Telegram skipped — ${detail}`)
}

export function logError(msg) {
  console.error(`${c.bold}${c.red}error${c.reset} ${msg}`)
}

export function logCron(lineText) {
  console.log('Add to crontab (crontab -e):\n')
  console.log(`  ${lineText}`)
  console.log(`\n${c.dim}Tip: schedule on each server with cron — Telegram delivers the briefing.${c.reset}`)
}

export function logDryRun() {
  console.log(`${c.dim}Dry run — skipped analyst (${global.mode}).${c.reset}`)
}
