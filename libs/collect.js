import { execFile } from 'node:child_process'
import { readFileSync, accessSync, constants, readdirSync, statSync } from 'node:fs'
import { hostname, platform, release, arch, version as kernelVersion, homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

async function run(cmd, args = [], timeout = 8000) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      encoding: 'utf8'
    })
    return { code: 0, out: (stdout || '').trim(), err: (stderr || '').trim() }
  } catch (e) {
    return {
      code: e.code ?? 127,
      out: (e.stdout || '').trim(),
      err: (e.stderr || e.message || '').trim()
    }
  }
}

async function listeningPorts() {
  let { code, out } = await run('ss', ['-tulpn'])
  const useSs = code === 0 && Boolean(out)
  if (!useSs) ({ code, out } = await run('netstat', ['-tulpn']))
  if (!out) return []
  const ports = []
  for (const line of out.split('\n').slice(1)) {
    const parts = line.split(/\s+/)
    if (parts.length < 5) continue
    let proto, local, process
    if (useSs && ['tcp', 'udp', 'tcp6', 'udp6', 'u_str', 'u_dgr'].includes(parts[0])) {
      proto = parts[0]
      local = parts[4]
      process = parts.slice(6).join(' ')
    } else {
      proto = parts[0]
      local = parts[3]
      process = parts.slice(6).join(' ')
    }
    if (!local) continue
    ports.push({ proto, local, process: process.slice(0, 120) })
  }
  return ports.slice(0, 80)
}

async function recentLogins() {
  const { code, out } = await run('last', ['-n', '15', '-w'])
  return code === 0 ? out : ''
}

async function failedAuths() {
  for (const path of ['/var/log/auth.log', '/var/log/secure']) {
    try {
      accessSync(path, constants.R_OK)
      const lines = readFileSync(path, 'utf8').split('\n')
      const hits = lines.slice(-400).filter(ln =>
        /failed|invalid|authentication failure|refused/i.test(ln)
      )
      return hits.slice(-40).join('\n')
    } catch {
      /* next */
    }
  }
  const { code, out } = await run('journalctl', ['-u', 'ssh', '-n', '40', '--no-pager'])
  if (code !== 0 || !out) return ''
  return out
    .split('\n')
    .filter(ln => /failed|invalid|error/i.test(ln))
    .slice(-40)
    .join('\n')
}

async function diskUsage() {
  const { code, out } = await run('df', ['-hP'])
  if (code !== 0) return []
  return out
    .split('\n')
    .slice(1)
    .map(line => {
      const parts = line.split(/\s+/)
      if (parts.length < 6) return null
      return {
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        avail: parts[3],
        usePct: parts[4],
        mount: parts[5]
      }
    })
    .filter(Boolean)
}

function memory() {
  try {
    const mem = {}
    for (const line of readFileSync('/proc/meminfo', 'utf8').split('\n')) {
      const i = line.indexOf(':')
      if (i === -1) continue
      const k = line.slice(0, i)
      if (['MemTotal', 'MemAvailable', 'SwapTotal', 'SwapFree'].includes(k)) {
        mem[k] = line.slice(i + 1).trim()
      }
    }
    return mem
  } catch {
    return {}
  }
}

async function loggedInUsers() {
  const { code, out } = await run('who')
  return code === 0 && out ? out.split('\n') : []
}

async function firewall() {
  const candidates = [
    ['ufw', ['status', 'verbose']],
    ['firewall-cmd', ['--state']],
    ['nft', ['list', 'ruleset']],
    ['iptables', ['-L', '-n']]
  ]
  for (const [cmd, args] of candidates) {
    const { code, out, err } = await run(cmd, args, 6000)
    if (code === 0 && (out || err)) {
      const text = out || err
      return `$ ${cmd} ${args.join(' ')}\n${text.slice(0, 2000)}`
    }
  }
  return 'no firewall tooling readable'
}

async function processSample() {
  const { code, out } = await run('ps', ['aux', '--sort=-%cpu'])
  if (code !== 0 || !out) return []
  const lines = out.split('\n')
  const header = lines[0]
  const body = lines.slice(1, 40)
  const keywords = [
    'mimikatz',
    'meterpreter',
    'xmrig',
    'minerd',
    'cryptonight',
    'base64 -d',
    'curl | sh',
    'wget | sh',
    'curl|sh',
    'wget|sh'
  ]
  const interesting = body.filter(ln =>
    keywords.some(k => ln.toLowerCase().includes(k))
  )
  return interesting.length ? [header, ...interesting] : [header, ...body.slice(0, 8)]
}

async function pendingUpdates() {
  const apt = await run('apt-get', ['-s', 'upgrade'], 15000)
  if (apt.code === 0) {
    const upgraded = apt.out.split('\n').filter(ln => ln.startsWith('Inst '))
    return `apt simulated upgrades: ${upgraded.length}\n${upgraded.slice(0, 25).join('\n')}`
  }
  const dnf = await run('dnf', ['check-update'], 20000)
  if (dnf.out) return dnf.out.slice(0, 1500)
  return 'package manager check skipped'
}

function sshPermIssues() {
  const hits = []
  const ssh = join(homedir(), '.ssh')
  try {
    const m = (statSync(ssh).mode & 0o777).toString(8)
    if (!['700', '600'].includes(m)) hits.push(`${ssh} mode=${m} (expected 700)`)
  } catch {
    /* missing */
  }
  try {
    for (const name of readdirSync(ssh)) {
      if (!name.startsWith('id_') || name.endsWith('.pub')) continue
      const f = join(ssh, name)
      const m = (statSync(f).mode & 0o777).toString(8)
      if (!['600', '400'].includes(m)) hits.push(`${f} mode=${m} (expected 600)`)
    }
  } catch {
    /* missing */
  }
  return hits
}

function pushFinding(findings, check, severity, title, detail, evidence = '') {
  findings.push({ check, severity, title, detail, evidence })
}

function buildFindings({ ports, disk, failed, fw, sshPerms, updates, procs }) {
  const findings = []

  const risky = ports.filter(p => {
    const local = p.local || ''
    const bad = [':23', ':445', ':3389', ':6379', ':27017', ':9200', ':11211', ':5432', ':3306']
    if (!bad.some(b => local.endsWith(b) || local.includes(b))) return false
    return local.startsWith('0.0.0.0') || local.startsWith('*') || local.startsWith('[::]')
  })

  if (risky.length) {
    pushFinding(
      findings,
      'listeningServices',
      'high',
      'Sensitive services exposed on all interfaces',
      `${risky.length} potentially sensitive listeners bound publicly`,
      JSON.stringify(risky.slice(0, 8))
    )
  } else if (ports.length) {
    const pub = ports.filter(
      p =>
        (p.local || '').startsWith('0.0.0.0:') ||
        (p.local || '').startsWith('*:') ||
        (p.local || '').includes('[::]:')
    )
    pushFinding(
      findings,
      'listeningServices',
      pub.length < 8 ? 'info' : 'low',
      `${ports.length} listening sockets (${pub.length} public)`,
      'Review unexpected public listeners',
      JSON.stringify(pub.slice(0, 12))
    )
  }

  for (const row of disk) {
    const n = Number.parseInt(String(row.usePct).replace('%', ''), 10)
    if (!Number.isFinite(n)) continue
    let sev
    if (n >= 95) sev = 'critical'
    else if (n >= 90) sev = 'high'
    else if (n >= 80) sev = 'medium'
    else continue
    pushFinding(
      findings,
      'disk',
      sev,
      `Disk ${row.mount} at ${row.usePct}`,
      `${row.filesystem}: ${row.used}/${row.size} used`
    )
  }

  if (failed) {
    const count = failed.split('\n').filter(Boolean).length
    pushFinding(
      findings,
      'authFailures',
      count >= 5 ? 'medium' : 'low',
      `${count} recent auth failure lines`,
      'Possible brute-force or misconfigured clients',
      failed.slice(0, 800)
    )
  } else {
    pushFinding(
      findings,
      'authFailures',
      'info',
      'No readable auth failure sample',
      'auth.log/secure/journal not available or empty'
    )
  }

  if (/inactive|not running/i.test(fw)) {
    pushFinding(findings, 'firewall', 'medium', 'Firewall appears inactive', fw.slice(0, 300))
  } else if (fw.startsWith('no firewall')) {
    pushFinding(findings, 'firewall', 'low', 'Could not inspect firewall', fw)
  } else {
    pushFinding(findings, 'firewall', 'info', 'Firewall state captured', fw.split('\n')[0].slice(0, 200))
  }

  for (const issue of sshPerms) {
    pushFinding(findings, 'sshPermissions', 'high', 'SSH key/dir permission issue', issue)
  }

  if (updates.includes('apt simulated upgrades:')) {
    const n = Number.parseInt(updates.split(':')[1], 10) || 0
    if (n > 0) {
      pushFinding(
        findings,
        'updates',
        n < 20 ? 'low' : 'medium',
        `${n} packages would upgrade (apt simulation)`,
        'Unpatched packages increase exposure',
        updates.split('\n').slice(1, 12).join('\n')
      )
    }
  }

  const suspicious = procs
    .slice(1)
    .filter(ln => /xmrig|minerd|meterpreter|mimikatz|cryptonight|curl\s*\|\s*sh|wget\s*\|\s*sh/i.test(ln))
  if (suspicious.length) {
    pushFinding(
      findings,
      'processes',
      'critical',
      'Suspicious process pattern matched',
      'Keyword hit in process list',
      suspicious.slice(0, 8).join('\n')
    )
  }

  if (!findings.length) {
    pushFinding(
      findings,
      'baseline',
      'info',
      'Baseline collection complete',
      'No heuristic alerts fired'
    )
  }

  return findings
}

export function summaryForPrompt(bundle, maxChars = 12000) {
  const lines = [
    `Host: ${bundle.hostname}`,
    `Collected: ${bundle.collectedAt}`,
    `OS: ${bundle.os}`,
    `Kernel: ${bundle.kernel}`,
    '',
    '## Findings'
  ]
  for (const f of bundle.findings) {
    lines.push(`- [${f.severity.toUpperCase()}] ${f.check}: ${f.title}`)
    lines.push(`  ${f.detail}`)
    if (f.evidence) lines.push(`  evidence: ${f.evidence.slice(0, 400)}`)
  }
  lines.push('', '## Raw snapshots (truncated)')
  let payload = `${lines.join('\n')}\n${JSON.stringify(bundle.raw, null, 2)}`
  if (payload.length > maxChars) payload = `${payload.slice(0, maxChars - 20)}\n...[truncated]`
  return payload
}

/** Collect host security signals. Returns data only — no display. */
export async function collect() {
  const [
    ports,
    disk,
    logins,
    failed,
    users,
    fw,
    procs,
    updates
  ] = await Promise.all([
    listeningPorts(),
    diskUsage(),
    recentLogins(),
    failedAuths(),
    loggedInUsers(),
    firewall(),
    processSample(),
    pendingUpdates()
  ])
  const mem = memory()
  const sshPerms = sshPermIssues()

  const raw = {
    listeningPorts: ports,
    disk,
    memory: mem,
    recentLogins: logins ? logins.split('\n').slice(0, 20) : [],
    failedAuthSample: failed ? failed.split('\n').slice(0, 40) : [],
    loggedInUsers: users,
    firewall: fw,
    processesSample: procs,
    updates: updates ? updates.split('\n').slice(0, 30) : [],
    sshPermIssues: sshPerms
  }

  const findings = buildFindings({ ports, disk, failed, fw, sshPerms, updates, procs })

  return {
    hostname: hostname(),
    collectedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    os: `${platform()} ${release()} (${arch()})`,
    kernel: kernelVersion(),
    findings,
    raw
  }
}
