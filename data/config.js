import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv } from '../libs/env.js'

global.rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
loadEnv(global.rootDir)

// non-TEE — OpenCode Zen · Laguna S 2.1 Free
global.opencode = {
  apiKey: process.env.OPENCODE_API_KEY || process.env.OPENCODE_ZEN_API_KEY || '',
  baseUrl: (process.env.OPENCODE_BASE_URL || 'https://opencode.ai/zen/v1').replace(/\/$/, ''),
  model: process.env.OPENCODE_MODEL || 'laguna-s-2.1-free',
  displayName: 'Laguna S 2.1 Free',
  provider: 'OpenCode Zen'
}

// TEE — NEAR AI Cloud (DeepSeek V4 Flash — fast + attested)
global.nearai = {
  apiKey: process.env.NEAR_AI_API_KEY || process.env.NEAR_AI_CLOUD_API_KEY || '',
  baseUrl: (process.env.NEAR_AI_BASE_URL || 'https://cloud-api.near.ai/v1').replace(/\/$/, ''),
  model: process.env.NEAR_AI_MODEL || 'deepseek-ai/DeepSeek-V4-Flash',
  displayName: 'DeepSeek V4 Flash',
  provider: 'NEAR AI Cloud',
  modelUrl: 'https://cloud.near.ai/models/deepseek-ai/DeepSeek-V4-Flash',
  badges: ['TEE attested', 'GPU confidential compute', 'Hardware-signed proof'],
  timeoutMs: Number(process.env.NEAR_AI_TIMEOUT_MS || 90000)
}

global.telegram = {
  token: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || ''
}

// mode: 'tee' | 'non-tee' — set via setMode()
global.mode =
  process.env.CYBERSOCKS_MODE === 'tee' || process.env.CCH_MODE === 'tee'
    ? 'tee'
    : 'non-tee'
global.audit = null
global.briefing = ''

global.setMode = function setMode(mode) {
  if (mode !== 'tee' && mode !== 'non-tee') {
    throw new Error(`Invalid mode "${mode}". Use tee or non-tee.`)
  }
  global.mode = mode
}

global.activeBackend = function activeBackend() {
  return global.mode === 'tee' ? global.nearai : global.opencode
}
