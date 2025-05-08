import { ethers } from "@nomicfoundation/hardhat-ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署测试USDT合约
  console.log("Deploying TestUSDT...");
  const TestUSDT = await ethers.getContractFactory("TestUSDT");
  const testUsdt = await TestUSDT.deploy();
  await testUsdt.waitForDeployment();
  const testUsdtAddress = await testUsdt.getAddress();
  console.log("TestUSDT deployed to:", testUsdtAddress);

  // 部署 ETHToUSDT 合约
  console.log("Deploying ETHToUSDT...");
  const ETHToUSDT = await ethers.getContractFactory("ETHToUSDT");
  const ethToUsdt = await ETHToUSDT.deploy(testUsdtAddress);
  await ethToUsdt.waitForDeployment();
  const ethToUsdtAddress = await ethToUsdt.getAddress();
  console.log("ETHToUSDT deployed to:", ethToUsdtAddress);

  // 向 ETHToUSDT 合约转入 1000 USDT
  console.log("Transferring 1000 USDT to ETHToUSDT contract...");
  const transferTx = await testUsdt.transfer(ethToUsdtAddress, ethers.parseUnits("1000", 6));
  await transferTx.wait();
  console.log("Transfer completed");

  console.log("Deployment completed!");
  console.log("TestUSDT address:", testUsdtAddress);
  console.log("ETHToUSDT address:", ethToUsdtAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 