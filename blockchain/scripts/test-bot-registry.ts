import { ethers } from "hardhat";

async function main() {
  // 获取测试账户
  const [deployer, developer] = await ethers.getSigners();

  // 部署 BotRegistry 合约
  const BotRegistry = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistry.deploy();
  await botRegistry.waitForDeployment();
  console.log("BotRegistry 合约地址:", await botRegistry.getAddress());

  // 开发者注册机器人
  const tx = await botRegistry.connect(developer).registerBot(
    "ipfs-hash-001",
    ethers.parseUnits("10", 6), // 10 USDT
    24, // 24 小时试用
    "TestBot",
    "A test bot"
  );
  await tx.wait();
  const botId = await botRegistry.botCount();
  console.log("注册机器人，ID:", botId.toString());

  // 获取机器人详情
  const botDetails = await botRegistry.getBotDetails(botId);
  console.log("机器人详情:", {
    ipfsHash: botDetails[0],
    price: ethers.formatUnits(botDetails[1], 6),
    trialTime: botDetails[2].toString(),
    name: botDetails[3],
    description: botDetails[4],
    developer: botDetails[5],
    isActive: botDetails[6],
    createdAt: new Date(Number(botDetails[7]) * 1000).toISOString()
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
