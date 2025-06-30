import { ethers } from "hardhat";

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        console.log("部署账户:", deployer.address);

        // USDT 合约地址（已部署）
        const USDT_ADDRESS = "0x325105c248bC4683b0c1CA24a8774cFA142Cc0e0";
        console.log("USDT 合约地址:", USDT_ADDRESS);

        // 1. 部署 Registry
        console.log("\n部署 NewRegistry...");
        const Registry = await ethers.getContractFactory("NewRegistry");
        const registry = await Registry.deploy();
        await registry.waitForDeployment();
        const registryAddress = await registry.getAddress();
        console.log("NewRegistry 已部署到:", registryAddress);

        // 2. 部署 BotPayment
        console.log("\n部署 NewBotPayment...");
        const BotPayment = await ethers.getContractFactory("NewBotPayment");
        const payment = await BotPayment.deploy(
            registryAddress,
            ethers.ZeroAddress  // 临时设置为零地址
        );
        await payment.waitForDeployment();
        const paymentAddress = await payment.getAddress();
        console.log("NewBotPayment 已部署到:", paymentAddress);

        // 3. 部署 Subscription
        console.log("\n部署 NewSubscription...");
        const Subscription = await ethers.getContractFactory("NewSubscription");
        const subscription = await Subscription.deploy(
            registryAddress,
            paymentAddress
        );
        await subscription.waitForDeployment();
        const subscriptionAddress = await subscription.getAddress();
        console.log("NewSubscription 已部署到:", subscriptionAddress);

        // 4. 更新 BotPayment 中的 subscription 地址
        console.log("\n更新 BotPayment 中的 Subscription 地址...");
        const updateTx = await payment.updateSubscriptionContract(subscriptionAddress);
        await updateTx.wait();
        console.log("BotPayment 更新完成");

        // 5. 添加 USDT 到支持的代币列表
        console.log("\n添加 USDT 到支持的代币列表...");
        const addTokenTx = await payment.addSupportedToken(USDT_ADDRESS);
        await addTokenTx.wait();
        console.log("USDT 添加完成");

        // 输出所有合约地址
        console.log("\n部署完成！所有合约地址：");
        console.log({
            USDT: USDT_ADDRESS,
            Registry: registryAddress,
            BotPayment: paymentAddress,
            Subscription: subscriptionAddress
        });
        
    } catch (error) {
        console.error("部署过程中出错:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 