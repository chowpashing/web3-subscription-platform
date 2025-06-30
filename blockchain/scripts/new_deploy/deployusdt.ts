import { HardhatRuntimeEnvironment } from 'hardhat/types';
import '@nomicfoundation/hardhat-ethers';
import { Contract } from '@ethersproject/contracts';

async function main() {
  const hre = require("hardhat");
  const { ethers } = hre;
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("当前网络:", hre.network.name);

  // 部署 USDT 合约
  console.log("\n开始部署 USDT 合约...");
  const USDT = await ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy();
  await usdt.waitForDeployment();
  
  const usdtAddress = await usdt.getAddress();
  console.log("USDT 合约已部署到:", usdtAddress);

  // 铸造 1000 USDT 到部署者账户
  console.log("\n开始铸造 USDT...");
  const mintAmount = ethers.parseUnits("1000", 6); // USDT 使用 6 位小数
  const mintTx = await usdt.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("已铸造 1000 USDT 到账户:", deployer.address);

  // 验证余额
  const balance = await usdt.balanceOf(deployer.address);
  console.log("当前 USDT 余额:", ethers.formatUnits(balance, 6));

  console.log("\n部署信息汇总:");
  console.log("- USDT 合约地址:", usdtAddress);
  console.log("- 部署者地址:", deployer.address);
  console.log("- 部署者 USDT 余额:", ethers.formatUnits(balance, 6));
  console.log("- 网络:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
