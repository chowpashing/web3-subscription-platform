import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gasPrice: 20000000000,
      blockGasLimit: 30000000,
      allowUnlimitedContractSize: true
    },
    sepolia: {
      url: process.env.WEB3_PROVIDER_URI || "",
      accounts: process.env.ADMIN_PRIVATE_KEY ? [process.env.ADMIN_PRIVATE_KEY] : [],
    },
    optimism_sepolia: {
      url: "https://optimism-sepolia.infura.io/v3/161ab53b248d4a039e6e6d31908a988b",
      accounts: process.env.ADMIN_PRIVATE_KEY ? [process.env.ADMIN_PRIVATE_KEY] : [],
      chainId: 11155420
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21,
    token: 'ETH',
    showTimeSpent: true,
  },
};

export default config;