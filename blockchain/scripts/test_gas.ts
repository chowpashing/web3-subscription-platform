import { ethers } from "hardhat";
import { 
  BotRegistry, 
  BotPayment, 
  BotSubscription,
  USDT
} from "../typechain-types";

async function main() {
  console.log("Starting gas consumption test...");

  // Get test accounts
  const [owner, subscriber] = await ethers.getSigners();

  // Deploy contracts
  console.log("\n1. Deploying contracts...");
  
  // Deploy USDT
  const USDTFactory = await ethers.getContractFactory("USDT");
  const usdt = await USDTFactory.deploy() as unknown as USDT;
  await usdt.waitForDeployment();
  console.log("USDT deployed to:", await usdt.getAddress());

  // Deploy BotRegistry
  const BotRegistryFactory = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistryFactory.deploy() as unknown as BotRegistry;
  await botRegistry.waitForDeployment();
  console.log("BotRegistry deployed to:", await botRegistry.getAddress());

  // Deploy BotSubscription
  const BotSubscriptionFactory = await ethers.getContractFactory("BotSubscription");
  const botSubscription = await BotSubscriptionFactory.deploy(
    await botRegistry.getAddress(),
    ethers.ZeroAddress
  ) as unknown as BotSubscription;
  await botSubscription.waitForDeployment();
  console.log("BotSubscription deployed to:", await botSubscription.getAddress());

  // Deploy BotPayment
  const BotPaymentFactory = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPaymentFactory.deploy(
    await usdt.getAddress(),
    await botRegistry.getAddress(),
    await botSubscription.getAddress()
  ) as unknown as BotPayment;
  await botPayment.waitForDeployment();
  console.log("BotPayment deployed to:", await botPayment.getAddress());

  // Update BotSubscription's payment contract address
  await botSubscription.updatePaymentContract(await botPayment.getAddress());

  // Test BotRegistry gas consumption
  console.log("\n2. Testing BotRegistry gas consumption...");
  const registerTx = await botRegistry.registerBot(
    "QmTest123",
    ethers.parseUnits("10", 6),
    1,
    "TestBot",
    "Test Bot Description"
  );
  const registerReceipt = await registerTx.wait();
  console.log("Register bot gas used:", registerReceipt?.gasUsed.toString(), "wei");

  // Test BotPayment gas consumption
  console.log("\n3. Testing BotPayment gas consumption...");
  
  // Mint USDT for subscriber
  await usdt.mint(subscriber.address, ethers.parseUnits("1000", 6));
  
  // Approve USDT
  const approveTx = await usdt.connect(subscriber).approve(
    await botPayment.getAddress(),
    ethers.parseUnits("10", 6)
  );
  const approveReceipt = await approveTx.wait();
  console.log("Approve USDT gas used:", approveReceipt?.gasUsed.toString(), "wei");

  // Process payment
  const paymentTx = await botPayment.connect(subscriber).processPayment(
    1, // botId
    ethers.parseUnits("10", 6),
    30 // 30 days
  );
  const paymentReceipt = await paymentTx.wait();
  console.log("Process payment gas used:", paymentReceipt?.gasUsed.toString(), "wei");

  // Test BotSubscription gas consumption
  console.log("\n4. Testing BotSubscription gas consumption...");
  
  // Cancel subscription
  const cancelTx = await botSubscription.connect(subscriber).cancel(1);
  const cancelReceipt = await cancelTx.wait();
  console.log("Cancel subscription gas used:", cancelReceipt?.gasUsed.toString(), "wei");

  console.log("\nGas test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });