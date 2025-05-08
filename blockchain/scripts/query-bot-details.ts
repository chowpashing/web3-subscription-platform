import { ethers } from "hardhat";

async function main() {
  const botRegistryAddress = "0x9f19C95Ea0d53abc6752E0a99200BD716D17b4f3"; // 最新 BotRegistry 地址
  const botRegistry = await ethers.getContractAt("BotRegistry", botRegistryAddress);

  const botId = 1;
  const details = await botRegistry.getBotDetails(botId);
  console.log("Bot Details:", details);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 