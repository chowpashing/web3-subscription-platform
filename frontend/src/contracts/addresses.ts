// 合约地址配置
export const USDT_CONTRACT_ADDRESS = '0x79C1433c99E6D3CBD8fcdD6957315b8Ed198aDcf';
export const BOT_REGISTRY_CONTRACT_ADDRESS = '0xff2760ac2b543afB53Eb8C11e1ee326484E76B5E';
export const BOT_SUBSCRIPTION_CONTRACT_ADDRESS = '0x0Eee6D0c0fb9B8D99e3551B6a7fE0A42Cfa537e1';
export const BOT_PAYMENT_CONTRACT_ADDRESS = '0x521b611EBf9e2f35c5cD82C344245eC6dDA731Fc';

// 新部署的合约地址 (OP Sepolia)
export const NEW_USDT_CONTRACT_ADDRESS = '0x3cdD5BE5b0c62F4B43DBf76F71aDb1b764cf2268';
export const NEW_BOT_REGISTRY_CONTRACT_ADDRESS = '0x25418e6f247161681D7a94912B0BA0D9e34c11ED';
export const NEW_BOT_SUBSCRIPTION_CONTRACT_ADDRESS = '0xCc54d4B377B9feACa48011436193B4DF0588B6e6';
export const NEW_BOT_PAYMENT_CONTRACT_ADDRESS = '0x59eE55A565680aAb89F3cbEb4a35ce5Aeef9D427';

// Sepolia 测试网配置
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainIdHex: '0xAA36A7',
  chainName: 'Sepolia Test Network',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/161ab53b248d4a039e6e6d31908a988b'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
} as const;

// OP Sepolia 测试网配置
export const OP_SEPOLIA_CONFIG = {
  chainId: 11155420,
  chainIdHex: '0xAA37DC',
  chainName: 'OP Sepolia',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://optimism-sepolia.infura.io/v3/161ab53b248d4a039e6e6d31908a988b'],
  blockExplorerUrls: ['https://sepolia-optimism.etherscan.io/'],
} as const;

// 当前使用的网络配置（默认使用 OP Sepolia，因为新合约在这个网络上）
export const NETWORK_CONFIG = OP_SEPOLIA_CONFIG;

// 网络切换错误类型
export class NetworkSwitchError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'NetworkSwitchError';
  }
}

// 切换到 Sepolia 测试网
export const switchToSepolia = async (): Promise<void> => {
  if (!window?.ethereum) {
    throw new NetworkSwitchError('未检测到 MetaMask');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CONFIG.chainIdHex }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CONFIG.chainIdHex,
              chainName: SEPOLIA_CONFIG.chainName,
              nativeCurrency: SEPOLIA_CONFIG.nativeCurrency,
              rpcUrls: SEPOLIA_CONFIG.rpcUrls,
              blockExplorerUrls: SEPOLIA_CONFIG.blockExplorerUrls,
            },
          ],
        });
      } catch (addError: any) {
        throw new NetworkSwitchError(
          addError.message || '添加 Sepolia 网络失败',
          addError.code
        );
      }
    } else {
      throw new NetworkSwitchError(
        error.message || '切换到 Sepolia 网络失败',
        error.code
      );
    }
  }
};

// 切换到 OP Sepolia 测试网
export const switchToOpSepolia = async (): Promise<void> => {
  if (!window?.ethereum) {
    throw new NetworkSwitchError('未检测到 MetaMask');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: OP_SEPOLIA_CONFIG.chainIdHex }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: OP_SEPOLIA_CONFIG.chainIdHex,
              chainName: OP_SEPOLIA_CONFIG.chainName,
              nativeCurrency: OP_SEPOLIA_CONFIG.nativeCurrency,
              rpcUrls: OP_SEPOLIA_CONFIG.rpcUrls,
              blockExplorerUrls: OP_SEPOLIA_CONFIG.blockExplorerUrls,
            },
          ],
        });
      } catch (addError: any) {
        throw new NetworkSwitchError(
          addError.message || '添加 OP Sepolia 网络失败',
          addError.code
        );
      }
    } else {
      throw new NetworkSwitchError(
        error.message || '切换到 OP Sepolia 网络失败',
        error.code
      );
    }
  }
}; 