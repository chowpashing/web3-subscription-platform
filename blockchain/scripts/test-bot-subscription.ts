import { ethers } from "hardhat";

async function main() {
  // 获取测试账户
  const [owner, developer, subscriber] = await ethers.getSigners();

  // 部署 USDT 合约
  const USDT = await ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy();
  await usdt.waitForDeployment();
  console.log("USDT 合约地址:", await usdt.getAddress());

  // 部署 BotRegistry 合约
  const BotRegistry = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistry.deploy();
  await botRegistry.waitForDeployment();
  console.log("BotRegistry 合约地址:", await botRegistry.getAddress());

  // 部署 BotSubscription 合约
  const BotSubscription = await ethers.getContractFactory("BotSubscription");
  const botSubscription = await BotSubscription.deploy(
    await botRegistry.getAddress(),
    ethers.ZeroAddress // 先用零地址
  );
  await botSubscription.waitForDeployment();
  console.log("BotSubscription 合约地址:", await botSubscription.getAddress());

  // 部署 BotPayment 合约
  const BotPayment = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPayment.deploy(
    await usdt.getAddress(),
    await botRegistry.getAddress(),
    await botSubscription.getAddress()
  );
  await botPayment.waitForDeployment();
  console.log("BotPayment 合约地址:", await botPayment.getAddress());

  // 更新 BotSubscription 的支付合约地址
  await botSubscription.updatePaymentContract(await botPayment.getAddress());

  // 给订阅者铸造 USDT
  await usdt.connect(owner).mint(subscriber.address, ethers.parseUnits("1000", 6));
  console.log("给订阅者铸造 1000 USDT");

  // 开发者注册机器人
  const tx = await botRegistry.connect(developer).registerBot(
    "ipfs-hash-002",
    ethers.parseUnits("20", 6), // 20 USDT
    48, // 48 小时试用
    "TestBot2",
    "Another test bot"
  );
  await tx.wait();
  const botId = await botRegistry.botCount();
  console.log("注册机器人，ID:", botId.toString());

  // 订阅者授权 BotPayment 合约消费 USDT
  await usdt.connect(subscriber).approve(await botPayment.getAddress(), ethers.parseUnits("1000", 6));
  console.log("订阅者授权 BotPayment 合约消费 USDT");

  // 订阅者通过 BotPayment 合约支付并订阅
  await botPayment.connect(subscriber).processPayment(
    botId,
    ethers.parseUnits("20", 6),
    15 // 订阅 15 天
  );
  console.log("订阅者支付并订阅成功");

  // 查询订阅详情
  const sub = await botSubscription.getSubscription(subscriber.address, botId);
  console.log("订阅详情:", {
    startTime: new Date(Number(sub[0]) * 1000).toISOString(),
    endTime: new Date(Number(sub[1]) * 1000).toISOString(),
    trialEndTime: new Date(Number(sub[2]) * 1000).toISOString(),
    lastPayment: new Date(Number(sub[3]) * 1000).toISOString(),
    status: sub[4]
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 