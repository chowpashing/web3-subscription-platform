import { ethers } from "hardhat";

// 已部署的合约地址
const USDT_ADDRESS = "0x3cdD5BE5b0c62F4B43DBf76F71aDb1b764cf2268";
const BOT_REGISTRY_ADDRESS = "0x25418e6f247161681D7a94912B0BA0D9e34c11ED";
const BOT_SUBSCRIPTION_ADDRESS = "0xCc54d4B377B9feACa48011436193B4DF0588B6e6";
const BOT_PAYMENT_ADDRESS = "0x59eE55A565680aAb89F3cbEb4a35ce5Aeef9D427";

async function main() {
  console.log("🚀 测试 permit 订阅...");
  
  const signers = await ethers.getSigners();
  if (signers.length < 1) {
    throw new Error("需要至少1个签名者账户");
  }
  
  const user = signers[0];
  console.log("测试账户:", user.address);
  
  try {
    // 连接合约
    const USDT = await ethers.getContractFactory("USDT");
    const usdt = USDT.attach(USDT_ADDRESS);
    
    const NewBotPayment = await ethers.getContractFactory("NewBotPayment");
    const payment = NewBotPayment.attach(BOT_PAYMENT_ADDRESS);
    
    // 检查 permit 支持
    const nonce = await usdt.nonces(user.address);
    console.log("✅ USDT 支持 permit, nonce:", nonce.toString());
    
    // 检查代币支持
    const isSupported = await payment.isTokenSupported(USDT_ADDRESS);
    console.log("USDT 支持状态:", isSupported);
    
    // 检查用户余额
    const balance = await usdt.balanceOf(user.address);
    console.log("用户 USDT 余额:", ethers.formatUnits(balance, 6));
    
    // 测试 permit 调用
    const amount = ethers.parseUnits("10", 6);
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    const domain = {
      name: "Tether USD",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: USDT_ADDRESS
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

    const value = {
      owner: user.address,
      spender: BOT_PAYMENT_ADDRESS,
      value: amount,
      nonce: nonce,
      deadline: deadline
    };

    const signature = await user.signTypedData(domain, types, value);
    const { v, r, s } = ethers.Signature.from(signature);
    
    console.log("调用 processPaymentWithPermit...");
    // 使用 any 类型来避免 TypeScript 错误
    const paymentContract = payment as any;
    const tx = await paymentContract.connect(user).processPaymentWithPermit(
      0, // botId
      USDT_ADDRESS,
      amount,
      30, // durationInDays
      deadline,
      v,
      r,
      s
    );
    
    const receipt = await tx.wait();
    console.log("✅ Permit 订阅成功!", receipt!.hash);
    
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

main().catch(console.error);
