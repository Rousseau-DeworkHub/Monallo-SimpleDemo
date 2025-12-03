/**
 * SimpleDemo - Web3 Hook
 * 精简版 MetaMask 连接管理
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { getMetaMaskProvider } from '../lib/metamask'

export function useWeb3() {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const metaMaskProvider = getMetaMaskProvider()
    if (!metaMaskProvider) return

    // 检查是否已连接
    const checkConnection = async () => {
      try {
        const accounts = await metaMaskProvider.request({
          method: 'eth_accounts',
        }) as string[]
        
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
          setProvider(new ethers.BrowserProvider(metaMaskProvider))
        }
      } catch (error) {
        console.error('检查连接失败:', error)
      }
    }

    checkConnection()

    // 监听账户变化
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null)
        setIsConnected(false)
        setProvider(null)
      } else {
        setAccount(accounts[0])
        setIsConnected(true)
        setProvider(new ethers.BrowserProvider(metaMaskProvider))
      }
    }

    // 监听链变化
    const handleChainChanged = () => {
      window.location.reload()
    }

    metaMaskProvider.on('accountsChanged', handleAccountsChanged)
    metaMaskProvider.on('chainChanged', handleChainChanged)

    return () => {
      metaMaskProvider.removeListener('accountsChanged', handleAccountsChanged)
      metaMaskProvider.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  const connect = useCallback(async () => {
    const metaMaskProvider = getMetaMaskProvider()
    
    if (!metaMaskProvider) {
      alert('请安装并启用 MetaMask 扩展')
      return
    }

    try {
      await metaMaskProvider.request({
        method: 'eth_requestAccounts',
      })
      
      const accounts = await metaMaskProvider.request({
        method: 'eth_accounts',
      }) as string[]
      
      if (accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
        setProvider(new ethers.BrowserProvider(metaMaskProvider))
      }
    } catch (error) {
      console.error('连接失败:', error)
      alert('连接 MetaMask 失败，请重试')
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setIsConnected(false)
    setProvider(null)
  }, [])

  return {
    account,
    isConnected,
    provider,
    connect,
    disconnect,
  }
}

