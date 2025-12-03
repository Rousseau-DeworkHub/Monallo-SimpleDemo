/**
 * SimpleDemo - 精简的链配置
 * 仅支持 ZetaChain 和 BSC
 */

import { Chain } from '../types/intent'

export interface ChainConfig {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
}

export const CHAIN_CONFIGS: Record<Chain, ChainConfig> = {
  zetachain: {
    chainId: '0x1b58', // 7000 in hex
    chainName: 'ZetaChain Mainnet',
    nativeCurrency: {
      name: 'ZETA',
      symbol: 'ZETA',
      decimals: 18,
    },
    rpcUrls: ['https://zetachain-evm.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://zetascan.com'],
  },
  bsc: {
    chainId: '0x38', // 56 in hex
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
}

/**
 * 切换到指定链
 */
export async function switchToChain(chain: Chain): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask 未安装')
  }

  const config = CHAIN_CONFIGS[chain]
  const chainId = config.chainId

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  } catch (error: any) {
    // 如果链不存在，添加链
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: config.chainId,
            chainName: config.chainName,
            nativeCurrency: config.nativeCurrency,
            rpcUrls: config.rpcUrls,
            blockExplorerUrls: config.blockExplorerUrls,
          },
        ],
      })
    } else {
      throw error
    }
  }
}

/**
 * 获取链的显示名称
 */
export function getChainDisplayName(chain: Chain): string {
  return CHAIN_CONFIGS[chain].chainName
}

