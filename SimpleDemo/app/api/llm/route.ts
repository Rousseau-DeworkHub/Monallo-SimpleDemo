/**
 * SimpleDemo - 精简的 LLM API 路由
 * 使用 Qwen3 进行意图识别
 * 注意：敏感数据（API Key）从环境变量读取，不暴露给客户端
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { Intent } from '../../../types/intent'

export async function POST(request: NextRequest) {
  try {
    const { userInput, currentChain } = await request.json()

    if (!userInput) {
      return NextResponse.json(
        { error: '用户输入不能为空' },
        { status: 400 }
      )
    }

    // 从环境变量读取 API Key（服务器端，不暴露给客户端）
    const apiKey = process.env.QWEN_API_KEY
    const model = process.env.QWEN_MODEL || 'qwen-max'
    
    if (!apiKey) {
      console.error('❌ Qwen API Key 未配置')
      return NextResponse.json(
        { error: '未配置 LLM API Key。请检查 SimpleDemo/.env 文件中的 QWEN_API_KEY' },
        { status: 500 }
      )
    }

    // 精简的系统提示词（仅支持 ZETA Transfer 和跨链到 BSC）
    const systemPrompt = `你是一个专业的区块链意图解析助手。你的任务是将用户的自然语言请求转换为结构化的 JSON 格式。

支持的意图类型：
1. transfer: ZetaChain 链内转账（在 ZetaChain 上发送 ZETA）
2. cross_chain_transfer: 跨链转账（从 ZetaChain 跨链到 BSC）

支持的链：
- zetachain (ZetaChain、Zeta)
- bsc (BSC、币安智能链、Binance Smart Chain)

重要规则：
1. 如果用户在 ZetaChain 上发送 ZETA 到另一个地址，使用 action: "transfer"，fromChain 和 toChain 都是 "zetachain"
2. 如果用户说"跨链到 BSC"、"发送到 BSC"、"从 ZetaChain 转到 BSC"，使用 action: "cross_chain_transfer"，fromChain: "zetachain"，toChain: "bsc"
3. 仅支持 ZETA 代币，不支持其他代币
4. 如果用户提到其他代币或链，返回错误提示

请分析用户的意图，并返回以下格式的 JSON：
{
  "action": "意图类型",
  "fromChain": "源链（如需要）",
  "toChain": "目标链（如需要）",
  "fromToken": "ZETA",
  "toToken": "ZETA",
  "amount": "数量（如需要）",
  "recipient": "接收地址（如需要）"
}

只返回 JSON，不要包含其他文本。`

    const userPrompt = `用户请求：${userInput}
${currentChain ? `\n当前连接的网络：${currentChain}` : ''}

请仔细分析：
- 如果是 ZetaChain 链内转账，使用 action: "transfer"，fromChain 和 toChain 都是 "zetachain"
- 如果是跨链到 BSC，使用 action: "cross_chain_transfer"，fromChain: "zetachain"，toChain: "bsc"
- 仅支持 ZETA 代币

请分析并返回结构化的意图 JSON。`

    // 调用 Qwen API
    const baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    
    const response = await axios.post(
      baseURL,
      {
        model: model,
        input: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        parameters: {
          temperature: 0.3,
          result_format: 'message',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    if (!response.data?.output?.choices?.[0]?.message?.content) {
      throw new Error('Qwen API 返回格式异常')
    }

    const content = response.data.output.choices[0].message.content
    
    // 解析 JSON
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                     content.match(/(\{[\s\S]*\})/)
    
    let intent: Intent
    if (jsonMatch) {
      intent = JSON.parse(jsonMatch[1])
    } else {
      intent = JSON.parse(content)
    }

    // 验证意图（仅支持 ZETA 和指定链）
    if (intent.fromToken && intent.fromToken !== 'ZETA') {
      return NextResponse.json(
        { error: '仅支持 ZETA 代币，不支持其他代币' },
        { status: 400 }
      )
    }

    if (intent.fromChain && intent.fromChain !== 'zetachain') {
      return NextResponse.json(
        { error: '仅支持从 ZetaChain 发起操作' },
        { status: 400 }
      )
    }

    if (intent.toChain && intent.toChain !== 'zetachain' && intent.toChain !== 'bsc') {
      return NextResponse.json(
        { error: '仅支持 ZetaChain 和 BSC 链' },
        { status: 400 }
      )
    }

    return NextResponse.json({ intent })
  } catch (error: any) {
    console.error('LLM API 路由错误:', error)
    
    if (error.response) {
      const status = error.response.status
      const errorData = error.response.data
      
      if (status === 401) {
        return NextResponse.json(
          { error: 'API Key 无效或已过期。请检查 SimpleDemo/.env 文件中的 QWEN_API_KEY' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `LLM API 错误 (${status}): ${errorData?.message || JSON.stringify(errorData)}` },
        { status: status }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'LLM API 调用失败' },
      { status: 500 }
    )
  }
}

