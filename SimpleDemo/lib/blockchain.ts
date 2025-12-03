/**
 * SimpleDemo - 区块链操作执行逻辑
 * 仅支持 ZETA Transfer 和 ZetaChain 跨链到 BSC
 */

import { Intent, Chain } from '../types/intent'
import { ethers } from 'ethers'
import { switchToChain } from './chains'
import { zetaChainCrossChainTransfer } from './zetachain'

/**
 * 执行链上操作
 */
export async function executeIntent(
  intent: Intent,
  provider: ethers.BrowserProvider,
  signer: ethers.JsonRpcSigner
): Promise<string> {
  console.log('执行意图:', intent)

  // 跨链转账：ZetaChain -> BSC
  if (intent.action === 'cross_chain_transfer' && 
      intent.fromChain === 'zetachain' && 
      intent.toChain === 'bsc') {
    return await zetaChainCrossChainTransfer(intent, provider, signer)
  }

  // 链内转账：ZetaChain 上的 ZETA 转账
  if (intent.action === 'transfer' && intent.fromChain === 'zetachain') {
    return await handleZetaTransfer(intent, provider, signer)
  }

  throw new Error(`不支持的操作: ${intent.action}`)
}

/**
 * 处理 ZetaChain 上的 ZETA 转账
 */
async function handleZetaTransfer(
  intent: Intent,
  provider: ethers.BrowserProvider,
  signer: ethers.JsonRpcSigner
): Promise<string> {
  console.log('处理 ZETA 转账:', intent)

  if (!intent.amount) {
    throw new Error('缺少转账金额')
  }

  // 确保连接到 ZetaChain
  await switchToChain('zetachain')
  
  // 重新获取 signer（切换网络后）
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask 未安装')
  }
  const newProvider = new ethers.BrowserProvider(window.ethereum)
  const newSigner = await newProvider.getSigner()

  // 获取用户地址和接收地址
  const userAddress = await newSigner.getAddress()
  const recipientAddress = intent.recipient || userAddress

  // 验证接收地址格式
  if (!ethers.isAddress(recipientAddress)) {
    throw new Error(`接收地址格式不正确: ${recipientAddress}`)
  }

  // 转换金额
  const amount = ethers.parseEther(intent.amount)

  // 检查余额
  const balance = await newProvider.getBalance(userAddress)
  const gasEstimate = BigInt(21000) // 原生代币转账的 gas limit
  const gasPrice = (await newProvider.getFeeData()).gasPrice || BigInt(10000100000)
  const gasFee = gasEstimate * gasPrice
  const requiredAmount = amount + gasFee

  if (balance < requiredAmount) {
    throw new Error(
      `余额不足。需要: ${ethers.formatEther(requiredAmount)} ZETA，当前: ${ethers.formatEther(balance)} ZETA`
    )
  }

  // 执行转账
  const tx = await newSigner.sendTransaction({
    to: recipientAddress,
    value: amount,
  })

  console.log('ZETA 转账交易已发送:', tx.hash)

  // 等待交易确认
  let receipt: ethers.TransactionReceipt | null = null
  let retries = 5
  let delay = 2000

  while (retries > 0 && !receipt) {
    try {
      receipt = await tx.wait()
      break
    } catch (error: any) {
      if (error.code === -32005 || error.message?.includes('rate limit')) {
        console.warn(`RPC 速率限制，等待 ${delay/1000} 秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2
        retries--
        if (retries === 0) {
          return tx.hash
        }
        continue
      }
      throw error
    }
  }

  if (receipt && receipt.status === 0) {
    throw new Error('交易执行失败')
  }

  return receipt?.hash || tx.hash
}

