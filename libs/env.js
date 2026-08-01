import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export function loadEnv(root = process.cwd()) {
  for (const name of ['.env', '.env.local']) {
    const path = join(root, name)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      // common .env typos: trailing commas
      val = val.replace(/,+$/, '').trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
}
