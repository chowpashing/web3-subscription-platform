export const SUBSCRIPTION_ABI = [
  {
    inputs: [
      { name: "botId", type: "uint256" },
      { name: "durationInDays", type: "uint256" },
      { name: "autoRenew", type: "bool" }
    ],
    name: "subscribe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "subscriber", type: "address" },
      { indexed: true, name: "botId", type: "uint256" },
      { indexed: false, name: "startTime", type: "uint256" },
      { indexed: false, name: "endTime", type: "uint256" },
    ],
    name: "Subscribed",
    type: "event",
  },
  {
    inputs: [
      { name: "botId", type: "uint256" }
    ],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "botId", type: "uint256" }
    ],
    name: "isTrialActive",
    outputs: [
      { name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "botId", type: "uint256" }
    ],
    name: "getSubscription",
    outputs: [
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "trialEndTime", type: "uint256" },
      { name: "lastPayment", type: "uint256" },
      { name: "status", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  }
]; 