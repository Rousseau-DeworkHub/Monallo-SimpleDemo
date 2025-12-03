import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SimpleDemo - 区块链意图识别与执行',
  description: '使用 Qwen3 Agent 识别用户意图并执行链上操作',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

