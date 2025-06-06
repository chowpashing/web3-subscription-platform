import { ethers } from "hardhat";

async function main() {
  const USDT_ADDRESS = "0x79C1433c99E6D3CBD8fcdD6957315b8Ed198aDcf";
  console.log("开始部署合约到 Sepolia 测试网...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  // 部署 BotRegistry 合约
  console.log("\n1. 部署 BotRegistry 合约...");
  const BotRegistry = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistry.deploy();
  await botRegistry.waitForDeployment();
  const botRegistryAddress = await botRegistry.getAddress();
  console.log("BotRegistry 已部署到:", botRegistryAddress);

  // 部署 BotSubscription 合约
  console.log("\n2. 部署 BotSubscription 合约...");
  const BotSubscription = await ethers.getContractFactory("BotSubscription");
  const botSubscription = await BotSubscription.deploy(botRegistryAddress, ethers.ZeroAddress);
  await botSubscription.waitForDeployment();
  const botSubscriptionAddress = await botSubscription.getAddress();
  console.log("BotSubscription 已部署到:", botSubscriptionAddress);

  // 部署 BotPayment 合约，传入正确的 USDT 地址
  console.log("\n3. 部署 BotPayment 合约...");
  const BotPayment = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPayment.deploy(USDT_ADDRESS, botRegistryAddress, botSubscriptionAddress);
  await botPayment.waitForDeployment();
  const botPaymentAddress = await botPayment.getAddress();
  console.log("BotPayment 已部署到:", botPaymentAddress);

  // 更新 BotSubscription 中的 BotPayment 地址
  console.log("\n4. 更新 BotSubscription 中的 BotPayment 地址...");
  await botSubscription.updatePaymentContract(botPaymentAddress);
  console.log("BotSubscription 已更新 BotPayment 地址");

  console.log("\n部署完成！请更新以下合约地址：");
  console.log("BOT_REGISTRY_CONTRACT_ADDRESS:", botRegistryAddress);
  console.log("BOT_SUBSCRIPTION_CONTRACT_ADDRESS:", botSubscriptionAddress);
  console.log("BOT_PAYMENT_CONTRACT_ADDRESS:", botPaymentAddress);
  console.log("USDT_CONTRACT_ADDRESS:", USDT_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 