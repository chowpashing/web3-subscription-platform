import { ethers } from "hardhat";

// 配置参数
const BOT_REGISTRY_ADDRESS = "0x106D81BD04A67F9238Ee1d47F6A106e1f3FDFb61";
const BOT_SUBSCRIPTION_ADDRESS = "0x7E2EB5f6BA6eDC6Fe0A04bF9F5e7B5E76423Ea74";
const BOT_REGISTRY_ABI = require("../artifacts/contracts/BotRegistry.sol/BotRegistry.json").abi;
const BOT_SUBSCRIPTION_ABI = require("../artifacts/contracts/BotSubscription.sol/BotSubscription.json").abi;

// 修改为你要查询的botId和用户地址
const botId = 1;
const userAddress = "0x4294eB4a7B015aC9235CC74aaeEf247fdE0Cd923";

async function main() {
  const provider = ethers.provider;

  // 查询机器人 trialTime
  const botRegistry = new ethers.Contract(BOT_REGISTRY_ADDRESS, BOT_REGISTRY_ABI, provider);
  const botDetails = await botRegistry.getBotDetails(botId);
  console.log(`Bot #${botId} trialTime (小时):`, botDetails.trialTime.toString());

  // 查询用户订阅的 trialEndTime
  const botSubscription = new ethers.Contract(BOT_SUBSCRIPTION_ADDRESS, BOT_SUBSCRIPTION_ABI, provider);
  const subscription = await botSubscription.getSubscription(userAddress, botId);
  const trialEndTime = new Date(Number(subscription.trialEndTime) * 1000);
  const startTime = new Date(Number(subscription.startTime) * 1000);
  console.log(`用户订阅 startTime:`, startTime.toLocaleString());
  console.log(`用户订阅 trialEndTime:`, trialEndTime.toLocaleString());
  console.log(`trialEndTime == startTime ?`, Number(subscription.trialEndTime) === Number(subscription.startTime));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 