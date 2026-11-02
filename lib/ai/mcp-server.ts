import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { z } from 'zod'
import { draftInput, driversInput, executeTool, onchainInput, priceInput, TOOL_DEFINITIONS, type ToolName, type ToolOptions } from './tools'

const INPUT_SHAPES: Record<ToolName, z.ZodRawShape> = {
  get_price: priceInput.shape,
  get_onchain_stats: onchainInput.shape,
  analyze_drivers: driversInput.shape,
  draft_strategy: draftInput.shape,
}

export function createMcpServer(options: ToolOptions = {}) {
  const server = new McpServer({ name: 'infent-research-tools', version: '1.0.0' })
  for (const definition of TOOL_DEFINITIONS) {
    const { name, description } = definition.function
    server.registerTool(name, {
      description,
      inputSchema: INPUT_SHAPES[name],
      // 四个工具都只读：draft_strategy 只做校验和回测，不下单
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (args: Record<string, unknown>, extra: { signal: AbortSignal }) => {
      const result = await executeTool(name, args, { ...options, signal: extra.signal })
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }], isError: !result.ok }
    })
  }
  return server
}
