export const SUBSCRIPTION_ABI = [
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "botId", type: "uint256" },
      { name: "durationInDays", type: "uint256" }
    ],
    name: "subscribeFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "botId", type: "uint256" }
    ],
    name: "getSubscription",
    outputs: [
      { name: "startTime", type: "uint32" },
      { name: "endTime", type: "uint32" },
      { name: "trialEndTime", type: "uint32" },
      { name: "lastPayment", type: "uint32" },
      { name: "status", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "botId", type: "uint256" }],
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
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "botId", type: "uint256" }
    ],
    name: "isActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
]; 