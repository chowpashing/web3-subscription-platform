# Bot Access SDK

一个用于验证机器人访问权限的SDK。

## 安装

```bash
npm install @your-org/bot-access-sdk
```

## 快速开始

```typescript
import { BotAccessSDK } from '@your-org/bot-access-sdk';

const sdk = new BotAccessSDK({
  contractAddress: '0x...',
  apiEndpoint: 'https://api.your-domain.com'
});

// 验证访问权限
const result = await sdk.verifyAccess('bot-id');
if (result.hasAccess) {
  // 允许访问
} else {
  // 处理无权限情况
}
```

## 功能特性

- 订阅状态验证
- 试用期管理
- 链上验证
- 本地缓存
- TypeScript 支持

## API 文档

### BotAccessSDK

主要的SDK类，用于验证访问权限。

#### 配置选项

```typescript
interface SDKConfig {
  contractAddress: string;    // 智能合约地址
  apiEndpoint: string;        // API端点
  cacheTimeout?: number;      // 缓存超时时间（可选）
}
```

#### 方法

- `verifyAccess(botId: string): Promise<AccessResult>`
- `getSubscriptionStatus(botId: string): Promise<SubscriptionStatus>`

## 示例

查看 `examples` 目录获取更多使用示例。

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建
npm run build
```

## 许可证

MIT
