import { ethers } from "hardhat";

// 新旧 USDT 合约地址
const OLD_USDT_ADDRESS = "0x325105c248bC4683b0c1CA24a8774cFA142Cc0e0";
const NEW_USDT_ADDRESS = "0x3cdD5BE5b0c62F4B43DBf76F71aDb1b764cf2268";
// Payment 合约地址
const PAYMENT_CONTRACT_ADDRESS = "0x59eE55A565680aAb89F3cbEb4a35ce5Aeef9D427"; // 请替换为实际的 Payment 合约地址

async function main() {
  console.log("🔍 检查 Payment 合约中的代币支持状态...");
  
  // 获取签名者
  const [owner] = await ethers.getSigners();
  console.log("操作账户:", owner.address);

  // 连接到 Payment 合约
  const NewBotPayment = await ethers.getContractFactory("NewBotPayment");
  const payment = NewBotPayment.attach(PAYMENT_CONTRACT_ADDRESS);
  console.log("Payment 合约地址:", PAYMENT_CONTRACT_ADDRESS);

  try {
    // 1. 检查当前状态
    console.log("\n1️⃣ 当前代币支持状态");
    console.log("----------------------------------------");
    const oldSupported = await payment.supportedTokens(OLD_USDT_ADDRESS);
    const newSupported = await payment.supportedTokens(NEW_USDT_ADDRESS);
    const oldBalance = await payment.platformFeeBalance(OLD_USDT_ADDRESS);
    
    console.log("旧 USDT 合约状态:", oldSupported ? "已支持" : "未支持");
    console.log("新 USDT 合约状态:", newSupported ? "已支持" : "未支持");
    console.log("旧 USDT 平台费余额:", oldBalance.toString());

    // 2. 执行更新
    if (oldSupported) {
      if (oldBalance.toString() === "0") {
        console.log("\n2️⃣ 移除旧的 USDT 合约");
        console.log("----------------------------------------");
        const removeTx = await payment.removeSupportedToken(OLD_USDT_ADDRESS);
        await removeTx.wait();
        console.log("✅ 旧 USDT 合约已移除");
      } else {
        console.log("\n❌ 无法移除旧 USDT 合约：平台费余额不为 0");
        return;
      }
    } else {
      console.log("\n✅ 旧 USDT 合约已经被移除");
    }

    if (!newSupported) {
      console.log("\n3️⃣ 添加新的 USDT 合约");
      console.log("----------------------------------------");
      const addTx = await payment.addSupportedToken(NEW_USDT_ADDRESS);
      await addTx.wait();
      console.log("✅ 新 USDT 合约已添加");
    } else {
      console.log("\n✅ 新 USDT 合约已经被添加");
    }

    // 3. 验证最终状态
    console.log("\n4️⃣ 验证最终状态");
    console.log("----------------------------------------");
    const finalOldSupported = await payment.supportedTokens(OLD_USDT_ADDRESS);
    const finalNewSupported = await payment.supportedTokens(NEW_USDT_ADDRESS);
    
    console.log("旧 USDT 合约状态:", finalOldSupported ? "仍然支持" : "已移除");
    console.log("新 USDT 合约状态:", finalNewSupported ? "已支持" : "未支持");

    if (!finalOldSupported && finalNewSupported) {
      console.log("\n✅ USDT 合约更新成功！");
    } else {
      console.log("\n❌ USDT 合约更新可能存在问题，请检查！");
    }

  } catch (error: any) {
    console.error("\n❌ 操作过程中发生错误:");
    console.error(error.message);
    if (error.error) {
      console.error("详细错误:", error.error);
    }
  }
}

// 运行脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
