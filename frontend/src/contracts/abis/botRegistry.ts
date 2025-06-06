export const BOT_REGISTRY_ABI = [
  {
    inputs: [{ name: "botId", type: "uint256" }],
    name: "getBotDetails",
    outputs: [
      { name: "ipfsHash", type: "string" },
      { name: "price", type: "uint256" },
      { name: "trialTime", type: "uint256" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "developer", type: "address" },
      { name: "isActive", type: "bool" },
      { name: "createdAt", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
]; 