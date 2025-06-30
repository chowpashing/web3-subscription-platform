import { ethers } from "hardhat";

// Registry 合约地址
const NEW_BOT_REGISTRY_CONTRACT_ADDRESS = '0x9c8115d29B88373393C892dF3B8E0fd4927882B5';

async function main() {
  try {
    console.log("开始检查机器人状态...");
    
    // 获取合约实例
    const registryContract = await ethers.getContractAt(
      "NewRegistry",
      NEW_BOT_REGISTRY_CONTRACT_ADDRESS
    );

    // 检查多个ID的机器人状态
    for (let i = 0; i < 10; i++) {
      try {
        console.log(`\n检查 Bot ID ${i}:`);
        const botDetails = await registryContract.getBotDetails(i);
        
        const price = botDetails[1].toString();
        const formattedPrice = ethers.formatUnits(price, 6);
        
        console.log('链上状态:', {
          ipfsHash: botDetails[0],
          price: formattedPrice + " USDT",
          trialTime: botDetails[2].toString() + " hours",
          name: botDetails[3],
          developer: botDetails[4],
          isActive: botDetails[5],
          exists: botDetails[6]
        });

        if (!botDetails[6]) {
          console.log(`Bot ID ${i} 在链上不存在`);
          continue;
        }

        if (!botDetails[5]) {
          console.log(`Bot ID ${i} 未激活`);
          continue;
        }

        console.log(`Bot ID ${i} 状态正常`);
      } catch (error) {
        console.error(`检查 Bot ID ${i} 时出错:`, error);
      }
    }
  } catch (error) {
    console.error("脚本执行失败:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
