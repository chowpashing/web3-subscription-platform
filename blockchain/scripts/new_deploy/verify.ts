import { run } from "hardhat";

async function verifyContract(address: string, args: any[]) {
    try {
        await run("verify:verify", {
            address: address,
            constructorArguments: args,
        });
        console.log(`合约 ${address} 验证成功`);
    } catch (error: any) {
        if (error.message.includes("Already Verified")) {
            console.log(`合约 ${address} 已经验证过了`);
        } else {
            console.error(`合约 ${address} 验证失败:`, error);
        }
    }
}

async function main() {
    // 这里填入部署后得到的地址
    const addresses = {
        USDT: "",           // USDT 合约地址
        Registry: "",       // Registry 合约地址
        BotPayment: "",     // BotPayment 合约地址
        Subscription: "",   // Subscription 合约地址
    };

    const deployerAddress = ""; // 部署者地址

    try {
        // 验证 USDT
        await verifyContract(addresses.USDT, []);

        // 验证 Registry
        await verifyContract(addresses.Registry, [deployerAddress]);

        // 验证 BotPayment
        await verifyContract(addresses.BotPayment, [
            addresses.USDT,
            addresses.Registry,
            addresses.Subscription
        ]);

        // 验证 Subscription
        await verifyContract(addresses.Subscription, [
            addresses.Registry,
            addresses.BotPayment
        ]);

        console.log("所有合约验证完成");
    } catch (error) {
        console.error("验证过程中出错:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 