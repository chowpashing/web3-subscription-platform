// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BotRegistry is Ownable, ReentrancyGuard {
    // 机器人结构
    struct Bot {
        string ipfsHash;      // IPFS哈希值，包含机器人的详细信息
        uint256 price;        // 价格（以USDT为单位，使用wei单位存储）
        uint256 trialTime;    // 试用时间（小时）
        string name;          // 机器人名称
        string description;   // 描述
        address developer;    // 开发者地址
        bool isActive;        // 是否激活
        uint256 createdAt;    // 创建时间
    }

    // 状态变量
    uint256 public botCount;                              // 机器人总数
    mapping(uint256 => Bot) public bots;                  // 机器人ID到机器人信息的映射
    mapping(uint256 => address) public botDevelopers;     // 机器人ID到开发者地址的映射
    mapping(string => bool) public usedIpfsHashes;        // 用于追踪已使用的IPFS哈希值

    // 事件
    event BotRegistered(
        uint256 indexed botId, 
        address indexed developer, 
        string ipfsHash,
        string name,
        uint256 price,
        uint256 trialTime
    );

    constructor() Ownable() ReentrancyGuard() {}

    // 修饰符
    modifier botExists(uint256 _botId) {
        require(_botId > 0 && _botId <= botCount, "Bot does not exist");
        _;
    }

    modifier onlyBotDeveloper(uint256 _botId) {
        require(botDevelopers[_botId] == msg.sender, "Not the bot developer");
        _;
    }

    /**
     * @dev 检查机器人是否存在
     */
    function exists(uint256 _botId) external view returns (bool) {
        return _botId > 0 && _botId <= botCount;
    }

    /**
     * @dev 注册新机器人
     * @param _ipfsHash IPFS哈希值
     * @param _price 价格（USDT）
     * @param _trialTime 试用时间（小时）
     * @param _name 机器人名称
     * @param _description 机器人描述
     */
    function registerBot(
        string memory _ipfsHash,
        uint256 _price,
        uint256 _trialTime,
        string memory _name,
        string memory _description
    ) external nonReentrant returns (uint256) {
        // 输入验证
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(!usedIpfsHashes[_ipfsHash], "IPFS hash already used");
        require(_price > 0, "Price must be greater than 0");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        // 增加机器人计数
        botCount++;
        uint256 newBotId = botCount;

        // 创建新机器人
        bots[newBotId] = Bot({
            ipfsHash: _ipfsHash,
            price: _price,
            trialTime: _trialTime,
            name: _name,
            description: _description,
            developer: msg.sender,
            isActive: true,
            createdAt: block.timestamp
        });

        // 更新映射
        botDevelopers[newBotId] = msg.sender;
        usedIpfsHashes[_ipfsHash] = true;

        // 触发事件
        emit BotRegistered(
            newBotId, 
            msg.sender, 
            _ipfsHash,
            _name,
            _price,
            _trialTime
        );

        return newBotId;
    }

    /**
     * @dev 获取机器人详细信息
     */
    function getBotDetails(uint256 _botId) 
        external 
        view 
        botExists(_botId) 
        returns (
            string memory ipfsHash,
            uint256 price,
            uint256 trialTime,
            string memory name,
            string memory description,
            address developer,
            bool isActive,
            uint256 createdAt
        ) 
    {
        Bot memory bot = bots[_botId];
        return (
            bot.ipfsHash,
            bot.price,
            bot.trialTime,
            bot.name,
            bot.description,
            bot.developer,
            bot.isActive,
            bot.createdAt
        );
    }
} 