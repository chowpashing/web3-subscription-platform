// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PaymentProcessor is ReentrancyGuard {
    IERC20 public usdt;
    uint256 public refundPeriod;
    address public owner;

    struct Payment {
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }

    mapping(address => Payment[]) public payments;

    event PaymentReceived(address indexed payer, uint256 amount, uint256 timestamp);
    event RefundProcessed(address indexed payer, uint256 amount, uint256 timestamp);

    constructor(address _usdtAddress, uint256 _refundPeriodInSeconds) {
        usdt = IERC20(_usdtAddress);
        refundPeriod = _refundPeriodInSeconds;
        owner = msg.sender;
    }

    function makePayment(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(usdt.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");

        payments[msg.sender].push(Payment({
            amount: amount,
            timestamp: block.timestamp,
            refunded: false
        }));

        emit PaymentReceived(msg.sender, amount, block.timestamp);
    }

    function requestRefund(uint256 paymentIndex) external nonReentrant {
        require(paymentIndex < payments[msg.sender].length, "Invalid payment index");
        Payment storage payment = payments[msg.sender][paymentIndex];

        require(!payment.refunded, "Payment already refunded");
        require(
            block.timestamp <= payment.timestamp + refundPeriod,
            "Refund period has expired"
        );

        payment.refunded = true;
        require(usdt.transfer(msg.sender, payment.amount), "Refund transfer failed");

        emit RefundProcessed(msg.sender, payment.amount, block.timestamp);
    }

    function setRefundPeriod(uint256 _newPeriodInSeconds) external {
        require(msg.sender == owner, "Only owner can set refund period");
        refundPeriod = _newPeriodInSeconds;
    }

    function getPaymentCount(address user) external view returns (uint256) {
        return payments[user].length;
    }

    function getPaymentDetails(address user, uint256 index) external view returns (
        uint256 amount,
        uint256 timestamp,
        bool refunded
    ) {
        require(index < payments[user].length, "Invalid payment index");
        Payment storage payment = payments[user][index];
        return (payment.amount, payment.timestamp, payment.refunded);
    }
}