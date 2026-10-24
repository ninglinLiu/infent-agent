// Local-only runner. No deploy command, service key, or production configuration changes.
const { readFileSync } = require('node:fs')
const { spawn } = require('node:child_process')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const config = JSON.parse(readFileSync(path.join(root, '.env.staging.public.local'), 'utf8'))
const project = 'sscjolfuydqmskqzfppn'
if (config.projectId !== project || config.url !== `https://${project}.supabase.co` || !config.publishableKey.startsWith('sb_publishable_')) throw Error('Explicit isolated staging configuration required')
const env = { ...process.env,
  INFENT_STAGING: '1',
  NEXT_PUBLIC_SUPABASE_URL: config.url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  LEARNING_TEST_URL: config.url,
  LEARNING_TEST_PUBLISHABLE_KEY: config.publishableKey,
  LEARNING_TEST_CONFIRM: 'isolated-test-database',
  LEARNING_TEST_ALLOWED_HOST: `${project}.supabase.co`,
  LEARNING_TEST_EMAIL_DOMAIN: 'example.com',
  E2E_SUPABASE_PROJECT_REF: project,
  LLM_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', EMBEDDING_API_KEY: '',
}
const mode = process.argv[2]
const commands = {
  prepare: ['--require', './tests/network-proxy.cjs', '--import', 'tsx', 'scripts/prepare-learning-demo.ts'],
  verify: ['--require', './tests/network-proxy.cjs', '--import', 'tsx', 'scripts/prepare-learning-demo.ts', '--verify'],
  build: ['node_modules/next/dist/bin/next', 'build'],
  start: ['--require', './tests/network-proxy.cjs', 'node_modules/next/dist/bin/next', 'start', '-p', '3107'],
  test: ['node_modules/@playwright/test/cli.js', 'test', 'tests/browser/learning-live.spec.ts', '--project=desktop', '--trace=off'],
  pages: ['node_modules/@playwright/test/cli.js', 'test', 'tests/browser/entry.spec.ts', 'tests/browser/appearance.spec.ts', 'tests/browser/app.spec.ts', 'tests/browser/immersive.spec.ts', 'tests/browser/learning.spec.ts', '--project=desktop', '--trace=off'],
}
if (!commands[mode]) throw Error('Usage: node scripts/learning-staging.cjs prepare|verify|build|start|test|pages')
console.log(`Isolated staging ${mode}: ${project}; paid model credentials disabled.`)
const child = spawn(process.execPath, commands[mode], { cwd: root, env, stdio: 'inherit' })
child.on('exit', code => { process.exitCode = code ?? 1 })
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
