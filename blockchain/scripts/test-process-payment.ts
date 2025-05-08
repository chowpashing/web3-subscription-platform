import { ethers } from "hardhat";

async function main() {
  const botPaymentAddress = "0x34f67765ffAE9633eE7eA6eD89CcaFB910a08777";
  const botPayment = await ethers.getContractAt("BotPayment", botPaymentAddress);

  const botId = 1;
  const amount = ethers.parseUnits("2.99997", 6); // 2.99997 USDT
  const durationInDays = 90;

  try {
    const tx = await botPayment.processPayment(botId, amount, durationInDays);
    await tx.wait();
    console.log("processPayment success");
  } catch (error) {
    console.error("processPayment failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 