import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // 部署 BotRegistry 合约
  const BotRegistry = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistry.deploy();
  await botRegistry.waitForDeployment();
  console.log(`BotRegistry deployed to: ${await botRegistry.getAddress()}`);

  // 部署 BotSubscription 合约
  const BotSubscription = await ethers.getContractFactory("BotSubscription");
  const botSubscription = await BotSubscription.deploy(await botRegistry.getAddress(), ethers.ZeroAddress);
  await botSubscription.waitForDeployment();
  console.log(`BotSubscription deployed to: ${await botSubscription.getAddress()}`);

  // 部署 BotPayment 合约
  const BotPayment = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPayment.deploy(ethers.ZeroAddress, await botRegistry.getAddress(), await botSubscription.getAddress());
  await botPayment.waitForDeployment();
  console.log(`BotPayment deployed to: ${await botPayment.getAddress()}`);

  // 更新 BotSubscription 中的 BotPayment 地址
  await botSubscription.updatePaymentContract(await botPayment.getAddress());
  console.log("Updated BotSubscription with BotPayment address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 