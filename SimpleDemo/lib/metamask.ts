/**
 * SimpleDemo - MetaMask Provider 工具函数
 */

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}

/**
 * 获取 MetaMask provider
 */
export function getMetaMaskProvider() {
  if (typeof window === 'undefined') return null
  if (!window.ethereum) return null
  if (window.ethereum.isMetaMask === true) return window.ethereum
  return null
}

/**
 * 检查 MetaMask 是否已安装
 */
export function isMetaMaskInstalled(): boolean {
  return getMetaMaskProvider() !== null
}

