export const BOT_PAYMENT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_usdtToken", "type": "address" },
      { "internalType": "address", "name": "_botRegistry", "type": "address" },
      { "internalType": "address", "name": "_botSubscription", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "address", "name": "developer", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "BalanceWithdrawn", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "botId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "subscriber", "type": "address" }, { "indexed": false, "internalType": "address", "name": "developer", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "platformFee", "type": "uint256" } ], "name": "PaymentProcessed", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "botId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "subscriber", "type": "address" }, { "indexed": false, "internalType": "enum BotPayment.PaymentStatus", "name": "status", "type": "uint8" } ], "name": "PaymentStatusChanged", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "oldFee", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newFee", "type": "uint256" } ], "name": "PlatformFeeUpdated", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "botId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "subscriber", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "RefundProcessed", "type": "event" },
  { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "botIncome", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "botRegistry", "outputs": [ { "internalType": "contract BotRegistry", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "botSubscription", "outputs": [ { "internalType": "contract BotSubscription", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "developerBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "escrowBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "_subscriber", "type": "address" }, { "internalType": "uint256", "name": "_botId", "type": "uint256" } ], "name": "finalizePayment", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "_subscriber", "type": "address" }, { "internalType": "uint256", "name": "_botId", "type": "uint256" } ], "name": "getEscrowBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "_subscriber", "type": "address" }, { "internalType": "uint256", "name": "_botId", "type": "uint256" } ], "name": "getPaymentStatus", "outputs": [ { "internalType": "enum BotPayment.PaymentStatus", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getPaymentToken", "outputs": [ { "internalType": "contract IERC20", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "paymentStatus", "outputs": [ { "internalType": "enum BotPayment.PaymentStatus", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "platformFeePercent", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "_botId", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint256", "name": "_durationInDays", "type": "uint256" } ], "name": "processPayment", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "_botId", "type": "uint256" }, { "internalType": "address", "name": "_subscriber", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" } ], "name": "processRefund", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "_newFee", "type": "uint256" } ], "name": "updatePlatformFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "usdtToken", "outputs": [ { "internalType": "contract IERC20", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "withdrawBalance", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
]; 