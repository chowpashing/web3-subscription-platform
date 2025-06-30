// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NewRegistry is Ownable, ReentrancyGuard {
    // Optimized struct layout to reduce storage slots
    struct Bot {
        address developer;  // 20 bytes
        bool isActive;      // 1 byte
        uint96 price;       // Reduced from uint256 to uint96 (enough for USDT)
        uint32 trialTime;   // Reduced from uint256 to uint32 (enough for hours)
        string ipfsHash;    // dynamic
        string name;        // dynamic
    }
    
    // Bot ID counter
    uint256 private _nextBotId;
    
    // Bot mapping
    mapping(uint256 => Bot) public bots;
    
    // Developer address mapping
    mapping(address => bool) public isDeveloper;

    // Events with indexed parameters for better filtering
    event BotRegistered(
        uint256 indexed botId,
        address indexed developer,
        string ipfsHash
    );
    event BotUpdated(
        uint256 indexed botId,
        string ipfsHash,
        uint96 price,
        uint32 trialTime
    );
    event BotStatusChanged(
        uint256 indexed botId,
        bool isActive
    );
    event BotStatusUpdated(
        uint256 indexed botId,
        bool isActive
    );

    constructor() {}

    // Register bot
    function registerBot(
        string calldata _ipfsHash,
        uint256 _price,
        uint256 _trialTime,
        string calldata _name
    ) external nonReentrant returns (uint256) {
        // Use unchecked to optimize counter
        uint256 botId;
        unchecked {
            botId = _nextBotId++;
        }
        
        // Set all values at once
        bots[botId] = Bot({
            developer: msg.sender,
            isActive: true,
            price: uint96(_price),
            trialTime: uint32(_trialTime),
            ipfsHash: _ipfsHash,
            name: _name
        });

        isDeveloper[msg.sender] = true;

        emit BotRegistered(botId, msg.sender, _ipfsHash);
        return botId;
    }

    // Change bot status
    function setBotStatus(uint256 _botId, bool _isActive) external nonReentrant {
        Bot storage bot = bots[_botId];
        require(bot.developer == msg.sender, "Not the bot developer");
        bot.isActive = _isActive;
        emit BotStatusChanged(_botId, _isActive);
    }

    // Update bot active status
    function updateBotStatus(
        uint256 _botId,
        bool _isActive
    ) external nonReentrant {
        Bot storage bot = bots[_botId];
        require(bot.developer == msg.sender, "Not the bot developer");
        bot.isActive = _isActive;
        emit BotStatusUpdated(_botId, _isActive);
    }

    // Get bot details
    function getBotDetails(uint256 _botId) external view returns (
        string memory ipfsHash,
        uint96 price,
        uint32 trialTime,
        string memory name,
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
            developer = bot.developer;
            isActive = bot.isActive;
        }
    }

    // Check if address is a developer
    function checkDeveloper(address _address) external view returns (bool) {
        return isDeveloper[_address];
    }
}
