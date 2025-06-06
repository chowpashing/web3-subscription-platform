import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Select, InputNumber, Checkbox, Button, Steps, message, Spin } from 'antd';
import { Bot } from '../types/bot';
import { connectWallet, checkUSDTBalance, checkUSDTAllowance, approveUSDT } from '../services/web3AuthService';
import { subscribe as onChainSubscribe } from '../services/subscriptionService';
import styles from '../styles/pages/BotDetail.module.css';
import axios from '../utils/axios';
import { Event } from 'ethers';
import { ethers } from 'ethers';
import { AxiosError } from 'axios';

const { Option } = Select;

function BotDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bot] = useState<Bot | null>(location.state?.bot || null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [usdtAllowance, setUsdtAllowance] = useState('0');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState(3); // 默认3个月
  const [quantity, setQuantity] = useState(1);
  const [autoRenew, setAutoRenew] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // 订阅时长选项
  const periodOptions = [
    { value: 3, label: '3months' },
    { value: 6, label: '6months' },
    { value: 12, label: '12months' }
  ];

  // 如果没有传递机器人信息，则返回上一页
  useEffect(() => {
    if (!bot) {
      message.error('机器人信息不存在');
      window.history.back();
    }
  }, [bot]);

  const calculateTotalPrice = () => {
    if (!bot) return 0;
    return bot.price * subscriptionPeriod * quantity;
  };

  const handleConnectWallet = async () => {
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
      setWalletConnected(true);
      
      // 检查USDT余额和授权
      const balance = await checkUSDTBalance(address);
      const allowance = await checkUSDTAllowance(address);
      setUsdtBalance(balance);
      setUsdtAllowance(allowance);
    } catch {
      message.error('连接钱包失败');
    }
  };

  const handleApproveUSDT = async () => {
    try {
      const totalPrice = calculateTotalPrice();
      await approveUSDT(totalPrice.toString());
      message.success('USDT授权成功');
      const allowance = await checkUSDTAllowance(walletAddress);
      setUsdtAllowance(allowance);
    } catch {
      message.error('USDT授权失败');
    }
  };

  const handlePayment = async () => {
    if (!bot) return;
    try {
      setPaymentLoading(true);

      // 1. 检查当前授权额度是否足够
      const currentAllowance = await checkUSDTAllowance(walletAddress);
      const totalPrice = calculateTotalPrice();
      
      if (Number(currentAllowance) < totalPrice) {
        // 如果授权额度不足，自动发起授权
        message.info('正在授权 USDT...');
        await approveUSDT(totalPrice.toString());
        message.success('USDT 授权成功');
        
        // 重新检查授权额度
        const newAllowance = await checkUSDTAllowance(walletAddress);
        setUsdtAllowance(newAllowance);
        
        if (Number(newAllowance) < totalPrice) {
          throw new Error('授权额度不足，请重试');
        }
      }

      // 2. 调用链上 subscribe 函数
      const receipt = await onChainSubscribe(
        bot.id,
        subscriptionPeriod * 30, // 将月数转换为天数
        autoRenew
      );

      // 2.1 解析链上事件，获取订阅信息
      let paymentEvent: Event | undefined = undefined;
      if (receipt && receipt.events) {
        paymentEvent = receipt.events.find((e: Event) => e.event === 'PaymentProcessed');
      }

      if (!paymentEvent || !paymentEvent.args) {
        message.warning('未找到支付事件，部分信息无法同步到后端');
      } else {
        const { amount } = paymentEvent.args;
        
        try {
          const requestData = {
            bot: bot.id,
            payment_time: new Date().toISOString(),
            payment_amount: Number(ethers.utils.formatUnits(amount, 6)).toFixed(2),
            currency: 'ETH-USDT',
            transaction_hash: receipt.transactionHash,
            expiration_date: new Date(Date.now() + subscriptionPeriod * 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'subscribed',
            active: true
          };
          
          await axios.post('/api/subscription/create/', requestData);
        } catch (error: unknown) {
          if (error instanceof AxiosError) {
            message.warning('订阅链上成功，但同步到后端失败');
          }
        }
      }

      // 3. 显示成功并进入完成页面
      message.success('支付并订阅成功！');
      setCurrentStep(2);
    } catch (error) {
      message.error('支付失败，请重试');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!bot) {
    return <Spin size="large" />;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.botCard}>
        <div className={styles.botInfo}>
          <h2>{bot.name}</h2>
          <p>{bot.description}</p>
          <p>Price: {bot.price} USDT/month</p>
        </div>

        <Steps current={currentStep} className={styles.steps}>
          <Steps.Step title="Select Subscription Plan" />
          <Steps.Step title="Payment" />
          <Steps.Step title="Completed" />
        </Steps>

        {currentStep === 0 && (
          <div className={styles.subscriptionForm}>
            <div className={styles.formItem}>
              <label>Subscription Period:</label>
              <Select
                value={subscriptionPeriod}
                onChange={setSubscriptionPeriod}
                style={{ width: 200 }}
              >
                {periodOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>

            <div className={styles.formItem}>
              <label>Quantity:</label>
              <InputNumber
                min={1}
                value={quantity}
                onChange={value => setQuantity(value || 1)}
              />
            </div>

            <div className={styles.formItem}>
              <Checkbox
                checked={autoRenew}
                onChange={e => setAutoRenew(e.target.checked)}
              >
                Auto Renew
              </Checkbox>
            </div>

            <div className={styles.totalPrice}>
              Total Price: {calculateTotalPrice()} USDT
            </div>

            <Button type="primary" onClick={() => setCurrentStep(1)}>
              Next Step
            </Button>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.paymentForm}>
            {!walletConnected ? (
              <Button type="primary" onClick={handleConnectWallet}>
                Connect Wallet
              </Button>
            ) : (
              <>
                <p>Wallet Address: {walletAddress}</p>
                <p>USDT Balance: {usdtBalance}</p>
                <p>Approved Allowance: {usdtAllowance}</p>
                
                {Number(usdtAllowance) < calculateTotalPrice() && (
                  <Button type="primary" onClick={handleApproveUSDT}>
                    Approve USDT
                  </Button>
                )}
                
                <Button 
                  type="primary" 
                  onClick={handlePayment}
                  loading={paymentLoading}
                  disabled={Number(usdtAllowance) < calculateTotalPrice()}
                >
                  Confirm Payment
                </Button>
              </>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.successMessage}>
            <h3>Subscription Successful!</h3>
            <p>You have successfully subscribed to {bot.name}, subscription period is {subscriptionPeriod} months.</p>
            <Button type="primary" onClick={() => window.location.href = '/bots'}>
              Back to Bot List
            </Button>
            <Button type="primary" onClick={() => navigate('/subscription')}>
              Subscription Management
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default BotDetail;