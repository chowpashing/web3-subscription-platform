import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PaymentProcessor contract...");

  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy();
  await paymentProcessor.waitForDeployment();

  const address = await paymentProcessor.getAddress();
  console.log(`PaymentProcessor deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });