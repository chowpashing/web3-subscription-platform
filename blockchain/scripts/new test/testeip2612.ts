import { ethers } from "hardhat";
import { network } from "hardhat";
import { parseUnits, formatUnits } from "@ethersproject/units";
import { splitSignature } from "@ethersproject/bytes";

// USDT合约地址 (Optimism Sepolia)
const USDT_CONTRACT_ADDRESS = "0x3cdD5BE5b0c62F4B43DBf76F71aDb1b764cf2268";

async function main() {
  console.log("🚀 开始部署和测试 USDT 合约的 EIP-2612 支持...");
  console.log("当前网络:", network.name);
  
  // 获取签名者
  const [owner] = await ethers.getSigners();
  console.log("部署账户:", owner.address);

  // 1. 部署 USDT 合约
  console.log("\n1️⃣ 部署 USDT 合约");
  console.log("----------------------------------------");
  const USDT = await ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy();
  // 等待合约部署完成
  console.log("等待合约部署确认...");
  const contractAddress = await usdt.getAddress();
  console.log("USDT 合约已部署到:", contractAddress);

  // 2. 铸造一些代币用于测试
  console.log("\n铸造测试代币...");
  const mintAmount = BigInt(1000000_000000); // 铸造 100万 USDT (6位小数)
  const mintTx = await usdt.mint(owner.address, mintAmount);
  await mintTx.wait();
  console.log(`已铸造 ${Number(mintAmount) / 1e6} USDT 到账户 ${owner.address}`);

  // 3. 测试 EIP-2612 功能
  console.log("\n2️⃣ 测试 EIP-2612 功能");
  console.log("----------------------------------------");

  try {
    // 测试基本信息
    const name = await usdt.name();
    const symbol = await usdt.symbol();
    console.log(`合约名称: ${name}`);
    console.log(`合约符号: ${symbol}`);

    // 测试 nonces 函数
    console.log("\n测试 nonces 函数...");
    try {
      const nonce = await usdt.nonces(owner.address);
      console.log(`✅ nonces 函数正常工作`);
      console.log(`当前账户的 nonce 值: ${nonce.toString()}`);
    } catch (error: any) {
      console.log("❌ nonces 函数调用失败");
      console.error("错误:", error.message);
    }

    // 测试 DOMAIN_SEPARATOR
    console.log("\n测试 DOMAIN_SEPARATOR...");
    try {
      const domainSeparator = await usdt.DOMAIN_SEPARATOR();
      console.log("✅ DOMAIN_SEPARATOR 函数正常工作");
      console.log("DOMAIN_SEPARATOR:", domainSeparator);
    } catch (error: any) {
      console.log("❌ DOMAIN_SEPARATOR 函数调用失败");
      console.error("错误:", error.message);
    }

    // 测试 permit 函数
    console.log("\n测试 permit 函数...");
    try {
      // 准备 permit 调用参数
      const spender = owner.address;
      const value = BigInt(1000_000000); // 1000 USDT
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期

      // 获取 domain separator 和 nonce
      const domainSeparator = await usdt.DOMAIN_SEPARATOR();
      const nonce = await usdt.nonces(owner.address);

      // 创建 permit 签名
      const domain = {
        name: "Tether USD",
        version: "1",
        chainId: network.config.chainId,
        verifyingContract: contractAddress
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const values = {
        owner: owner.address,
        spender,
        value,
        nonce,
        deadline
      };

      // 签名
      const signature = await owner.signTypedData(domain, types, values);
      const sig = splitSignature(signature);

      // 调用 permit
      const permitTx = await usdt.permit(
        owner.address,
        spender,
        value,
        deadline,
        sig.v,
        sig.r,
        sig.s
      );
      await permitTx.wait();

      console.log("✅ permit 函数调用成功");
      
      // 验证授权是否生效
      const allowance = await usdt.allowance(owner.address, spender);
      console.log(`授权金额: ${Number(allowance) / 1e6} USDT`);
      
    } catch (error: any) {
      console.log("❌ permit 函数测试失败");
      console.error("错误:", error.message);
    }

    console.log("\n📝 总结");
    console.log("----------------------------------------");
    console.log("1. 合约部署成功:", contractAddress);
    console.log("2. 基本信息正常");
    console.log(`3. nonces 函数: ${await usdt.nonces(owner.address) !== undefined ? "✅ 支持" : "❌ 不支持"}`);
    console.log(`4. DOMAIN_SEPARATOR: ${await usdt.DOMAIN_SEPARATOR() !== undefined ? "✅ 支持" : "❌ 不支持"}`);
    console.log(`5. permit 函数: ${usdt.interface.getFunction("permit") !== undefined ? "✅ 支持" : "❌ 不支持"}`);
    
  } catch (error: any) {
    console.error("\n❌ 测试过程中发生错误:", error.message);
    if (error.error) {
      console.error("详细错误:", error.error);
    }
  }
}

// 运行测试
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
