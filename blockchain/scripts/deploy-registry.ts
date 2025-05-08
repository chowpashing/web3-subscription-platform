import { HardhatRuntimeEnvironment } from "hardhat/types";
import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const hre = require("hardhat");
    const ethers = hre.ethers;
    
    // 获取部署账户
    const [deployer] = await ethers.getSigners();
    
    console.log("开始部署合约...");
    console.log("部署账户:", deployer.address);

    // 部署合约
    const BotRegistry = await ethers.getContractFactory("BotRegistry");
    const botRegistry = await BotRegistry.deploy();
    await botRegistry.waitForDeployment();

    const contractAddress = await botRegistry.getAddress();
    console.log("合约已部署到地址:", contractAddress);
    
    console.log("\n请将此地址复制到 .env 文件中的 BOT_REGISTRY_CONTRACT_ADDRESS");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
