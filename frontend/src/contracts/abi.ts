export const BOT_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "botId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "developer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string" }
    ],
    "name": "BotRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "botId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "indexed": false, "internalType": "uint96", "name": "price", "type": "uint96" },
      { "indexed": false, "internalType": "uint32", "name": "trialTime", "type": "uint32" }
    ],
    "name": "BotUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "botId", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "name": "BotStatusChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "botId", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "name": "BotStatusUpdated",
    "type": "event"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "name": "bots",
    "outputs": [
      { "internalType": "address", "name": "developer", "type": "address" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "uint96", "name": "price", "type": "uint96" },
      { "internalType": "uint32", "name": "trialTime", "type": "uint32" },
      { "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "", "type": "address" } ],
    "name": "isDeveloper",
    "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_ipfsHash", "type": "string" },
      { "internalType": "uint256", "name": "_price", "type": "uint256" },
      { "internalType": "uint256", "name": "_trialTime", "type": "uint256" },
      { "internalType": "string", "name": "_name", "type": "string" }
    ],
    "name": "registerBot",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "_botId", "type": "uint256" }, { "internalType": "bool", "name": "_isActive", "type": "bool" } ],
    "name": "setBotStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "_botId", "type": "uint256" }, { "internalType": "bool", "name": "_isActive", "type": "bool" } ],
    "name": "updateBotStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "_botId", "type": "uint256" } ],
    "name": "getBotDetails",
    "outputs": [
      { "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "internalType": "uint96", "name": "price", "type": "uint96" },
      { "internalType": "uint32", "name": "trialTime", "type": "uint32" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "address", "name": "developer", "type": "address" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "bool", "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "_address", "type": "address" } ],
    "name": "checkDeveloper",
    "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ],
    "stateMutability": "view",
    "type": "function"
  }
]; 