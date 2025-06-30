import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Bot Payment and Subscription Test", function () {
  let usdt: any;
  let registry: any;
  let payment: any;
  let subscription: any;
  let owner: HardhatEthersSigner;
  let developer: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let botId: bigint;

  const INITIAL_MINT = BigInt(1000_000_000); // 1000 USDT (6位小数)
  const BOT_PRICE = BigInt(1_000_000); // 1 USDT
  const TRIAL_PERIOD = 24; // 24 hours
  const BOT_NAME = "Test Bot";
  const IPFS_HASH = "QmTest123";

  beforeEach(async function () {
    // 获取测试账户
    [owner, developer, user] = await ethers.getSigners();

    // 部署合约
    const USDT = await ethers.getContractFactory("USDT");
    usdt = await USDT.deploy();
    await usdt.waitForDeployment();

    const Registry = await ethers.getContractFactory("NewRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    const Subscription = await ethers.getContractFactory("NewSubscription");
    subscription = await Subscription.deploy(await registry.getAddress(), ethers.ZeroAddress);
    await subscription.waitForDeployment();

    const Payment = await ethers.getContractFactory("NewBotPayment");
    payment = await Payment.deploy(
      await usdt.getAddress(),
      await registry.getAddress(),
      await subscription.getAddress()
    );
    await payment.waitForDeployment();

    // 更新订阅合约中的支付合约地址
    await subscription.updatePaymentContract(await payment.getAddress());

    // 铸造一些USDT给用户
    await usdt.mint(user.address, INITIAL_MINT);

    // 注册一个测试机器人
    const tx = await registry.connect(developer).registerBot(
      IPFS_HASH,
      BOT_PRICE,
      TRIAL_PERIOD,
      BOT_NAME
    );
    const receipt = await tx.wait();
    // 从事件中获取botId
    const event = receipt.logs.find((log: any) => 
      log.fragment && log.fragment.name === "BotRegistered"
    );
    botId = event.args[0];
  });

  it("应该能够成功完成90天的订阅流程", async function () {
    const durationInDays = 90;
    const amount = BOT_PRICE * BigInt(3); // 3个月 = 3 USDT

    // 1. 检查用户USDT余额
    const initialBalance = await usdt.balanceOf(user.address);
    expect(initialBalance).to.equal(INITIAL_MINT);

    // 2. 授权支付合约使用USDT
    await usdt.connect(user).approve(await payment.getAddress(), amount);
    const allowance = await usdt.allowance(user.address, await payment.getAddress());
    expect(allowance).to.equal(amount);

    // 3. 处理支付
    await payment.connect(user).processPayment(botId, amount, durationInDays);

    // 4. 验证支付状态
    const paymentStatus = await payment.getPaymentStatus(user.address, botId);
    expect(paymentStatus).to.equal(1); // PENDING

    // 5. 验证托管余额
    const escrowBalance = await payment.getEscrowBalance(user.address, botId);
    expect(escrowBalance).to.equal(amount);

    // 6. 检查订阅状态
    const subDetails = await subscription.getSubscription(user.address, botId);
    expect(subDetails[4]).to.equal(0); // status = TRIAL
    
    // 7. 验证订阅时间
    const now = Math.floor(Date.now() / 1000);
    expect(Number(subDetails[0])).to.be.closeTo(now, 20); // startTime
    expect(Number(subDetails[1])).to.be.closeTo(now + (durationInDays * 24 * 60 * 60), 20); // endTime
    expect(Number(subDetails[2])).to.be.closeTo(now + (TRIAL_PERIOD * 60 * 60), 20); // trialEndTime

    // 8. 检查是否处于活跃状态
    const isActive = await subscription.isActive(user.address, botId);
    expect(isActive).to.be.true;

    // 9. 检查是否处于试用期
    const isTrialActive = await subscription.isTrialActive(user.address, botId);
    expect(isTrialActive).to.be.true;

    console.log("订阅测试通过，关键数据：");
    console.log("Bot ID:", botId.toString());
    console.log("订阅时长:", durationInDays, "天");
    console.log("支付金额:", Number(amount) / 1_000_000, "USDT");
    console.log("开始时间:", new Date(Number(subDetails[0]) * 1000).toISOString());
    console.log("结束时间:", new Date(Number(subDetails[1]) * 1000).toISOString());
    console.log("试用期结束时间:", new Date(Number(subDetails[2]) * 1000).toISOString());
  });

  it("应该能够成功完成30天的订阅流程", async function () {
    const durationInDays = 30;
    const amount = BOT_PRICE; // 1个月 = 1 USDT

    // 1. 授权支付合约使用USDT
    await usdt.connect(user).approve(await payment.getAddress(), amount);

    // 2. 处理支付
    await payment.connect(user).processPayment(botId, amount, durationInDays);

    // 3. 验证订阅状态
    const subDetails = await subscription.getSubscription(user.address, botId);
    expect(subDetails[4]).to.equal(0); // status = TRIAL

    // 4. 验证订阅时间
    const now = Math.floor(Date.now() / 1000);
    expect(Number(subDetails[1])).to.be.closeTo(now + (durationInDays * 24 * 60 * 60), 20);

    console.log("30天订阅测试通过");
  });

  it("应该能够使用permit功能完成订阅", async function () {
    const durationInDays = 30;
    const amount = BOT_PRICE;
    
    // 获取用户的nonce
    const nonce = await usdt.nonces(user.address);
    
    // 获取deadline（当前时间 + 1小时）
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    
    // 获取域分隔符
    const domainSeparator = await usdt.DOMAIN_SEPARATOR();
    
    // 创建permit签名
    const domain = {
      name: "Tether USD",
      version: "1",
      chainId: BigInt((await ethers.provider.getNetwork()).chainId),
      verifyingContract: await usdt.getAddress()
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
      spender: await payment.getAddress(),
      value: amount,
      nonce: nonce,
      deadline: deadline
    };
    
    // 签名
    const signature = await user.signTypedData(domain, types, value);
    const { v, r, s } = ethers.Signature.from(signature);
    
    // 使用permit进行支付
    await payment.connect(user).processPaymentWithPermit(
      botId,
      amount,
      durationInDays,
      deadline,
      v,
      r,
      s
    );
    
    // 验证订阅状态
    const isActive = await subscription.isActive(user.address, botId);
    expect(isActive).to.be.true;
    
    console.log("Permit订阅测试通过");
  });
});
