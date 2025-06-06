// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./BotRegistry.sol";
import "./BotSubscription.sol";

contract NewBotPayment is Ownable, ReentrancyGuard {
    // Use immutable to reduce deployment gas
    IERC20 public immutable usdtToken;
    BotRegistry public immutable botRegistry;
    BotSubscription public immutable botSubscription;

    uint256 public platformFeePercent = 1000; // Default platform fee is 10%
    
    // Use structs to optimize storage
    struct PaymentInfo {
        uint256 escrowBalance;
        PaymentStatus status;
    }

    struct BotInfo {
        uint256 income;
        uint256 developerBalance;
    }
    
    // Combine mappings to reduce storage slots
    mapping(address => mapping(uint256 => PaymentInfo)) public payments;
    mapping(uint256 => BotInfo) public botInfo;

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

        // Use struct initialization to reduce storage operations
        payments[msg.sender][_botId] = PaymentInfo({
            escrowBalance: _amount,
            status: PaymentStatus.Pending
        });

        // Automatically register subscription
        botSubscription.subscribeFor(msg.sender, _botId, _durationInDays);

        emit PaymentProcessed(_botId, msg.sender, developer, _amount, 0);
        emit PaymentStatusChanged(_botId, msg.sender, PaymentStatus.Pending);
    }

    function processRefund(uint256 _botId, address _subscriber, uint256 _amount) external nonReentrant {
        require(msg.sender == address(botSubscription), "Only subscription contract can call refund");
        require(_amount > 0, "Invalid refund amount");
        
        // Use storage pointer to reduce storage reads
        PaymentInfo storage payment = payments[_subscriber][_botId];
        require(payment.escrowBalance >= _amount, "Insufficient escrow balance");
        require(payment.status == PaymentStatus.Pending, "Payment not in pending status");

        require(botSubscription.isTrialActive(_subscriber, _botId), "Trial period ended");

        payment.escrowBalance -= _amount;
        payment.status = PaymentStatus.Refunded;

        require(usdtToken.transfer(_subscriber, _amount), "Refund transfer failed");

        emit RefundProcessed(_botId, _subscriber, _amount);
        emit PaymentStatusChanged(_botId, _subscriber, PaymentStatus.Refunded);
    }

    function finalizePayment(address _subscriber, uint256 _botId) external onlyOwner nonReentrant {
        // Use storage pointer to reduce storage reads
        PaymentInfo storage payment = payments[_subscriber][_botId];
        require(payment.escrowBalance > 0, "No escrow balance");
        require(payment.status == PaymentStatus.Pending, "Payment not in pending status");

        (, , , , , address developer, , ) = botRegistry.getBotDetails(_botId);
        require(developer != address(0), "Invalid developer address");

        uint256 amount = payment.escrowBalance;
        uint256 fee = (amount * platformFeePercent) / 10000;
        uint256 developerShare = amount - fee;

        // Batch update states to reduce storage operations
        payment.escrowBalance = 0;
        payment.status = PaymentStatus.Completed;
        
        BotInfo storage info = botInfo[_botId];
        info.income += amount;
        info.developerBalance += developerShare;

        emit PaymentProcessed(_botId, _subscriber, developer, amount, fee);
        emit PaymentStatusChanged(_botId, _subscriber, PaymentStatus.Completed);
    }

    function withdrawBalance() external nonReentrant {
        uint256 totalBalance = 0;
        uint256 maxBotId = 1000; // Set a reasonable maximum bot ID limit
        
        // Iterate through all bot developer balances
        for (uint256 i = 0; i < maxBotId; i++) {
            BotInfo storage info = botInfo[i];
            if (info.developerBalance > 0) {
                totalBalance += info.developerBalance;
                info.developerBalance = 0;
            }
        }
        
        require(totalBalance > 0, "No balance to withdraw");
        require(usdtToken.transfer(msg.sender, totalBalance), "Withdraw failed");

        emit BalanceWithdrawn(msg.sender, totalBalance);
    }

    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 2000, "Too high"); // Maximum 20%
        emit PlatformFeeUpdated(platformFeePercent, _newFee);
        platformFeePercent = _newFee;
    }

    function getEscrowBalance(address _subscriber, uint256 _botId) external view returns (uint256) {
        return payments[_subscriber][_botId].escrowBalance;
    }

    function getPaymentStatus(address _subscriber, uint256 _botId) external view returns (PaymentStatus) {
        return payments[_subscriber][_botId].status;
    }
}
