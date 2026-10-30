// Fail closed on registry errors or known vulnerabilities in the Next.js runtime stack.
// Other project dependencies remain visible in the summary, but are a separate upgrade scope.
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npm, ['audit', '--json'], {
  encoding: 'utf8', shell: process.platform === 'win32', timeout: 120000,
  maxBuffer: 8 * 1024 * 1024,
})
if (result.error) throw result.error
let audit
try { audit = JSON.parse(result.stdout) } catch { throw new Error('npm audit returned no valid report') }
if (audit.error || !audit.metadata || !audit.vulnerabilities || ![0, 1].includes(result.status)) {
  throw new Error('npm audit failed; security verification is incomplete')
}
const nextRoot = path.dirname(require.resolve('next/package.json'))
const version = name => require(require.resolve(`${name}/package.json`, { paths: [nextRoot] })).version
const findings = Object.entries(audit.vulnerabilities)
  .filter(([name]) => ['next', 'react', 'react-dom', 'sharp', 'postcss'].includes(name) || name.startsWith('@next/') || name.startsWith('@img/') || name.startsWith('react-server-dom-'))
  .map(([name, item]) => ({ name, severity: item.severity, via: item.via.map(v => typeof v === 'string' ? v : v.url) }))
console.log(JSON.stringify({
  checkedAt: new Date().toISOString(), next: version('next'), react: version('react'), reactDom: version('react-dom'), sharp: require(require.resolve('sharp', { paths: [nextRoot] })).versions.sharp,
  nextPostcss: version('postcss'), nextStackFindings: findings,
  overall: audit.metadata.vulnerabilities, passed: findings.length === 0,
}, null, 2))
if (findings.length) process.exitCode = 1
