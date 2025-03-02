const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentProcessor", function () {
  let paymentProcessor;
  let usdt;
  let owner;
  let user;
  const refundPeriod = 3600; // 1 hour in seconds

  beforeEach(async function () {
    // Deploy mock USDT token
    const MockToken = await ethers.getContractFactory("MockUSDT");
    usdt = await MockToken.deploy();
    await usdt.waitForDeployment();

    // Deploy PaymentProcessor
    const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
    paymentProcessor = await PaymentProcessor.deploy(await usdt.getAddress(), refundPeriod);
    await paymentProcessor.waitForDeployment();

    [owner, user] = await ethers.getSigners();

    // Mint some USDT to user
    await usdt.mint(user.address, ethers.parseUnits("1000", 6));
    // Approve PaymentProcessor to spend user's USDT
    await usdt.connect(user).approve(await paymentProcessor.getAddress(), ethers.parseUnits("1000", 6));
  });

  describe("Payment Functions", function () {
    it("Should make payment successfully", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(paymentProcessor.connect(user).makePayment(amount))
        .to.emit(paymentProcessor, "PaymentReceived")
        .withArgs(user.address, amount, await ethers.provider.getBlock().then(b => b.timestamp));

      const paymentCount = await paymentProcessor.getPaymentCount(user.address);
      expect(paymentCount).to.equal(1);

      const payment = await paymentProcessor.getPaymentDetails(user.address, 0);
      expect(payment.amount).to.equal(amount);
      expect(payment.refunded).to.be.false;
    });

    it("Should refund payment within refund period", async function () {
      const amount = ethers.parseUnits("100", 6);
      await paymentProcessor.connect(user).makePayment(amount);

      await expect(paymentProcessor.connect(user).requestRefund(0))
        .to.emit(paymentProcessor, "RefundProcessed")
        .withArgs(user.address, amount, await ethers.provider.getBlock().then(b => b.timestamp));

      const payment = await paymentProcessor.getPaymentDetails(user.address, 0);
      expect(payment.refunded).to.be.true;
    });

    it("Should not refund after refund period", async function () {
      const amount = ethers.parseUnits("100", 6);
      await paymentProcessor.connect(user).makePayment(amount);

      // Increase time beyond refund period
      await ethers.provider.send("evm_increaseTime", [refundPeriod + 1]);
      await ethers.provider.send("evm_mine");

      await expect(paymentProcessor.connect(user).requestRefund(0))
        .to.be.revertedWith("Refund period has expired");
    });

    it("Should not refund twice", async function () {
      const amount = ethers.parseUnits("100", 6);
      await paymentProcessor.connect(user).makePayment(amount);
      await paymentProcessor.connect(user).requestRefund(0);

      await expect(paymentProcessor.connect(user).requestRefund(0))
        .to.be.revertedWith("Payment already refunded");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set refund period", async function () {
      const newPeriod = 7200; // 2 hours
      await paymentProcessor.connect(owner).setRefundPeriod(newPeriod);
      expect(await paymentProcessor.refundPeriod()).to.equal(newPeriod);
    });

    it("Should not allow non-owner to set refund period", async function () {
      const newPeriod = 7200;
      await expect(paymentProcessor.connect(user).setRefundPeriod(newPeriod))
        .to.be.revertedWith("Only owner can set refund period");
    });
  });
});