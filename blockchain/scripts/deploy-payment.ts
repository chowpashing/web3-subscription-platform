import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);

  // 部署 USDT 代币合约
  console.log("部署 USDT 代币合约...");
  const USDT = await ethers.getContractFactory("USDT");
  const usdtToken = await USDT.deploy();
  await usdtToken.waitForDeployment();
  console.log("USDT 合约地址:", await usdtToken.getAddress());

  // 部署 BotRegistry
  console.log("部署 BotRegistry 合约...");
  const BotRegistry = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistry.deploy();
  await botRegistry.waitForDeployment();
  console.log("BotRegistry 合约地址:", await botRegistry.getAddress());

  // 部署 BotSubscription
  console.log("部署 BotSubscription 合约...");
  const BotSubscription = await ethers.getContractFactory("BotSubscription");
  const botSubscription = await BotSubscription.deploy(
    await botRegistry.getAddress(),
    ethers.ZeroAddress // 暂时使用零地址，后面会更新
  );
  await botSubscription.waitForDeployment();
  console.log("BotSubscription 合约地址:", await botSubscription.getAddress());

  // 部署 BotPayment
  console.log("部署 BotPayment 合约...");
  const BotPayment = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPayment.deploy(
    await usdtToken.getAddress(),
    await botRegistry.getAddress(),
    await botSubscription.getAddress()
  );
  await botPayment.waitForDeployment();
  console.log("BotPayment 合约地址:", await botPayment.getAddress());

  // 更新 BotSubscription 的支付合约地址
  console.log("更新 BotSubscription 的支付合约地址...");
  await botSubscription.updatePaymentContract(await botPayment.getAddress());
  console.log("更新完成");

  console.log("部署完成！");
  console.log("合约地址列表：");
  console.log("USDT:", await usdtToken.getAddress());
  console.log("BotRegistry:", await botRegistry.getAddress());
  console.log("BotSubscription:", await botSubscription.getAddress());
  console.log("BotPayment:", await botPayment.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 