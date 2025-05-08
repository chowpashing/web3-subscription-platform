// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./BotRegistry.sol";
import "./BotSubscription.sol";

contract BotPayment is Ownable, ReentrancyGuard {
    IERC20 public usdtToken;
    BotRegistry public botRegistry;
    BotSubscription public botSubscription;

    uint256 public platformFeePercent = 1000; // 默认平台抽成为10%
    
    mapping(address => uint256) public developerBalance;
    mapping(uint256 => uint256) public botIncome;
    mapping(address => mapping(uint256 => uint256)) public escrowBalance;
    mapping(address => mapping(uint256 => PaymentStatus)) public paymentStatus;

    enum PaymentStatus {
        None,
        Pending,
        Completed,
        Refunded
    }

    event PaymentProcessed(uint256 botId, address subscriber, address developer, uint256 amount, uint256 platformFee);
    event RefundProcessed(uint256 botId, address subscriber, uint256 amount);
    event BalanceWithdrawn(address developer, uint256 amount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PaymentStatusChanged(uint256 botId, address subscriber, PaymentStatus status);

    constructor(address _usdtToken, address _botRegistry, address _botSubscription) {
        usdtToken = IERC20(_usdtToken);
        botRegistry = BotRegistry(_botRegistry);
        botSubscription = BotSubscription(_botSubscription);
    }

    function getPaymentToken() external view returns (IERC20) {
        return usdtToken;
    }

    function processPayment(uint256 _botId, uint256 _amount, uint256 _durationInDays) external nonReentrant {
        require(_amount > 0, "Invalid payment amount");
        
        (, , , , , address developer, bool isActive, ) = botRegistry.getBotDetails(_botId);
        require(isActive, "Bot is not active");

        require(usdtToken.transferFrom(msg.sender, address(this), _amount), "Payment transfer failed");

        // 分账/托管逻辑可保留
        escrowBalance[msg.sender][_botId] = _amount;
        paymentStatus[msg.sender][_botId] = PaymentStatus.Pending;

        // 自动登记订阅
        botSubscription.subscribeFor(msg.sender, _botId, _durationInDays);

        emit PaymentProcessed(_botId, msg.sender, developer, _amount, 0);
        emit PaymentStatusChanged(_botId, msg.sender, PaymentStatus.Pending);
    }

    function processRefund(uint256 _botId, address _subscriber, uint256 _amount) external nonReentrant {
        require(msg.sender == address(botSubscription), "Only subscription contract can call refund");
        require(_amount > 0, "Invalid refund amount");
        require(escrowBalance[_subscriber][_botId] >= _amount, "Insufficient escrow balance");
        require(paymentStatus[_subscriber][_botId] == PaymentStatus.Pending, "Payment not in pending status");

        // ✅ 校验是否仍处于试用期
        require(botSubscription.isTrialActive(_subscriber, _botId), "Trial period ended");

        escrowBalance[_subscriber][_botId] -= _amount;
        paymentStatus[_subscriber][_botId] = PaymentStatus.Refunded;

        require(usdtToken.transfer(_subscriber, _amount), "Refund transfer failed");

        emit RefundProcessed(_botId, _subscriber, _amount);
        emit PaymentStatusChanged(_botId, _subscriber, PaymentStatus.Refunded);
    }

    function finalizePayment(address _subscriber, uint256 _botId) external onlyOwner nonReentrant {
        uint256 amount = escrowBalance[_subscriber][_botId];
        require(amount > 0, "No escrow balance");
        require(paymentStatus[_subscriber][_botId] == PaymentStatus.Pending, "Payment not in pending status");

        // 获取机器人详情
        (, , , , , address developer, , ) = botRegistry.getBotDetails(_botId);
        require(developer != address(0), "Invalid developer address");

        // 计算费用分配
        uint256 fee = (amount * platformFeePercent) / 10000;
        uint256 developerShare = amount - fee;

        // 更新状态
        escrowBalance[_subscriber][_botId] = 0;
        paymentStatus[_subscriber][_botId] = PaymentStatus.Completed;
        developerBalance[developer] += developerShare;
        botIncome[_botId] += amount;

        emit PaymentProcessed(_botId, _subscriber, developer, amount, fee);
        emit PaymentStatusChanged(_botId, _subscriber, PaymentStatus.Completed);
    }

    function withdrawBalance() external nonReentrant {
        uint256 amount = developerBalance[msg.sender];
        require(amount > 0, "No balance to withdraw");

        developerBalance[msg.sender] = 0;

        require(usdtToken.transfer(msg.sender, amount), "Withdraw failed");

        emit BalanceWithdrawn(msg.sender, amount);
    }

    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 2000, "Too high"); // 最大20%
        emit PlatformFeeUpdated(platformFeePercent, _newFee);
        platformFeePercent = _newFee;
    }

    function getEscrowBalance(address _subscriber, uint256 _botId) external view returns (uint256) {
        return escrowBalance[_subscriber][_botId];
    }

    function getPaymentStatus(address _subscriber, uint256 _botId) external view returns (PaymentStatus) {
        return paymentStatus[_subscriber][_botId];
    }
}