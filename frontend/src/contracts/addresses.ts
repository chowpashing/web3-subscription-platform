// 合约地址配置
export const USDT_CONTRACT_ADDRESS = '0x79C1433c99E6D3CBD8fcdD6957315b8Ed198aDcf';
export const BOT_REGISTRY_CONTRACT_ADDRESS = '0xff2760ac2b543afB53Eb8C11e1ee326484E76B5E';
export const BOT_SUBSCRIPTION_CONTRACT_ADDRESS = '0x0Eee6D0c0fb9B8D99e3551B6a7fE0A42Cfa537e1';
export const BOT_PAYMENT_CONTRACT_ADDRESS = '0x521b611EBf9e2f35c5cD82C344245eC6dDA731Fc';

// 网络配置
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia 测试网
  chainName: 'Sepolia Test Network',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/161ab53b248d4a039e6e6d31908a988b'], // 从后端配置获取的 Infura 项目 ID
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}; 