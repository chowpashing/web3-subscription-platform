import { ethers } from "hardhat";
import { 
  NewRegistry,
  NewSubscription,
  NewBotPayment,
  USDT
} from "../../typechain-types";

async function main() {
  console.log("Starting NewBotPayment test...");

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

  // Mint USDT for owner and developer
  console.log("\n1.1 Minting USDT...");
  const mintAmount = ethers.parseUnits("1000", 6);
  await usdt.connect(owner).mint(owner.address, mintAmount);
  await usdt.connect(owner).mint(developer.address, mintAmount);
  console.log("USDT minted for owner and developer");

  // Deploy NewRegistry
  const NewRegistryFactory = await ethers.getContractFactory("NewRegistry");
  const registry = await NewRegistryFactory.deploy(owner.address) as unknown as NewRegistry;
  await registry.waitForDeployment();
  console.log("NewRegistry deployed to:", await registry.getAddress());

  // Deploy NewSubscription
  const NewSubscriptionFactory = await ethers.getContractFactory("NewSubscription");
  const subscription = await NewSubscriptionFactory.deploy(
    await registry.getAddress(),
    ethers.ZeroAddress
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
  await subscription.updatePaymentContract(await payment.getAddress());
  console.log("Updated payment contract in subscription");

  // Register bot
  console.log("\n2. Registering bot...");
  const botPrice = ethers.parseUnits("10", 6);
  await registry.connect(developer).registerBot(
    "QmTest123",
    botPrice,
    5, // 5 seconds trial
    "TestBot"
  );
  console.log("Bot registered");

  // Transfer USDT to user
  console.log("\n3. Transferring USDT to user...");
  await usdt.connect(owner).transfer(user.address, ethers.parseUnits("100", 6));
  console.log("USDT transferred to user");

  // Test 1: Check initial platform fee
  console.log("\n4. Test 1: Check initial platform fee");
  const initialFee = await payment.platformFeePercent();
  console.log("Initial platform fee:", initialFee.toString(), "%");

  // Test 2: Update platform fee
  console.log("\n5. Test 2: Update platform fee");
  await payment.connect(owner).updatePlatformFee(1500); // 15%
  const newFee = await payment.platformFeePercent();
  console.log("New platform fee:", newFee.toString(), "%");

  // Test 3: Approve and process payment
  console.log("\n6. Test 3: Process payment");
  await usdt.connect(user).approve(await payment.getAddress(), ethers.parseUnits("100", 6));
  await payment.connect(user).processPayment(0, botPrice, 30); // 30 days
  console.log("Payment processed");

  // Test 4: Check payment status
  console.log("\n7. Test 4: Check payment status");
  const paymentStatus = await payment.getPaymentStatus(user.address, 0);
  console.log("Payment status:", paymentStatus.toString());

  // Test 5: Check escrow balance
  console.log("\n8. Test 5: Check escrow balance");
  const escrowBalance = await payment.getEscrowBalance(user.address, 0);
  console.log("Escrow balance:", ethers.formatUnits(escrowBalance, 6), "USDT");

  // Test 6: Wait and finalize payment
  console.log("\n9. Test 6: Finalize payment");
  console.log("Waiting for trial period to end (5 seconds)...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await payment.connect(owner).finalizePayment(user.address, 0);
  console.log("Payment finalized");

  // Test 7: Check platform fee balance
  console.log("\n10. Test 7: Check platform fee balance");
  const platformFeeBalance = await payment.platformFeeBalance();
  console.log("Platform fee balance:", ethers.formatUnits(platformFeeBalance, 6), "USDT");

  // Test 8: Check bot income
  console.log("\n11. Test 8: Check bot income");
  const income = await payment.botInfo(0);
  console.log("Bot income:", ethers.formatUnits(income, 6), "USDT");

  // Test 9: Check final balances
  console.log("\n12. Test 9: Check final balances");
  const ownerBalance = await usdt.balanceOf(owner.address);
  const developerBalance = await usdt.balanceOf(developer.address);
  const userBalance = await usdt.balanceOf(user.address);
  console.log("Owner balance:", ethers.formatUnits(ownerBalance, 6), "USDT");
  console.log("Developer balance:", ethers.formatUnits(developerBalance, 6), "USDT");
  console.log("User balance:", ethers.formatUnits(userBalance, 6), "USDT");

  // Print gas consumption summary
  console.log("\nGas consumption summary:");
  const usdtDeployTx = await usdt.deploymentTransaction();
  const registryDeployTx = await registry.deploymentTransaction();
  const subscriptionDeployTx = await subscription.deploymentTransaction();
  const paymentDeployTx = await payment.deploymentTransaction();
  const registerBotTx = await registry.connect(developer).registerBot("QmTest123", botPrice, 5, "TestBot");
  const approveTx = await usdt.connect(user).approve(await payment.getAddress(), ethers.parseUnits("100", 6));
  const processPaymentTx = await payment.connect(user).processPayment(0, botPrice, 30);
  const updateFeeTx = await payment.connect(owner).updatePlatformFee(1500);
  const withdrawFeeTx = await payment.connect(owner).withdrawPlatformFee();

  console.log("1. Deploy USDT:", (await usdtDeployTx?.wait())?.gasUsed.toString(), "wei");
  console.log("2. Deploy NewRegistry:", (await registryDeployTx?.wait())?.gasUsed.toString(), "wei");
  console.log("3. Deploy NewSubscription:", (await subscriptionDeployTx?.wait())?.gasUsed.toString(), "wei");
  console.log("4. Deploy NewBotPayment:", (await paymentDeployTx?.wait())?.gasUsed.toString(), "wei");
  console.log("5. Register bot:", (await registerBotTx.wait())?.gasUsed.toString(), "wei");
  console.log("6. Approve USDT:", (await approveTx.wait())?.gasUsed.toString(), "wei");
  console.log("7. Process payment:", (await processPaymentTx.wait())?.gasUsed.toString(), "wei");
  console.log("8. Update platform fee:", (await updateFeeTx.wait())?.gasUsed.toString(), "wei");
  console.log("9. Withdraw platform fee:", (await withdrawFeeTx.wait())?.gasUsed.toString(), "wei");

  console.log("\nAll tests completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 