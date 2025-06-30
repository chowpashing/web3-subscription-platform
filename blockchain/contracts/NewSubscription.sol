// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./NewRegistry.sol";
import "./NewBotPayment.sol";

contract NewSubscription is Ownable, ReentrancyGuard {
    // Using uint8 instead of enum to save gas
    // enum uses more storage space and has higher gas cost for operations
    uint8 constant TRIAL = 0;     // Paid, in trial period (refundable)
    uint8 constant ACTIVE = 1;    // Formal subscription (non-refundable)
    uint8 constant EXPIRED = 2;   // Subscription has ended

    // Optimized struct layout to reduce storage slots
    // Grouping smaller types together to fit in one storage slot
    struct Subscription {
        address subscriber;      // 20 bytes
        uint8 status;           // 1 byte
        uint32 startTime;       // Reduced from uint256 to uint32 (enough until 2106)
        uint32 endTime;         // Reduced from uint256 to uint32
        uint32 trialEndTime;    // Reduced from uint256 to uint32
        uint32 lastPayment;     // Reduced from uint256 to uint32
    }

    // Contract references
    NewRegistry public immutable botRegistry;
    NewBotPayment public botPayment;

    // Storage
    mapping(uint256 => Subscription[]) public botSubscriptions;
    mapping(address => mapping(uint256 => uint256)) public subscriptionIndex;
    string public constant CURRENCY = "ETH-USDT";

    // Events
    event SubscriptionCreated(
        uint256 indexed botId,
        address indexed subscriber,
        uint32 startTime,
        uint32 endTime,
        uint32 trialEndTime,
        string currency,
        uint8 status
    );

    event SubscriptionCancelled(
        uint256 indexed botId,
        address indexed subscriber
    );

    event SubscriptionStatusChanged(
        uint256 indexed botId,
        address indexed subscriber,
        uint8 oldStatus,
        uint8 newStatus
    );

    // Added new events for better tracking
    event SubscriptionExtended(
        uint256 indexed botId,
        address indexed subscriber,
        uint32 newEndTime
    );

    event SubscriptionRenewed(
        uint256 indexed botId,
        address indexed subscriber,
        uint32 newStartTime,
        uint32 newEndTime
    );

    constructor(address _registry, address _payment) {
        botRegistry = NewRegistry(_registry);
        botPayment = NewBotPayment(_payment);
    }

    function updatePaymentContract(address _payment) external onlyOwner {
        require(_payment != address(0), "Invalid payment address");
        botPayment = NewBotPayment(_payment);
    }

    function subscribeFor(
        address user,
        uint256 botId,
        uint256 durationInDays
    ) external {
        require(msg.sender == address(botPayment), "Only payment contract can call");

        // Get bot details
        (
            , // ipfsHash
            , // price
            uint32 trialPeriod,
            , // name
            address developer,
            bool botIsActive,
            bool exists
        ) = botRegistry.getBotDetails(botId);
        
        require(exists && botIsActive, "Bot is not active");
        require(developer != address(0), "Invalid bot developer");

        uint32 nowTime = uint32(block.timestamp);
        uint32 trialEndTime = nowTime;
        uint8 status;

        // Set trial period if applicable
        if (trialPeriod > 0) {
            status = TRIAL;
            trialEndTime = nowTime + uint32(trialPeriod * 1 hours);
        } else {
            status = ACTIVE;
        }

        // Create subscription
        Subscription memory sub = Subscription({
            subscriber: user,
            status: status,
            startTime: nowTime,
            endTime: nowTime + uint32(durationInDays * 1 days),
            trialEndTime: trialEndTime,
            lastPayment: nowTime
        });

        // Store subscription
        uint256 index = botSubscriptions[botId].length;
     
        botSubscriptions[botId].push(sub);
        
        // Using unchecked block to save gas on arithmetic operations
        unchecked {
            subscriptionIndex[user][botId] = index + 1;
        }

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

    // Optimized cancel function with better error handling
    function cancel(uint256 botId) external nonReentrant {
        uint256 index = subscriptionIndex[msg.sender][botId];
        require(index > 0, "Subscription not found");
        
        Subscription storage sub = botSubscriptions[botId][index - 1];
        require(sub.status == TRIAL, "Can only cancel during trial period");
        require(block.timestamp <= sub.trialEndTime, "Trial period has ended");
        
        (uint256 amount, ) = botPayment.getEscrowBalance(msg.sender, botId);
        require(amount > 0, "No payment to refund");
        
        // Try to process refund first
        try botPayment.processRefund(botId, msg.sender, amount) {
            // Only update status after successful refund
            uint8 oldStatus = sub.status;
            sub.status = EXPIRED;
            
            emit SubscriptionStatusChanged(botId, msg.sender, oldStatus, EXPIRED);
            emit SubscriptionCancelled(botId, msg.sender);
        } catch {
            revert("Refund failed, subscription cannot be cancelled");
        }
    }

    // Using storage reference instead of memory copy to save gas
    function isActive(address user, uint256 botId) public view returns (bool) {
        uint256 index = subscriptionIndex[user][botId];
        if (index == 0) return false;

        Subscription storage sub = botSubscriptions[botId][index - 1];
        return (sub.status == ACTIVE || sub.status == TRIAL) && 
                sub.endTime > block.timestamp;
    }

    function isTrialActive(address user, uint256 botId) public view returns (bool) {
        uint256 index = subscriptionIndex[user][botId];
        if (index == 0) return false;

        Subscription storage sub = botSubscriptions[botId][index - 1];
        return sub.status == TRIAL && block.timestamp <= sub.trialEndTime;
    }

    function getSubscription(
        address user,
        uint256 botId
    ) external view returns (
        uint32 startTime,
        uint32 endTime,
        uint32 trialEndTime,
        uint32 lastPayment,
        uint8 status
    ) {
        uint256 index = subscriptionIndex[user][botId];
        require(index > 0, "Subscription not found");

        Subscription storage sub = botSubscriptions[botId][index - 1];
        return (
            sub.startTime,
            sub.endTime,
            sub.trialEndTime,
            sub.lastPayment,
            sub.status
        );
    }

    // Added batch query function to reduce number of calls
    function getMultipleSubscriptions(
        address user,
        uint256[] calldata botIds
    ) external view returns (Subscription[] memory) {
        Subscription[] memory result = new Subscription[](botIds.length);
        for(uint i = 0; i < botIds.length; i++) {
            uint256 index = subscriptionIndex[user][botIds[i]];
            if(index > 0) {
                result[i] = botSubscriptions[botIds[i]][index - 1];
            }
        }
        return result;
    }
}

