/**
 * SimpleDemo - ZetaChain 跨链操作
 * 仅支持 ZetaChain -> BSC 的 ZETA 跨链转账
 */

import { ethers } from 'ethers'
import { Intent, Chain } from '../types/intent'
import { switchToChain } from './chains'

/**
 * 获取 ZetaChain Gateway 合约地址
 * 从环境变量读取（客户端使用 NEXT_PUBLIC_ 前缀）
 */
function getZetaChainGateway(): string {
  // 客户端代码，使用 NEXT_PUBLIC_ 前缀的环境变量
  // Gateway 地址不是敏感信息，可以公开
  return process.env.NEXT_PUBLIC_ZETACHAIN_GATEWAY || '0xF0a3F93Ed1B126142E61423F9546bf1323Ff82DF'
}

/**
 * GatewayZEVM 合约 ABI
 */
const GATEWAY_ABI = [
  'function sendZeta(uint256 destinationChainId, bytes calldata destinationAddress, uint256 destinationGasLimit) external payable',
  'function availableChainIds(uint256) external view returns (bool)',
]

/**
 * BSC 链 ID
 */
const BSC_CHAIN_ID = 56

/**
 * 最小跨链金额（BSC 网络费用约 0.22 ZETA）
 */
const MIN_CROSS_CHAIN_AMOUNT = ethers.parseEther('0.23')

/**
 * 使用 ZetaChain 执行跨链转账（ZetaChain -> BSC）
 */
export async function zetaChainCrossChainTransfer(
  intent: Intent,
  provider: ethers.BrowserProvider,
  signer: ethers.JsonRpcSigner
): Promise<string> {
  console.log('🔍 ZetaChain 跨链转账:', intent)

  // 验证参数
  if (intent.fromChain !== 'zetachain' || intent.toChain !== 'bsc') {
    throw new Error('仅支持从 ZetaChain 跨链到 BSC')
  }

  if (!intent.amount) {
    throw new Error('缺少转账金额')
  }

  // 确保连接到 ZetaChain
  await switchToChain('zetachain')
  
  // 重新获取 provider 和 signer（切换网络后）
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

  // 检查最小金额
  if (amount < MIN_CROSS_CHAIN_AMOUNT) {
    throw new Error(
      `跨链金额太小，最小要求: 0.23 ZETA（BSC 网络费用约 0.22 ZETA）`
    )
  }

  // 检查余额
  const balance = await newProvider.getBalance(userAddress)
  const gasEstimate = BigInt(200000) // 预估 gas limit
  const gasPrice = (await newProvider.getFeeData()).gasPrice || BigInt(10000100000)
  const gasFee = gasEstimate * gasPrice
  const requiredAmount = amount + gasFee

  if (balance < requiredAmount) {
    throw new Error(
      `余额不足。需要: ${ethers.formatEther(requiredAmount)} ZETA，当前: ${ethers.formatEther(balance)} ZETA`
    )
  }

  // 获取 Gateway 合约地址
  const gatewayAddress = getZetaChainGateway()
  console.log('使用 ZetaChain Gateway 地址:', gatewayAddress)

  // 创建合约实例
  const gatewayContract = new ethers.Contract(
    gatewayAddress,
    GATEWAY_ABI,
    newSigner
  )

  // 检查目标链是否在白名单中
  const isChainAvailable = await gatewayContract.availableChainIds(BSC_CHAIN_ID)
  if (!isChainAvailable) {
    throw new Error('BSC 链未在 ZetaChain Gateway 白名单中')
  }

  // 编码接收地址为 bytes（20 字节）
  const addressBytes = ethers.getBytes(recipientAddress)
  const receiverBytes = ethers.hexlify(addressBytes).toLowerCase()

  // 调用 sendZeta
  const destinationGasLimit = 90000 // 目标链 gas limit
  const txGasLimit = 200000

  console.log('调用 sendZeta，参数:', {
    destinationChainId: BSC_CHAIN_ID,
    destinationAddress: receiverBytes,
    destinationGasLimit,
    amount: intent.amount,
  })

  const tx = await gatewayContract.sendZeta(
    BSC_CHAIN_ID,
    receiverBytes,
    destinationGasLimit,
    {
      value: amount,
      gasLimit: txGasLimit,
    }
  )

  console.log('✅ 跨链转账交易已发送:', tx.hash)

  // 等待交易确认
  let receipt: ethers.TransactionReceipt | null = null
  let retries = 5
  let delay = 3000

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

