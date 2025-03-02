const hre = require("hardhat");

async function main() {
  // 部署模拟USDT代币
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  console.log("MockUSDT deployed to:", await mockUSDT.getAddress());

  // 设置退款期限为1小时（3600秒）
  const refundPeriod = 3600;

  // 部署支付处理合约
  const PaymentProcessor = await hre.ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy(
    await mockUSDT.getAddress(),
    refundPeriod
  );
  await paymentProcessor.waitForDeployment();
  console.log("PaymentProcessor deployed to:", await paymentProcessor.getAddress());

  // 为了测试方便，给部署者铸造一些USDT
  const [deployer] = await hre.ethers.getSigners();
  const mintAmount = hre.ethers.parseUnits("10000", 6); // 铸造10000 USDT
  await mockUSDT.mint(deployer.address, mintAmount);
  console.log("Minted", hre.ethers.formatUnits(mintAmount, 6), "USDT to", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});