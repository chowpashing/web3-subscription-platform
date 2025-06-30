import { ethers } from "hardhat";
import { 
  NewRegistry,
  USDT
} from "../../typechain-types";

async function main() {
  console.log("Starting NewRegistry gas consumption test...");

  // Get test accounts
  const [owner, developer] = await ethers.getSigners();
  console.log("Test accounts:", {
    owner: owner.address,
    developer: developer.address
  });

  // Deploy contracts
  console.log("\n1. Deploying contracts...");
  
  // Deploy USDT
  const USDTFactory = await ethers.getContractFactory("USDT");
  const usdt = await USDTFactory.deploy() as unknown as USDT;
  await usdt.waitForDeployment();
  console.log("USDT deployed to:", await usdt.getAddress());

  // Deploy NewRegistry
  const NewRegistryFactory = await ethers.getContractFactory("NewRegistry");
  const registry = await NewRegistryFactory.deploy(owner.address) as unknown as NewRegistry;
  await registry.waitForDeployment();
  console.log("NewRegistry deployed to:", await registry.getAddress());

  // Test NewRegistry gas consumption
  console.log("\n2. Testing NewRegistry gas consumption...");

  // Register bot
  console.log("\n3. Registering bot...");
  const registerTx = await registry.connect(developer).registerBot(
    "QmTest123", // ipfsHash
    ethers.parseUnits("10", 6), // price
    24, // trialTime (hours)
    "TestBot" // name
  );
  const registerReceipt = await registerTx.wait();
  console.log("Bot registered:", registerTx.hash);
  console.log("Register bot gas used:", registerReceipt?.gasUsed.toString(), "wei");

  // Get bot details
  console.log("\n4. Getting bot details...");
  const botDetails = await registry.getBotDetails(0);
  console.log("Bot details:", {
    ipfsHash: botDetails[0],
    price: botDetails[1].toString(),
    trialTime: botDetails[2].toString(),
    name: botDetails[3],
    developer: botDetails[4],
    isActive: botDetails[5],
    exists: botDetails[6]
  });

  // Update bot status
  console.log("\n5. Updating bot status...");
  const updateStatusTx = await registry.connect(developer).setBotStatus(0, false);
  const updateStatusReceipt = await updateStatusTx.wait();
  console.log("Update bot status gas used:", updateStatusReceipt?.gasUsed.toString(), "wei");

  // Check developer status
  console.log("\n6. Checking developer status...");
  const isDeveloper = await registry.checkDeveloper(developer.address);
  console.log("Is developer:", isDeveloper);

  // Print gas consumption summary
  console.log("\nGas consumption summary:");
  const usdtDeployTx = await usdt.deploymentTransaction();
  const registryDeployTx = await registry.deploymentTransaction();

  console.log("1. Deploy USDT:", (await usdtDeployTx?.wait())?.gasUsed.toString(), "wei");
  console.log("2. Deploy NewRegistry:", (await registryDeployTx?.wait())?.gasUsed.toString(), "wei");
  console.log("3. Register bot:", registerReceipt?.gasUsed.toString(), "wei");
  console.log("4. Update bot status:", updateStatusReceipt?.gasUsed.toString(), "wei");

  console.log("\nGas test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });