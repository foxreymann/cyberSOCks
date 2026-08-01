#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import './data/config.js'
import { collect } from './libs/collect.js'
import { analyzeStream } from './libs/analyst.js'
import { sendTelegram, telegramConfigured } from './libs/telegram.js'
import {
  logBanner,
  logModeConnect,
  logCollection,
  logStreamStart,
  logStreamChunk,
  logStreamEnd,
  logStatus,
  logTelegram,
  logError,
  logCron,
  logDryRun,
  formatTelegramBriefing
} from './libs/logs.js'

const lastPath = join(global.rootDir, '.last_audit.json')
const entryJs = join(global.rootDir, 'cybersocks.js')

function parseArgs(argv) {
  const [cmd = 'help', ...rest] = argv
  const flags = new Set()
  const opts = {}
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = rest[i + 1]
      if (next && !next.startsWith('--')) {
        opts[key] = next
        i++
      } else {
        flags.add(key)
      }
    }
  }
  return { cmd, flags, opts }
}

function applyMode(flags, opts) {
  if (flags.has('tee') && flags.has('non-tee')) {
    throw new Error('Use either --tee or --non-tee, not both')
  }
  if (opts.mode) global.setMode(opts.mode)
  else if (flags.has('tee')) global.setMode('tee')
  else if (flags.has('non-tee')) global.setMode('non-tee')
}

function readLast() {
  if (!existsSync(lastPath)) return null
  try {
    return JSON.parse(readFileSync(lastPath, 'utf8'))
  } catch {
    return null
  }
}

function saveLast(bundle, briefing) {
  writeFileSync(
    lastPath,
    JSON.stringify(
      {
        ...bundle,
        briefing,
        mode: global.mode,
        model: global.activeBackend().model,
        savedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
      },
      null,
      2
    )
  )
}

function missingKeyMessage() {
  if (global.mode === 'tee') {
    return 'NEAR_AI_API_KEY not set. Copy .env.example → .env and add your key from https://cloud.near.ai'
  }
  return 'OPENCODE_API_KEY not set. Copy .env.example → .env and add your OpenCode Zen key from https://opencode.ai/auth'
}

async function cmdStatus({ flags, opts }) {
  applyMode(flags, opts)
  logBanner()
  logStatus({
    hasOpencodeKey: Boolean(global.opencode.apiKey),
    hasNearKey: Boolean(global.nearai.apiKey),
    hasTelegram: telegramConfigured(),
    lastAudit: readLast()
  })
}

async function cmdAudit({ flags, opts }) {
  applyMode(flags, opts)
  const dryRun = flags.has('dry-run')
  const quiet = flags.has('quiet')
  const wantTelegram = flags.has('telegram')
  const noSave = flags.has('no-save')

  logBanner()
  if (!quiet && !dryRun) await logModeConnect()

  global.audit = await collect()
  logCollection(global.audit)

  let briefing = ''
  if (dryRun) {
    logDryRun()
  } else {
    const key = global.activeBackend().apiKey
    if (!key) {
      logError(missingKeyMessage())
      process.exitCode = 2
      return
    }
    try {
      logStreamStart()
      const parts = []
      for await (const chunk of analyzeStream(global.audit)) {
        parts.push(chunk)
        logStreamChunk(chunk)
      }
      logStreamEnd()
      briefing = parts.join('')
      global.briefing = briefing
    } catch (e) {
      logError(e.message)
      process.exitCode = 1
      return
    }
  }

  if (!noSave) saveLast(global.audit, briefing)

  if (wantTelegram) {
    if (!briefing) {
      logTelegram(false, 'no briefing to send (use without --dry-run)')
      return
    }
    try {
      await sendTelegram(formatTelegramBriefing(global.audit, briefing), { html: true })
      logTelegram(true)
    } catch (e) {
      logTelegram(false, e.message)
      process.exitCode = 1
    }
  }
}

async function cmdCollect({ opts }) {
  logBanner()
  global.audit = await collect()
  logCollection(global.audit)
  if (opts.json) {
    writeFileSync(opts.json, JSON.stringify(global.audit, null, 2))
    console.log(`Wrote ${opts.json}`)
  }
}

function cmdCron({ flags, opts }) {
  applyMode(flags, opts)
  const hour = Number(opts.hour ?? 9)
  const withTelegram = !flags.has('no-telegram')
  const bin = existsSync(entryJs) ? `node ${entryJs}` : 'cybersocks'
  const modeFlag = global.mode === 'tee' ? '--tee' : '--non-tee'
  const extra = withTelegram ? `${modeFlag} --telegram --quiet` : `${modeFlag} --quiet`
  const line = `0 ${hour} * * * cd ${global.rootDir} && ${bin} audit ${extra} >>${join(global.rootDir, 'cybersocks-cron.log')} 2>&1`
  logCron(line)
}

function cmdHelp() {
  console.log(`cyberSOCks — Cyber Security Operations Center

Modes:
  --non-tee   OpenCode Zen · Laguna S 2.1 Free (default)
  --tee       NEAR AI Cloud · deepseek-ai/DeepSeek-V4-Flash (GPU TEE)

Usage:
  cybersocks status [--tee|--non-tee]
  cybersocks audit --non-tee [--telegram] [--dry-run] [--quiet] [--no-save]
  cybersocks audit --tee [--telegram] [--dry-run] [--quiet] [--no-save]
  cybersocks collect [--json path]
  cybersocks cron [--tee|--non-tee] [--hour 9] [--no-telegram]
  cybersocks help

Env:
  CYBERSOCKS_MODE=tee|non-tee   default mode
  OPENCODE_API_KEY              non-TEE
  NEAR_AI_API_KEY               TEE
  TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
`)
}

export async function main() {
  const { cmd, flags, opts } = parseArgs(process.argv.slice(2))
  try {
    switch (cmd) {
      case 'status':
        await cmdStatus({ flags, opts })
        break
      case 'audit':
        await cmdAudit({ flags, opts })
        break
      case 'collect':
      case 'collect-only':
        await cmdCollect({ opts })
        break
      case 'cron':
        cmdCron({ flags, opts })
        break
      case 'help':
      case '--help':
      case '-h':
        cmdHelp()
        break
      default:
        logError(`unknown command: ${cmd}`)
        cmdHelp()
        process.exitCode = 1
    }
  } catch (e) {
    logError(e.message)
    process.exitCode = 1
  }
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  await main()
}
