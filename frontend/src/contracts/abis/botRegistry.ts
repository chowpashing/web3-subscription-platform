export const BOT_REGISTRY_ABI = [
  {
    inputs: [
      { name: "_ipfsHash", type: "string" },
      { name: "_price", type: "uint256" },
      { name: "_trialTime", type: "uint256" },
      { name: "_name", type: "string" }
    ],
    name: "registerBot",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "_botId", type: "uint256" }],
    name: "getBotDetails",
    outputs: [
      { name: "ipfsHash", type: "string" },
      { name: "price", type: "uint96" },
      { name: "trialTime", type: "uint32" },
      { name: "name", type: "string" },
      { name: "developer", type: "address" },
      { name: "isActive", type: "bool" },
      { name: "exists", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "_botId", type: "uint256" },
      { name: "_isActive", type: "bool" }
    ],
    name: "setBotStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "_address", type: "address" }],
    name: "checkDeveloper",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
]; 