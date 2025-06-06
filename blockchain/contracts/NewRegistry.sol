// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract NewRegistry is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct Bot {
        address developer;  // 20 bytes
        bool isActive;      // 1 byte
        uint256 price;      // 32 bytes
        uint256 trialTime;  // 32 bytes
        string ipfsHash;    // dynamic
        string name;        // dynamic
        string description; // dynamic
    }

    // Signer address
    address public signer;
    
    // Record used signatures
    mapping(bytes => bool) public usedSignatures;
    
    // Bot ID counter
    uint256 private _nextBotId;
    
    // Bot mapping
    mapping(uint256 => Bot) public bots;
    
    // Developer address mapping
    mapping(address => bool) public isDeveloper;

    // Events
    event SignerUpdated(address indexed newSigner);
    event BotRegistered(uint256 indexed botId, address indexed developer, string ipfsHash);
    event BotUpdated(uint256 indexed botId, string ipfsHash, uint256 price, uint256 trialTime);
    event BotStatusChanged(uint256 indexed botId, bool isActive);

    constructor(address _signer) {
        require(_signer != address(0), "Invalid signer address");
        signer = _signer;
    }

    // Update signer address
    function updateSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        signer = _newSigner;
        emit SignerUpdated(_newSigner);
    }

    // Verify signature
    function verifySignature(
        address _developer,
        bytes calldata _signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(abi.encode(_developer));
        return messageHash.toEthSignedMessageHash().recover(_signature) == signer;
    }

    // Register bot
    function registerBot(
        string calldata _ipfsHash,
        uint256 _price,
        uint256 _trialTime,
        string calldata _name,
        string calldata _description,
        bytes calldata _signature
    ) external nonReentrant returns (uint256) {
        // Check signature first to avoid unnecessary storage operations
        require(!usedSignatures[_signature], "Signature already used");
        require(verifySignature(msg.sender, _signature), "Invalid signature");
        
        // Use unchecked to optimize counter
        uint256 botId;
        unchecked {
            botId = _nextBotId++;
        }
        
        // Set all values at once
        bots[botId] = Bot({
            developer: msg.sender,
            isActive: true,
            price: _price,
            trialTime: _trialTime,
            ipfsHash: _ipfsHash,
            name: _name,
            description: _description
        });

        // Mark signature as used
        usedSignatures[_signature] = true;
        isDeveloper[msg.sender] = true;

        emit BotRegistered(botId, msg.sender, _ipfsHash);
        return botId;
    }

    // Update bot information
    function updateBot(
        uint256 _botId,
        string calldata _ipfsHash,
        uint256 _price,
        uint256 _trialTime
    ) external nonReentrant {
        require(bots[_botId].developer == msg.sender, "Not the bot developer");
        require(bots[_botId].isActive, "Bot is not active");

        bots[_botId].ipfsHash = _ipfsHash;
        bots[_botId].price = _price;
        bots[_botId].trialTime = _trialTime;

        emit BotUpdated(_botId, _ipfsHash, _price, _trialTime);
    }

    // Change bot status
    function setBotStatus(uint256 _botId, bool _isActive) external nonReentrant {
        require(bots[_botId].developer == msg.sender, "Not the bot developer");
        bots[_botId].isActive = _isActive;
        emit BotStatusChanged(_botId, _isActive);
    }

    // Get bot details
    function getBotDetails(uint256 _botId) external view returns (
        string memory ipfsHash,
        uint256 price,
        uint256 trialTime,
        string memory name,
        string memory description,
        address developer,
        bool isActive,
        bool exists
    ) {
        Bot storage bot = bots[_botId];
        exists = bot.developer != address(0);
        if (exists) {
            ipfsHash = bot.ipfsHash;
            price = bot.price;
            trialTime = bot.trialTime;
            name = bot.name;
            description = bot.description;
            developer = bot.developer;
            isActive = bot.isActive;
        }
    }

    // Check if address is a developer
    function checkDeveloper(address _address) external view returns (bool) {
        return isDeveloper[_address];
    }
}
