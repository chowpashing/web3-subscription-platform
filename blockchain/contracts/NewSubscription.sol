// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./NewRegistry.sol";
import "./BotPayment.sol";

contract NewSubscription is Ownable, ReentrancyGuard {
    enum SubscriptionStatus {
        Trial,     // Paid, in trial period (refundable)
        Active,    // Formal subscription (non-refundable)
        Expired
    }

    struct Subscription {
        uint256 startTime;      // 32 bytes
        uint256 endTime;        // 32 bytes
        uint256 trialEndTime;   // 32 bytes
        uint256 lastPayment;    // 32 bytes
        SubscriptionStatus status; // 1 byte
        address subscriber;      // 20 bytes
    }

    // Contract references
    NewRegistry public immutable botRegistry;
    BotPayment public botPayment;

    // Storage
    mapping(uint256 => Subscription[]) public botSubscriptions;
    mapping(address => mapping(uint256 => uint256)) public subscriptionIndex;
    string public constant CURRENCY = "ETH-USDT";

    // Events
    event SubscriptionCreated(
        uint256 indexed botId,
        address indexed subscriber,
        uint256 startTime,
        uint256 endTime,
        uint256 trialEndTime,
        string currency,
        SubscriptionStatus status
    );

    event SubscriptionCancelled(
        uint256 indexed botId,
        address indexed subscriber
    );

    event SubscriptionStatusChanged(
        uint256 indexed botId,
        address indexed subscriber,
        SubscriptionStatus oldStatus,
        SubscriptionStatus newStatus
    );

    constructor(address _registry, address _payment) {
        botRegistry = NewRegistry(_registry);
        botPayment = BotPayment(_payment);
    }

    // Update payment contract address
    function updatePaymentContract(address _payment) external onlyOwner {
        require(_payment != address(0), "Invalid payment address");
        botPayment = BotPayment(_payment);
    }

    // Subscribe to a bot
    function subscribeFor(
        address user,
        uint256 botId,
        uint256 durationInDays
    ) external {
        require(msg.sender == address(botPayment), "Only payment contract can call");

        // Get bot details
        (
            ,  // ipfsHash
            uint256 pricePerPeriod,
            uint256 trialPeriod,
            ,  // name
            ,  // description
            address developer,
            bool isActive,
            bool exists
        ) = botRegistry.getBotDetails(botId);
        
        require(exists && isActive, "Bot is not active");
        require(developer != address(0), "Invalid bot developer");

        uint256 nowTime = block.timestamp;
        uint256 trialEndTime = nowTime;
        SubscriptionStatus status;

        // Set trial period if applicable
        if (trialPeriod > 0) {
            status = SubscriptionStatus.Trial;
            trialEndTime = nowTime + (trialPeriod * 1 hours);
        } else {
            status = SubscriptionStatus.Active;
        }

        // Create subscription
        Subscription memory sub = Subscription({
            startTime: nowTime,
            endTime: nowTime + (durationInDays * 1 days),
            trialEndTime: trialEndTime,
            lastPayment: nowTime,
            status: status,
            subscriber: user
        });

        // Store subscription
        uint256 index = botSubscriptions[botId].length;
        botSubscriptions[botId].push(sub);
        subscriptionIndex[user][botId] = index + 1;

        emit SubscriptionCreated(
            botId,
            user,
            sub.startTime,
            sub.endTime,
            sub.trialEndTime,
            CURRENCY,
            status
        );
    }

    // Cancel subscription during trial period
    function cancel(uint256 botId) external nonReentrant {
        uint256 index = subscriptionIndex[msg.sender][botId];
        require(index > 0, "Subscription not found");

        Subscription storage sub = botSubscriptions[botId][index - 1];
        require(sub.status == SubscriptionStatus.Trial, "Can only cancel during trial period");
        require(block.timestamp <= sub.trialEndTime, "Trial period has ended");
        
        // Get payment amount
        uint256 amount = botPayment.getEscrowBalance(msg.sender, botId);
        require(amount > 0, "No payment to refund");
        
        // Try to process refund
        try botPayment.processRefund(botId, msg.sender, amount) {
            // Update subscription status
            SubscriptionStatus oldStatus = sub.status;
            sub.status = SubscriptionStatus.Expired;
            
            emit SubscriptionCancelled(botId, msg.sender);
            emit SubscriptionStatusChanged(botId, msg.sender, oldStatus, SubscriptionStatus.Expired);
        } catch {
            revert("Refund failed, subscription cannot be cancelled");
        }
    }

    // Check if subscription is active
    function isActive(address user, uint256 botId) public view returns (bool) {
        uint256 index = subscriptionIndex[user][botId];
        if (index == 0) return false;

        Subscription memory sub = botSubscriptions[botId][index - 1];
        return (sub.status == SubscriptionStatus.Active || 
                sub.status == SubscriptionStatus.Trial) && 
                sub.endTime > block.timestamp;
    }

    // Check if trial period is active
    function isTrialActive(address user, uint256 botId) public view returns (bool) {
        uint256 index = subscriptionIndex[user][botId];
        if (index == 0) return false;

        Subscription memory sub = botSubscriptions[botId][index - 1];
        return sub.status == SubscriptionStatus.Trial && 
               block.timestamp <= sub.trialEndTime;
    }

    // Get subscription details
    function getSubscription(
        address user,
        uint256 botId
    ) external view returns (
        uint256 startTime,
        uint256 endTime,
        uint256 trialEndTime,
        uint256 lastPayment,
        SubscriptionStatus status
    ) {
        uint256 index = subscriptionIndex[user][botId];
        require(index > 0, "Subscription not found");

        Subscription memory sub = botSubscriptions[botId][index - 1];
        return (
            sub.startTime,
            sub.endTime,
            sub.trialEndTime,
            sub.lastPayment,
            sub.status
        );
    }

    // Expire subscription if needed
    function expireIfNeeded(address user, uint256 botId) public returns (bool) {
        uint256 idx = subscriptionIndex[user][botId];
        require(idx > 0, "Subscription not found");

        Subscription storage sub = botSubscriptions[botId][idx - 1];
        if ((sub.status == SubscriptionStatus.Active || 
             sub.status == SubscriptionStatus.Trial) && 
            block.timestamp > sub.endTime) {
            
            SubscriptionStatus old = sub.status;
            sub.status = SubscriptionStatus.Expired;
            
            emit SubscriptionStatusChanged(botId, user, old, SubscriptionStatus.Expired);
            return true;
        }
        return false;
    }
}
