import { ethers } from "hardhat/ethers";
import { Contract } from "ethers";
import { 
  BotRegistry, 
  BotPayment, 
  BotSubscription,
  USDT
} from "../typechain-types";

async function main() {
  console.log("开始测试订阅合约...");

  // 获取测试账户
  const [owner, subscriber] = await ethers.getSigners();
  console.log("测试账户:", {
    owner: owner.address,
    subscriber: subscriber.address
  });

  // 部署合约
  console.log("\n1. 部署合约...");
  
  // 部署 USDT 合约
  const USDTFactory = await ethers.getContractFactory("USDT");
  const usdt = await USDTFactory.deploy() as unknown as USDT;
  await usdt.waitForDeployment();
  console.log("USDT 已部署到:", await usdt.getAddress());

  // 给订阅者铸造一些 USDT
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDT
  await usdt.mint(subscriber.address, mintAmount);
  console.log("已给订阅者铸造", ethers.formatUnits(mintAmount, 6), "USDT");

  // 部署 BotRegistry
  const BotRegistryFactory = await ethers.getContractFactory("BotRegistry");
  const botRegistry = await BotRegistryFactory.deploy() as unknown as BotRegistry;
  await botRegistry.waitForDeployment();
  console.log("BotRegistry 已部署到:", await botRegistry.getAddress());

  // 部署 BotSubscription
  const BotSubscriptionFactory = await ethers.getContractFactory("BotSubscription");
  const botSubscription = await BotSubscriptionFactory.deploy(
    await botRegistry.getAddress(),
    ethers.ZeroAddress // 临时地址，后面会更新
  ) as unknown as BotSubscription;
  await botSubscription.waitForDeployment();
  console.log("BotSubscription 已部署到:", await botSubscription.getAddress());

  // 部署 BotPayment
  const BotPaymentFactory = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPaymentFactory.deploy(
    await usdt.getAddress(), // USDT 合约地址
    await botRegistry.getAddress(),
    await botSubscription.getAddress()
  ) as unknown as BotPayment;
  await botPayment.waitForDeployment();
  console.log("BotPayment 已部署到:", await botPayment.getAddress());

  // 更新 BotSubscription 中的 BotPayment 地址
  await botSubscription.updatePaymentContract(await botPayment.getAddress());
  console.log("已更新 BotSubscription 中的 BotPayment 地址");

  // 注册机器人
  console.log("\n2. 注册机器人...");
  const registerTx = await botRegistry.registerBot(
    "QmTest123", // IPFS hash
    ethers.parseUnits("10", 6), // 价格 10 USDT
    1, // 试用期 1 小时
    "TestBot",
    "Test Bot Description"
  );
  const registerReceipt = await registerTx.wait();
  
  // 解析事件日志
  const botRegisteredEvent = registerReceipt?.logs.find(
    (log: any) => {
      try {
        const parsedLog = botRegistry.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        return parsedLog?.name === 'BotRegistered';
      } catch {
        return false;
      }
    }
  );
  
  const parsedLog = botRegisteredEvent ? 
    botRegistry.interface.parseLog({
      topics: botRegisteredEvent.topics,
      data: botRegisteredEvent.data
    }) : null;
    
  const botId = parsedLog?.args[0];
  console.log("机器人已注册，ID:", botId?.toString());

  // 获取机器人详情
  const botDetails = await botRegistry.getBotDetails(botId);
  console.log("机器人详情:", {
    name: botDetails.name,
    price: ethers.formatUnits(botDetails.price, 6),
    trialTime: botDetails.trialTime.toString(),
    isActive: botDetails.isActive
  });

  // 订阅机器人
  console.log("\n3. 订阅机器人...");
  
  // 先授权 BotPayment 合约使用 USDT
  const approveAmount = ethers.parseUnits("10", 6); // 10 USDT
  await usdt.connect(subscriber).approve(await botPayment.getAddress(), approveAmount);
  console.log("已授权 BotPayment 合约使用 USDT");

  // 进行订阅
  const subscribeTx = await botPayment.connect(subscriber).processPayment(
    botId,
    ethers.parseUnits("10", 6), // 支付 10 USDT
    30 // 订阅 30 天
  );
  await subscribeTx.wait();
  console.log("订阅成功");

  // 获取订阅详情
  const subscription = await botSubscription.getSubscription(subscriber.address, botId);
  console.log("订阅详情:", {
    startTime: new Date(Number(subscription.startTime) * 1000).toLocaleString(),
    endTime: new Date(Number(subscription.endTime) * 1000).toLocaleString(),
    trialEndTime: new Date(Number(subscription.trialEndTime) * 1000).toLocaleString(),
    status: subscription.status
  });

  // 检查试用期状态
  const isTrial = await botSubscription.isTrialActive(subscriber.address, botId);
  console.log("是否在试用期内:", isTrial);

  // 检查订阅状态
  const isActive = await botSubscription.isActive(subscriber.address, botId);
  console.log("订阅是否激活:", isActive);

  // 检查托管余额
  const escrowBalance = await botPayment.getEscrowBalance(subscriber.address, botId);
  console.log("托管余额:", ethers.formatUnits(escrowBalance, 6), "USDT");

  // 检查支付状态
  const paymentStatus = await botPayment.getPaymentStatus(subscriber.address, botId);
  console.log("支付状态:", paymentStatus);

  // 等待一段时间（在真实环境中，这里需要等待）
  console.log("\n4. 等待试用期结束...");
  console.log("注意：在真实环境中，这里需要等待试用期结束");
  console.log("在测试脚本中，我们直接检查试用期状态");

  // 再次检查试用期状态
  const isTrialAfter = await botSubscription.isTrialActive(subscriber.address, botId);
  console.log("试用期结束后状态:", isTrialAfter);

  // 尝试取消订阅
  console.log("\n5. 尝试取消订阅...");
  try {
    const cancelTx = await botSubscription.connect(subscriber).cancel(botId);
    await cancelTx.wait();
    console.log("取消订阅成功");

    // 检查取消后的状态
    console.log("\n6. 检查取消后的状态...");
    
    // 检查订阅状态
    const subscriptionAfter = await botSubscription.getSubscription(subscriber.address, botId);
    console.log("取消后的订阅详情:", {
      startTime: new Date(Number(subscriptionAfter.startTime) * 1000).toLocaleString(),
      endTime: new Date(Number(subscriptionAfter.endTime) * 1000).toLocaleString(),
      trialEndTime: new Date(Number(subscriptionAfter.trialEndTime) * 1000).toLocaleString(),
      status: subscriptionAfter.status
    });

    // 检查试用期状态
    const isTrialAfter = await botSubscription.isTrialActive(subscriber.address, botId);
    console.log("取消后是否在试用期内:", isTrialAfter);

    // 检查订阅是否激活
    const isActiveAfter = await botSubscription.isActive(subscriber.address, botId);
    console.log("取消后订阅是否激活:", isActiveAfter);

    // 检查托管余额
    const escrowBalanceAfter = await botPayment.getEscrowBalance(subscriber.address, botId);
    console.log("取消后托管余额:", ethers.formatUnits(escrowBalanceAfter, 6), "USDT");

    // 检查支付状态
    const paymentStatusAfter = await botPayment.getPaymentStatus(subscriber.address, botId);
    console.log("取消后支付状态:", paymentStatusAfter);

  } catch (error) {
    console.log("取消订阅失败:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n测试完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 