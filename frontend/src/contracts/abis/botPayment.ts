export const BOT_PAYMENT_ABI = [
  {
    "inputs": [
      { "name": "_botRegistry", "type": "address" },
      { "name": "_botSubscription", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "name": "_botId", "type": "uint256" },
      { "name": "_token", "type": "address" },
      { "name": "_amount", "type": "uint256" },
      { "name": "_durationInDays", "type": "uint256" }
    ],
    "name": "processPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_botId", "type": "uint256" },
      { "name": "_token", "type": "address" },
      { "name": "_amount", "type": "uint256" },
      { "name": "_durationInDays", "type": "uint256" },
      { "name": "deadline", "type": "uint256" },
      { "name": "v", "type": "uint8" },
      { "name": "r", "type": "bytes32" },
      { "name": "s", "type": "bytes32" }
    ],
    "name": "processPaymentWithPermit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_subscriber", "type": "address" },
      { "name": "_botId", "type": "uint256" }
    ],
    "name": "payments",
    "outputs": [
      { "name": "escrowBalance", "type": "uint96" },
      { "name": "startTime", "type": "uint32" },
      { "name": "status", "type": "uint8" },
      { "name": "token", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_token", "type": "address" }],
    "name": "isTokenSupported",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_botId", "type": "uint256" }
    ],
    "name": "botInfo",
    "outputs": [
      { "name": "income", "type": "uint96" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "botId", "type": "uint256" },
      { "indexed": true, "name": "subscriber", "type": "address" },
      { "indexed": true, "name": "developer", "type": "address" },
      { "indexed": false, "name": "token", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint96" },
      { "indexed": false, "name": "platformFee", "type": "uint96" }
    ],
    "name": "PaymentProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "botId", "type": "uint256" },
      { "indexed": true, "name": "subscriber", "type": "address" },
      { "indexed": false, "name": "status", "type": "uint8" }
    ],
    "name": "PaymentStatusChanged",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getPaymentToken",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
]; 