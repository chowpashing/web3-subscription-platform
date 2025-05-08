import { ethers } from "hardhat";

async function main() {
  // 1. 获取测试账户
  const [owner, developer, subscriber] = await ethers.getSigners();

  // 2. 部署 USDT 合约
  const USDT = await ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy();
  await usdt.waitForDeployment();
  console.log("USDT 合约地址:", await usdt.getAddress());

  // 3. 部署 BotRegistry 合约
  const BotRegistry = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistry.deploy();
  await botRegistry.waitForDeployment();
  console.log("BotRegistry 合约地址:", await botRegistry.getAddress());

  // 4. 部署 BotSubscription 合约
  const BotSubscription = await ethers.getContractFactory("BotSubscription");
  const botSubscription = await BotSubscription.deploy(
    await botRegistry.getAddress(),
    ethers.ZeroAddress // 先用零地址，后面再更新
  );
  await botSubscription.waitForDeployment();
  console.log("BotSubscription 合约地址:", await botSubscription.getAddress());

  // 5. 部署 BotPayment 合约
  const BotPayment = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPayment.deploy(
    await usdt.getAddress(),
    await botRegistry.getAddress(),
    await botSubscription.getAddress()
  );
  await botPayment.waitForDeployment();
  console.log("BotPayment 合约地址:", await botPayment.getAddress());

  // 6. 更新 BotSubscription 的支付合约地址
  await botSubscription.updatePaymentContract(await botPayment.getAddress());

  // 7. 给订阅者铸造 USDT
  await usdt.connect(owner).mint(subscriber.address, ethers.parseUnits("1000", 6));
  console.log("给订阅者铸造 1000 USDT");

  // 8. 开发者注册机器人
  const tx = await botRegistry.connect(developer).registerBot(
    "ipfs-hash-001",
    ethers.parseUnits("10", 6), // 10 USDT
    24, // 24 小时试用
    "TestBot",
    "A test bot"
  );
  const receipt = await tx.wait();
  const botId = await botRegistry.botCount();
  console.log("注册机器人，ID:", botId.toString());

  // 9. 订阅者授权 BotPayment 合约消费 USDT
  await usdt.connect(subscriber).approve(await botPayment.getAddress(), ethers.parseUnits("1000", 6));
  console.log("订阅者授权 BotPayment 合约消费 USDT");

  // 10. 订阅者支付并订阅
  await botPayment.connect(subscriber).processPayment(
    botId,
    ethers.parseUnits("10", 6),
    30 // 订阅 30 天
  );
  console.log("订阅者支付并订阅成功");

  // 11. 管理员分账
  await botPayment.connect(owner).finalizePayment(subscriber.address, botId);
  console.log("管理员分账完成");

  // 12. 开发者提现
  const before = await usdt.balanceOf(developer.address);
  await botPayment.connect(developer).withdrawBalance();
  const after = await usdt.balanceOf(developer.address);
  console.log("开发者提现前:", ethers.formatUnits(before, 6), "提现后:", ethers.formatUnits(after, 6));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
