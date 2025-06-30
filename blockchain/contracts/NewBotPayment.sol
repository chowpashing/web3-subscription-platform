// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

import "./NewRegistry.sol";
import "./NewSubscription.sol";

contract NewBotPayment is Ownable, ReentrancyGuard {
    // 代币白名单映射
    mapping(address => bool) public supportedTokens;
    NewRegistry public immutable botRegistry;
    NewSubscription public botSubscription;

    // 常量
    uint16 public immutable MAX_PLATFORM_FEE = 2000; // 20%
    uint16 public platformFeePercent = 1000; // 默认平台费用 10%
    mapping(address => uint32) public platformFeeBalance; // 按代币跟踪平台费用

    // 状态常量
    uint8 constant NONE = 0;
    uint8 constant PENDING = 1;
    uint8 constant COMPLETED = 2;
    uint8 constant REFUNDED = 3;

    // 优化后的结构体
    struct PaymentInfo {
        uint96 escrowBalance;  // 代币余额
        uint32 startTime;      // 开始时间
        uint8 status;          // 支付状态
        address token;         // 使用的代币地址
    }

    struct BotInfo {
        uint96 income;         // 机器人收入（按主要代币计）
    }

    // 存储映射
    mapping(address => mapping(uint256 => PaymentInfo)) public payments;
    mapping(uint256 => BotInfo) public botInfo;

    // 事件
    event PaymentProcessed(
        uint256 indexed botId,
        address indexed subscriber,
        address indexed developer,
        address token,
        uint96 amount,
        uint96 platformFee
    );
    event RefundProcessed(
        uint256 indexed botId,
        address indexed subscriber,
        address token,
        uint96 amount
    );
    event PlatformFeeUpdated(uint16 oldFee, uint16 newFee);
    event PaymentStatusChanged(
        uint256 indexed botId,
        address indexed subscriber,
        uint8 status
    );
    event PlatformFeeWithdrawn(address indexed token, uint32 amount);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    constructor(address _botRegistry, address _botSubscription) {
        botRegistry = NewRegistry(_botRegistry);
        botSubscription = NewSubscription(_botSubscription);
    }

    // 添加支持的代币（仅管理员）
    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token], "Token already supported");
        supportedTokens[_token] = true;
        emit TokenAdded(_token);
    }

    // 移除支持的代币（仅管理员）
    function removeSupportedToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "Token not supported");
        require(platformFeeBalance[_token] == 0, "Withdraw fees first");
        supportedTokens[_token] = false;
        emit TokenRemoved(_token);
    }

    // 获取支持的代币列表（视图函数，需外部实现）
    function isTokenSupported(address _token) external view returns (bool) {
        return supportedTokens[_token];
    }

    function processPayment(uint256 _botId, address _token, uint256 _amount, uint256 _durationInDays) external nonReentrant {
        require(_amount > 0, "Invalid payment amount");
        require(supportedTokens[_token], "Unsupported token");

        // 使用存储指针减少存储读取
        PaymentInfo storage payment = payments[msg.sender][_botId];

        // 获取机器人详情
        (
            , // ipfsHash
            , // price
            , // trialTime
            , // name
            address developer,
            bool isActive,
            bool exists
        ) = botRegistry.getBotDetails(_botId);

        unchecked {
            require(exists && isActive, "Bot is not active");
        }

        // 使用指定的代币合约
        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount), "Payment transfer failed");

        // 更新存储
        payment.escrowBalance = uint96(_amount);
        payment.status = PENDING;
        payment.startTime = uint32(block.timestamp);
        payment.token = _token;

        // 自动注册订阅
        botSubscription.subscribeFor(msg.sender, _botId, _durationInDays);

        emit PaymentProcessed(_botId, msg.sender, developer, _token, uint96(_amount), 0);
        emit PaymentStatusChanged(_botId, msg.sender, PENDING);
    }

    function processPaymentWithPermit(
        uint256 _botId,
        address _token,
        uint256 _amount,
        uint256 _durationInDays,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        require(_amount > 0, "Invalid payment amount");
        require(supportedTokens[_token], "Unsupported token");

        // 使用存储指针减少存储读取
        PaymentInfo storage payment = payments[msg.sender][_botId];

        // 获取机器人详情
        (
            , // ipfsHash
            , // price
            , // trialTime
            , // name
            address developer,
            bool isActive,
            bool exists
        ) = botRegistry.getBotDetails(_botId);

        unchecked {
            require(exists && isActive, "Bot is not active");
        }

        // 使用指定的代币合约
        IERC20Permit tokenPermit = IERC20Permit(_token);
        IERC20 token = IERC20(_token);
        tokenPermit.permit(msg.sender, address(this), _amount, deadline, v, r, s);
        require(token.transferFrom(msg.sender, address(this), _amount), "Payment transfer failed");

        // 更新存储
        payment.escrowBalance = uint96(_amount);
        payment.status = PENDING;
        payment.startTime = uint32(block.timestamp);
        payment.token = _token;

        // 自动注册订阅
        botSubscription.subscribeFor(msg.sender, _botId, _durationInDays);

        emit PaymentProcessed(_botId, msg.sender, developer, _token, uint96(_amount), 0);
        emit PaymentStatusChanged(_botId, msg.sender, PENDING);
    }

    function processRefund(uint256 _botId, address _subscriber, uint256 _amount) external nonReentrant {
        require(msg.sender == address(botSubscription), "Only subscription contract can call refund");
        require(_amount > 0, "Invalid refund amount");

        // 使用存储指针
        PaymentInfo storage payment = payments[_subscriber][_botId];
        require(payment.escrowBalance >= _amount, "Insufficient escrow balance");
        require(payment.status == PENDING, "Payment not in pending status");
        require(botSubscription.isTrialActive(_subscriber, _botId), "Trial period ended");

        // 获取代币地址
        address token = payment.token;
        require(supportedTokens[token], "Unsupported token");

        unchecked {
            payment.escrowBalance -= uint96(_amount);
        }
        payment.status = REFUNDED;

        // 使用指定的代币合约退款
        require(IERC20(token).transfer(_subscriber, _amount), "Refund transfer failed");

        emit RefundProcessed(_botId, _subscriber, token, uint96(_amount));
        emit PaymentStatusChanged(_botId, _subscriber, REFUNDED);
    }

    function finalizePayment(address _subscriber, uint256 _botId) external onlyOwner nonReentrant {
        // 使用存储指针
        PaymentInfo storage payment = payments[_subscriber][_botId];
        require(payment.escrowBalance > 0, "No escrow balance");
        require(payment.status == PENDING, "Payment not in pending status");

        // 获取机器人详情
        (
            , // ipfsHash
            , // price
            uint256 trialTime,
            , // name
            address developer,
            , // isActive
            bool exists
        ) = botRegistry.getBotDetails(_botId);
        require(exists && developer != address(0), "Invalid developer address");

        unchecked {
            require(block.timestamp >= payment.startTime + trialTime, "Trial period not ended");
        }

        uint96 amount = payment.escrowBalance;
        uint96 fee;
        uint96 developerShare;
        address token = payment.token;
        require(supportedTokens[token], "Unsupported token");

        unchecked {
            fee = uint96((amount * platformFeePercent) / 10000);
            developerShare = amount - fee;
        }

        // 批量更新状态
        payment.escrowBalance = 0;
        payment.status = COMPLETED;

        BotInfo storage info = botInfo[_botId];
        info.income += amount; // 假设收入以主要代币计，或需转换

        // 转账给开发者并累积平台费用
        platformFeeBalance[token] += uint32(fee);
        require(IERC20(token).transfer(developer, developerShare), "Transfer to developer failed");

        emit PaymentProcessed(_botId, _subscriber, developer, token, amount, fee);
        emit PaymentStatusChanged(_botId, _subscriber, COMPLETED);
    }

    function withdrawPlatformFee(address _token) external onlyOwner nonReentrant {
        require(supportedTokens[_token], "Unsupported token");
        require(platformFeeBalance[_token] > 0, "No platform fee to withdraw");
        uint32 amount = platformFeeBalance[_token];
        platformFeeBalance[_token] = 0; // 先清零防止重入
        require(IERC20(_token).transfer(owner(), amount), "Transfer platform fee failed");
        emit PlatformFeeWithdrawn(_token, amount);
    }

    function updatePlatformFee(uint16 _newFee) external onlyOwner {
        require(_newFee <= MAX_PLATFORM_FEE, "Too high");
        emit PlatformFeeUpdated(platformFeePercent, _newFee);
        platformFeePercent = _newFee;
    }

    function getEscrowBalance(address _subscriber, uint256 _botId) external view returns (uint96, address) {
        PaymentInfo storage payment = payments[_subscriber][_botId];
        return (payment.escrowBalance, payment.token);
    }

    function getPaymentStatus(address _subscriber, uint256 _botId) external view returns (uint8) {
        return payments[_subscriber][_botId].status;
    }

    function updateSubscriptionContract(address _subscription) external onlyOwner {
        require(_subscription != address(0), "Invalid subscription address");
        botSubscription = NewSubscription(_subscription);
    }
}