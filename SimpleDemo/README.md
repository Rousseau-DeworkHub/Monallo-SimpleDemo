# SimpleDemo - 区块链意图识别与执行示例

这是一个精简的区块链意图识别与执行示例，演示如何使用 Qwen3 Agent 识别用户意图并执行链上操作。

## 功能特性

- ✅ **意图识别**：使用 Qwen3 解析用户自然语言请求
- ✅ **ZETA 转账**：支持在 ZetaChain 上转账 ZETA 代币
- ✅ **跨链转账**：支持从 ZetaChain 跨链转账 ZETA 到 BSC
- ✅ **MetaMask 集成**：自动连接和管理 MetaMask 钱包，强制使用 ZetaChain Mainnet
- ✅ **钱包状态显示**：显示连接状态、用户地址和当前网络
- ✅ **意图确认**：执行前显示操作详情供用户确认

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 库**：React + Tailwind CSS
- **区块链交互**：ethers.js v6
- **LLM**：Qwen3 (通义千问)
- **钱包**：MetaMask

## 快速开始

### 1. 安装依赖

```bash
cd SimpleDemo
npm install
# 或
yarn install
```

### 2. 配置环境变量

复制 `env.example` 为 `.env` 并填入您的 Qwen API Key：

```bash
cp env.example .env
```

编辑 `.env` 文件：

```env
QWEN_API_KEY=sk-your-qwen-api-key-here
QWEN_MODEL=qwen-max
NEXT_PUBLIC_ZETACHAIN_GATEWAY=0xF0a3F93Ed1B126142E61423F9546bf1323Ff82DF
```

**重要**：
- `QWEN_API_KEY`：必须配置，从阿里云 DashScope 获取（服务器端，不暴露给客户端）
- `NEXT_PUBLIC_ZETACHAIN_GATEWAY`：ZetaHub 使用的 Gateway 合约地址，必须配置，否则跨链交易会失败（客户端可访问，使用 `NEXT_PUBLIC_` 前缀）

**获取 Qwen API Key**：
1. 访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/)
2. 开通通义千问服务
3. 创建 API Key
4. 将 API Key 填入 `.env` 文件

### 3. 运行开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 使用示例

### 链内转账

```
转 0.1 ZETA 到 0x1234567890123456789012345678901234567890
```

### 跨链转账

```
从 ZetaChain 跨链 0.5 ZETA 到 BSC
```

## 项目结构

```
SimpleDemo/
├── app/
│   └── api/
│       └── llm/
│           └── route.ts          # LLM API 路由（服务器端）
├── components/
│   ├── SimpleChat.tsx             # 对话前端组件
│   └── IntentConfirmation.tsx     # 意图确认组件
├── hooks/
│   └── useWeb3.ts                 # Web3 Hook（MetaMask 连接）
├── lib/
│   ├── blockchain.ts              # 区块链操作执行逻辑
│   ├── chains.ts                   # 链配置
│   ├── llm.ts                      # LLM 意图解析
│   ├── metamask.ts                 # MetaMask 工具函数
│   └── zetachain.ts                # ZetaChain 跨链操作
├── types/
│   └── intent.ts                   # 意图类型定义
├── .env.example                    # 环境变量示例
└── README.md                       # 本文档
```

## 安全说明

⚠️ **重要**：此示例仅用于教学演示，生产环境使用请注意：

1. **API Key 保护**：`.env` 文件已添加到 `.gitignore`，不要提交到版本控制
2. **服务器端调用**：LLM API 调用在服务器端进行，API Key 不会暴露给客户端
3. **输入验证**：所有用户输入都经过验证，仅支持 ZETA 代币和指定链

## 扩展练习

### 1. 添加数据持久化

- 使用 MongoDB 或 PostgreSQL 存储消息历史
- 实现用户会话管理

### 2. 添加交易状态轮询

- 轮询跨链交易的第二步状态（目标链铸造）
- 显示实时交易进度

### 3. 支持更多代币

- 扩展意图识别支持 ERC-20 代币
- 实现代币余额查询

### 4. 支持更多链

- 添加 Ethereum、Polygon 等链的支持
- 实现多链资产管理

## 常见问题

### Q: 如何获取 Qwen API Key？

A: 访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/)，开通通义千问服务后创建 API Key。

### Q: 支持哪些操作？

A: 目前仅支持：
- ZetaChain 链内 ZETA 转账
- ZetaChain 跨链 ZETA 到 BSC

### Q: 如何添加其他链的支持？

A: 修改 `lib/chains.ts` 添加链配置，修改 `lib/blockchain.ts` 添加执行逻辑。

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发者。

