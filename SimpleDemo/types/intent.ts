/**
 * SimpleDemo - 精简的意图类型定义
 * 仅支持 ZETA Transfer 和 ZetaChain 跨链到 BSC
 */

export type Chain = 'zetachain' | 'bsc'

export type ActionType = 
  | 'transfer'              // 链内转账（ZetaChain 上的 ZETA 转账）
  | 'cross_chain_transfer' // 跨链转账（ZetaChain -> BSC）

export interface Intent {
  action: ActionType
  fromChain?: Chain
  toChain?: Chain
  fromToken?: string        // 仅支持 'ZETA'
  toToken?: string          // 仅支持 'ZETA'
  amount?: string
  recipient?: string
  additionalParams?: Record<string, unknown>
}

export interface LLMResponse {
  intent: Intent
  confidence: number
  reasoning?: string
}

