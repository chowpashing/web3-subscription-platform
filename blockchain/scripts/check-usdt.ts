import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Checking USDT with account:", deployer.address);

  const testUsdtAddress = "0x2F73c658d04196dAfcC928A93010f7E2D60C1c4E";
  const targetAddress = "0x4294eB4a7B015aC9235CC74aaeEf247fdE0Cd923";
  console.log("TestUSDT contract:", testUsdtAddress);
  console.log("Target address:", targetAddress);

  try {
    // 获取 TestUSDT 合约实例
    const TestUSDT = await hre.ethers.getContractFactory("TestUSDT");
    const testUsdt = TestUSDT.attach(testUsdtAddress);

    // 检查合约基本信息
    const name = await testUsdt.name();
    const symbol = await testUsdt.symbol();
    const decimals = await testUsdt.decimals();
    console.log("Token info:", { name, symbol, decimals: decimals.toString() });

    // 检查目标地址余额
    const balance = await testUsdt.balanceOf(targetAddress);
    console.log("Balance:", hre.ethers.formatUnits(balance, 6), "USDT");

    // 检查合约所有者
    const owner = await testUsdt.owner();
    console.log("Contract owner:", owner);

    // 检查总供应量
    const totalSupply = await testUsdt.totalSupply();
    console.log("Total supply:", hre.ethers.formatUnits(totalSupply, 6), "USDT");

  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 