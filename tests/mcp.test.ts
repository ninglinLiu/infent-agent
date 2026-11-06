import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createMcpServer } from '../lib/ai/mcp-server'

test('real MCP client discovers all tools with their own schemas and reads a price through the shared executor', async () => {
  const server = createMcpServer({ fetcher: async () => new Response(JSON.stringify({ data: { base: 'BTC', amount: '100', currency: 'USD' } })) })
  const client = new Client({ name: 'infent-test', version: '1.0.0' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await server.connect(a)
  await client.connect(b)
  try {
    const list = await client.listTools()
    assert.deepEqual(list.tools.map(t => t.name).sort(), ['analyze_drivers', 'draft_strategy', 'get_market_overview', 'get_onchain_stats', 'get_price'])
    // 每个工具必须用自己的入参，不能共用同一个 schema
    const required = (name: string) => list.tools.find(t => t.name === name)!.inputSchema.required
    assert.deepEqual(required('get_onchain_stats'), ['address'])
    assert.deepEqual(required('analyze_drivers'), ['symbol'])
    assert.ok(required('draft_strategy')!.includes('legs') && !required('draft_strategy')!.includes('address'))
    const rejected = await client.callTool({ name: 'draft_strategy', arguments: { title: 'T', thesis: 'x', capital: 100, legs: [{ symbol: 'BTC', weight: 2 }], rebalance: 'none', stopLoss: 0, benchmark: 'SPY', riskLevel: 3, horizon: '1Y' } })
    assert.equal(rejected.isError, true, 'crypto and bad weights are rejected before any data is fetched')
    const result = await client.callTool({ name: 'get_price', arguments: { symbol: 'BTC' } })
    assert.equal(result.isError, false)
    const content = result.content as Array<{ type: string; text: string }>
    assert.equal(JSON.parse(content[0].text).data.price, 100)
  } finally { await client.close(); await server.close() }
})

test('stdio entrypoint starts outside the repo and supports MCP initialize/list', async () => {
  const client = new Client({ name: 'stdio-test', version: '1.0.0' })
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.resolve('node_modules/tsx/dist/cli.mjs'), '--tsconfig', path.resolve('tsconfig.json'), path.resolve('scripts/mcp-server.ts')], cwd: path.parse(process.cwd()).root, stderr: 'pipe' })
  try {
    await client.connect(transport)
    assert.equal((await client.listTools()).tools.length, 5)
  } finally { await client.close(); await transport.close() }
})
