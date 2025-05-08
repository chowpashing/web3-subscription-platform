import { ethers } from "hardhat";

async function main() {
  // 最新 USDT 合约地址
  const usdtAddress = "0x79C1433c99E6D3CBD8fcdD6957315b8Ed198aDcf";
  // 你的钱包地址
  const to = "0x4294eB4a7B015aC9235CC74aaeEf247fdE0Cd923";
  // mint 1000 USDT，6位小数
  const amount = ethers.parseUnits("1000", 6);

  const usdt = await ethers.getContractAt("USDT", usdtAddress);
  const tx = await usdt.mint(to, amount);
  await tx.wait();
  console.log(`Minted 1000 USDT to ${to}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
