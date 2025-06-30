import { ethers } from "hardhat";
import { 
  NewRegistry,
  NewSubscription,
  NewBotPayment,
  USDT
} from "../../typechain-types";

async function main() {
  console.log("Starting NewSubscription gas consumption test...");

  // Get test accounts
  const [owner, developer, user] = await ethers.getSigners();
  console.log("Test accounts:", {
    owner: owner.address,
    developer: developer.address,
    user: user.address
  });

  // Deploy contracts
  console.log("\n1. Deploying contracts...");
  
  // Deploy USDT
  const USDTFactory = await ethers.getContractFactory("USDT");
  const usdt = await USDTFactory.deploy() as unknown as USDT;
  await usdt.waitForDeployment();
  console.log("USDT deployed to:", await usdt.getAddress());

  // Mint USDT for owner
  console.log("\n1.1 Minting USDT for owner...");
  const mintTx = await usdt.connect(owner).mint(
    owner.address,
    ethers.parseUnits("1000", 6) // 给owner铸造1000 USDT
  );
  const mintReceipt = await mintTx.wait();
  console.log("USDT minted:", mintTx.hash);
  console.log("Mint gas used:", mintReceipt?.gasUsed.toString(), "wei");

  // Deploy NewRegistry
  const NewRegistryFactory = await ethers.getContractFactory("NewRegistry");
  const registry = await NewRegistryFactory.deploy(owner.address) as unknown as NewRegistry;
  await registry.waitForDeployment();
  console.log("NewRegistry deployed to:", await registry.getAddress());

  // Deploy NewSubscription
  const NewSubscriptionFactory = await ethers.getContractFactory("NewSubscription");
  const subscription = await NewSubscriptionFactory.deploy(
    await registry.getAddress(),
    ethers.ZeroAddress  // 临时地址，后面会更新
  ) as unknown as NewSubscription;
  await subscription.waitForDeployment();
  console.log("NewSubscription deployed to:", await subscription.getAddress());

  // Deploy NewBotPayment
  const NewBotPaymentFactory = await ethers.getContractFactory("NewBotPayment");
  const payment = await NewBotPaymentFactory.deploy(
    await usdt.getAddress(),
    await registry.getAddress(),
    await subscription.getAddress()
  ) as unknown as NewBotPayment;
  await payment.waitForDeployment();
  console.log("NewBotPayment deployed to:", await payment.getAddress());

  // Update payment contract in subscription
  const updateTx = await subscription.updatePaymentContract(await payment.getAddress());
  await updateTx.wait();
  console.log("Updated payment contract in subscription");

  // Register bot
  console.log("\n2. Registering bot...");
  const registerTx = await registry.connect(developer).registerBot(
    "QmTest123", // ipfsHash
    ethers.parseUnits("10", 6), // price
    5, // trialTime (seconds)
    "TestBot" // name
  );
  const registerReceipt = await registerTx.wait();
  console.log("Bot registered:", registerTx.hash);
  console.log("Register bot gas used:", registerReceipt?.gasUsed.toString(), "wei");

  // Approve USDT
  console.log("\n3. Approving USDT...");
  const approveTx = await usdt.connect(user).approve(
    await payment.getAddress(),
    ethers.parseUnits("100", 6) // 批准100 USDT
  );
  const approveReceipt = await approveTx.wait();
  console.log("USDT approved:", approveTx.hash);
  console.log("Approve gas used:", approveReceipt?.gasUsed.toString(), "wei");

  // Transfer USDT to user
  console.log("\n3.1 Transferring USDT to user...");
  const transferTx = await usdt.connect(owner).transfer(
    user.address,
    ethers.parseUnits("100", 6) // 转100 USDT给用户
  );
  const transferReceipt = await transferTx.wait();
  console.log("USDT transferred:", transferTx.hash);
  console.log("Transfer gas used:", transferReceipt?.gasUsed.toString(), "wei");

  // Subscribe to bot
  console.log("\n4. Subscribing to bot...");
  const subscribeTx = await payment.connect(user).processPayment(
    0, // botId
    ethers.parseUnits("10", 6), // amount
    30 // durationInDays
  );
  const subscribeReceipt = await subscribeTx.wait();
  console.log("Subscription created:", subscribeTx.hash);
  console.log("Subscribe gas used:", subscribeReceipt?.gasUsed.toString(), "wei");

  // Get subscription details
  console.log("\n5. Getting subscription details...");
  const subDetails = await subscription.getSubscription(user.address, 0);
  console.log("Subscription details:", {
    startTime: subDetails[0].toString(),
    endTime: subDetails[1].toString(),
    trialEndTime: subDetails[2].toString(),
    lastPayment: subDetails[3].toString(),
    status: subDetails[4].toString()
  });

  // Check subscription status
  console.log("\n6. Checking subscription status...");
  const isActive = await subscription.isActive(user.address, 0);
  const isTrialActive = await subscription.isTrialActive(user.address, 0);
  console.log("Is active:", isActive);
  console.log("Is trial active:", isTrialActive);

  // Cancel subscription during trial period
  console.log("\n7. Cancelling subscription...");
  const cancelTx = await subscription.connect(user).cancel(0);
  const cancelReceipt = await cancelTx.wait();
  console.log("Subscription cancelled:", cancelTx.hash);
  console.log("Cancel gas used:", cancelReceipt?.gasUsed.toString(), "wei");

  // Print summary
  console.log("\nGas consumption summary:");
  console.log("1. Register bot:", registerReceipt?.gasUsed.toString(), "wei");
  console.log("2. Approve USDT:", approveReceipt?.gasUsed.toString(), "wei");
  console.log("3. Transfer USDT:", transferReceipt?.gasUsed.toString(), "wei");
  console.log("4. Subscribe:", subscribeReceipt?.gasUsed.toString(), "wei");
  console.log("5. Cancel subscription:", cancelReceipt?.gasUsed.toString(), "wei");

  console.log("\nGas test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 

  
  px hardhat run scripts/new\ test/testsubscription.ts --network hardhat