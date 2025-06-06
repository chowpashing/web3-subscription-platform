import { ethers } from 'ethers';

interface RequestArguments {
  method: string;
  params?: unknown[];
}

interface EthereumProvider extends ethers.providers.ExternalProvider {
  isMetaMask?: boolean;
  request: (args: RequestArguments) => Promise<unknown>;
  on: (event: string, callback: (accounts: string[]) => void) => void;
  removeListener: (event: string, callback: (accounts: string[]) => void) => void;
  enable?: () => Promise<void>;
  isConnected: () => boolean;
  chainId: string;
  networkVersion: string;
  selectedAddress: string | null;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 