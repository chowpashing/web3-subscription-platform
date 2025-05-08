// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BotRegistry.sol";
import "./BotPayment.sol";

contract BotSubscription is Ownable, ReentrancyGuard {
    enum SubscriptionStatus {
        Trial,     // Paid, in trial period (refundable)
        Active,    // Formal subscription (non-refundable)
        Expired
    }

    struct Subscription {
        uint256 botId;
        address subscriber;
        uint256 startTime;
        uint256 endTime;
        uint256 trialEndTime;
        uint256 lastPayment;
        SubscriptionStatus status;
    }

    BotRegistry public botRegistry;
    BotPayment public botPayment;
    mapping(uint256 => Subscription[]) public botSubscriptions;
    mapping(address => mapping(uint256 => uint256)) public subscriptionIndex;
    string public currency = "ETH-USDT";

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
        botRegistry = BotRegistry(_registry);
        botPayment = BotPayment(_payment);
    }

    function updatePaymentContract(address _payment) external onlyOwner {
        botPayment = BotPayment(_payment);
    }

    function subscribeFor(address user, uint256 botId, uint256 durationInDays) external {
        require(msg.sender == address(botPayment), "Only payment contract can call");
        require(botRegistry.exists(botId), "Bot does not exist");
        (, uint256 pricePerPeriod, uint256 trialPeriod, , , , bool isActive, ) = botRegistry.getBotDetails(botId);
        require(isActive, "Bot is not active");

        uint256 nowTime = block.timestamp;
        uint256 trialEndTime = nowTime;
        SubscriptionStatus status;
        if (trialPeriod > 0 && subscriptionIndex[user][botId] == 0) {
            status = SubscriptionStatus.Trial;
            trialEndTime = nowTime + (trialPeriod * 1 days);
        } else {
            status = SubscriptionStatus.Active;
        }
        Subscription memory sub = Subscription({
            botId: botId,
            subscriber: user,
            startTime: nowTime,
            endTime: nowTime + (durationInDays * 1 days),
            trialEndTime: trialEndTime,
            lastPayment: nowTime,
            status: status
        });
        uint256 index = botSubscriptions[botId].length;
        botSubscriptions[botId].push(sub);
        subscriptionIndex[user][botId] = index + 1;
        emit SubscriptionCreated(
            botId,
            user,
            sub.startTime,
            sub.endTime,
            sub.trialEndTime,
            currency,
            status
        );
    }

    function cancel(uint256 botId) external nonReentrant {
        uint256 index = subscriptionIndex[msg.sender][botId];
        require(index > 0, "Subscription not found");
        Subscription storage sub = botSubscriptions[botId][index - 1];
        require(sub.status == SubscriptionStatus.Trial, "Can only cancel during trial period");
        require(block.timestamp <= sub.trialEndTime, "Trial period has ended");
        SubscriptionStatus oldStatus = sub.status;
        sub.status = SubscriptionStatus.Expired;
        emit SubscriptionCancelled(botId, msg.sender);
        emit SubscriptionStatusChanged(botId, msg.sender, oldStatus, SubscriptionStatus.Expired);
        uint256 amount = 0;
        try botPayment.processRefund(botId, msg.sender, amount) {
        } catch {
            sub.status = SubscriptionStatus.Trial;
            emit SubscriptionStatusChanged(botId, msg.sender, SubscriptionStatus.Expired, SubscriptionStatus.Trial);
            revert("Refund failed, subscription status restored to Trial");
        }
    }

    function isActive(address user, uint256 botId) public view returns (bool) {
        uint256 index = subscriptionIndex[user][botId];
        if (index == 0) return false;
        Subscription memory sub = botSubscriptions[botId][index - 1];
        return (sub.status == SubscriptionStatus.Active || sub.status == SubscriptionStatus.Trial) && sub.endTime > block.timestamp;
    }

    function isTrialActive(address user, uint256 botId) public view returns (bool) {
        uint256 index = subscriptionIndex[user][botId];
        if (index == 0) return false;
        Subscription memory sub = botSubscriptions[botId][index - 1];
        return sub.status == SubscriptionStatus.Trial && block.timestamp <= sub.trialEndTime;
    }

    function getSubscription(address user, uint256 botId) external view returns (
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

    function expireIfNeeded(address user, uint256 botId) public returns (bool) {
        uint256 idx = subscriptionIndex[user][botId];
        require(idx > 0, "Subscription not found");
        Subscription storage sub = botSubscriptions[botId][idx - 1];
        if ((sub.status == SubscriptionStatus.Active || sub.status == SubscriptionStatus.Trial) && block.timestamp > sub.endTime) {
            SubscriptionStatus old = sub.status;
            sub.status = SubscriptionStatus.Expired;
            emit SubscriptionStatusChanged(botId, user, old, SubscriptionStatus.Expired);
            return true;
        }
        return false;
    }
}