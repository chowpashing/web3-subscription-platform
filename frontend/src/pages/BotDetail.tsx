import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Select, InputNumber, Checkbox, Button, Steps, message, Spin, Alert, Radio, Typography } from 'antd';
import { Bot } from '../types/bot';
import { connectWallet, checkUSDTBalance, checkUSDTAllowance, approveUSDT, checkEIP2612Support } from '../services/web3AuthService';
import { subscribe as onChainSubscribe, subscribeWithPermit } from '../services/subscriptionService';
import styles from '../styles/pages/BotDetail.module.css';
import axios from '../utils/axios';
import { Event } from 'ethers';
import { ethers } from 'ethers';
import { AxiosError } from 'axios';
import { 
  NEW_USDT_CONTRACT_ADDRESS as USDT_CONTRACT_ADDRESS,
  NEW_BOT_PAYMENT_CONTRACT_ADDRESS as BOT_PAYMENT_CONTRACT_ADDRESS 
} from '../contracts/addresses';
import { USDT_ABI } from '../contracts/abis/usdt';

const { Option } = Select;
const { Title, Text } = Typography;

function BotDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bot] = useState<Bot | null>(location.state?.bot || null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [usdtAllowance, setUsdtAllowance] = useState('0');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState(3);
  const [quantity, setQuantity] = useState(1);
  const [autoRenew, setAutoRenew] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // 新增状态
  const [isPermitSupported, setIsPermitSupported] = useState<boolean | null>(null);
  const [isCheckingSupport, setIsCheckingSupport] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'permit' | 'standard'>('standard');

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
      setIsCheckingSupport(true);
      const { address } = await connectWallet();
      setWalletAddress(address);
      setWalletConnected(true);
      
      // 检查USDT余额
      const balance = await checkUSDTBalance(address);
      setUsdtBalance(balance);
      
      // 检测 EIP-2612 支持
      const isSupported = await checkEIP2612Support(USDT_CONTRACT_ADDRESS);
      setIsPermitSupported(isSupported);
      setPaymentMode(isSupported ? 'permit' : 'standard');
      
      // 只有在标准支付方式下才检查授权额度
      if (!isSupported) {
        const allowance = await checkUSDTAllowance(address);
        setUsdtAllowance(allowance);
      } else {
        setUsdtAllowance('0'); // permit 模式下不需要授权
      }
    } catch (error) {
      message.error('连接钱包失败');
    } finally {
      setIsCheckingSupport(false);
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

      let receipt;
      const totalPrice = calculateTotalPrice();
      const durationInDays = subscriptionPeriod * 30; // 将月数转换为天数

      if (paymentMode === 'permit') {
        // 获取当前区块时间戳
        const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
        const currentBlock = await provider.getBlock('latest');
        const deadline = currentBlock.timestamp + 3600; // 1小时后过期

        // 获取 permit 签名
        const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        const nonce = await usdtContract.nonces(userAddress);

        // 创建签名数据
        const domain = {
          name: await usdtContract.name(),
          version: '1',
          chainId: (await provider.getNetwork()).chainId,
          verifyingContract: USDT_CONTRACT_ADDRESS
        };

        const types = {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };

        const value = {
          owner: userAddress,
          spender: BOT_PAYMENT_CONTRACT_ADDRESS,
          value: ethers.utils.parseUnits(totalPrice.toString(), 6),
          nonce: nonce,
          deadline: deadline
        };

        // 获取签名
        const signature = await signer._signTypedData(domain, types, value);
        const { v, r, s } = ethers.utils.splitSignature(signature);

        // 调用 permit 支付
        receipt = await subscribeWithPermit(
          bot.id,
          durationInDays,
          ethers.utils.parseUnits(totalPrice.toString(), 6),
          deadline,
          v,
          r,
          s
        );
      } else {
        // 标准支付方式
        receipt = await onChainSubscribe(
          bot.id,
          durationInDays,
          autoRenew
        );
      }

      // 处理支付成功后的操作
      await handlePaymentSuccess(receipt);

      // 显示成功并进入完成页面
      message.success('支付并订阅成功！');
      setCurrentStep(3);
    } catch (error: unknown) {
      console.error('支付失败:', error);
      if (error instanceof Error) {
        if (error.message.includes('user denied')) {
          message.error('用户拒绝了交易');
        } else if (error.message.includes('insufficient funds')) {
          message.error('USDT 余额不足');
        } else if (error.message.includes('deadline')) {
          message.error('支付超时，请重试');
        } else {
          message.error(error.message);
        }
      } else {
        message.error('支付失败，请重试');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // 处理支付成功后的操作
  const handlePaymentSuccess = async (receipt: ethers.ContractReceipt) => {
    // 解析链上事件，获取订阅信息
    let paymentEvent: Event | undefined = undefined;
    if (receipt && receipt.events) {
      paymentEvent = receipt.events.find((e: Event) => e.event === 'PaymentProcessed');
    }

    if (!paymentEvent || !paymentEvent.args) {
      message.warning('未找到支付事件，部分信息无法同步到后端');
      return;
    }

    const { amount } = paymentEvent.args;
    
    try {
      const requestData = {
        bot: bot!.id,
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
  };

  if (!bot) {
    return <Spin size="large" />;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.botCard}>
        <div className={styles.botInfo}>
          <Title level={2}>{bot.name}</Title>
          <Text>{bot.description}</Text>
          <Text strong>Price: {bot.price} USDT/month</Text>
        </div>

        <Steps current={currentStep} className={styles.steps}>
          <Steps.Step title="选择订阅计划" />
          <Steps.Step title="钱包连接和支付方式" />
          <Steps.Step title="确认订阅" />
          <Steps.Step title="完成" />
        </Steps>

        {currentStep === 0 && (
          <div className={styles.subscriptionForm}>
            <div className={styles.formItem}>
              <label>订阅时长：</label>
              <Select value={subscriptionPeriod} onChange={setSubscriptionPeriod}>
                <Option value={3}>3个月</Option>
                <Option value={6}>6个月</Option>
                <Option value={12}>12个月</Option>
              </Select>
            </div>

            <div className={styles.formItem}>
              <label>数量：</label>
              <InputNumber min={1} value={quantity} onChange={value => setQuantity(value || 1)} />
            </div>

           

            <div className={styles.totalPrice}>
              总价：{calculateTotalPrice()} USDT
            </div>

            <Button type="primary" onClick={() => setCurrentStep(1)}>
              下一步
            </Button>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.paymentMethodForm}>
            {!walletConnected ? (
              <div className={styles.connectWalletSection}>
                <Button type="primary" onClick={handleConnectWallet}>
                  连接钱包
                </Button>
              </div>
            ) : (
              <div className={styles.paymentMethodSection}>
                {isCheckingSupport ? (
                  <Spin tip="正在检测支付方式...">
                    <div className={styles.loadingContent} />
                  </Spin>
                ) : (
                  <>
                    <div className={styles.walletInfo}>
                      <Text>钱包地址：{walletAddress}</Text>
                      <Text>USDT 余额：{usdtBalance}</Text>
                    </div>

                    {isPermitSupported ? (
                      <div className={styles.paymentModeSelection}>
                        <Title level={5}>选择支付方式：</Title>
                        <Radio.Group value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                          <Radio.Button value="permit">
                            快速支付（单次交易）
                          </Radio.Button>
                          <Radio.Button value="standard">
                            标准支付（两次交易）
                          </Radio.Button>
                        </Radio.Group>
                      </div>
                    ) : (
                      <Alert
                        type="info"
                        message="当前钱包仅支持标准支付方式"
                        description="需要先授权USDT，再进行支付确认"
                      />
                    )}

                    <div className={styles.actionButtons}>
                      <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                      <Button type="primary" onClick={() => setCurrentStep(2)}>
                        下一步
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.paymentConfirmation}>
            <div className={styles.paymentSummary}>
              <Title level={4}>订阅信息确认</Title>
              <Text>订阅时长：{subscriptionPeriod} 个月</Text>
              <Text>订阅数量：{quantity}</Text>
              <Text>自动续订：{autoRenew ? '是' : '否'}</Text>
              <Text>支付金额：{calculateTotalPrice()} USDT</Text>
              <Text>支付方式：{paymentMode === 'permit' ? '快速支付' : '标准支付'}</Text>
            </div>

            <div className={styles.paymentActions}>
              {paymentMode === 'permit' ? (
                <Button 
                  type="primary" 
                  onClick={handlePayment}
                  loading={paymentLoading}
                >
                  一键订阅
                </Button>
              ) : (
                <>
                  {Number(usdtAllowance) < calculateTotalPrice() && (
                    <Button 
                      type="primary" 
                      onClick={handleApproveUSDT}
                      disabled={paymentLoading}
                    >
                      授权 USDT
                    </Button>
                  )}
                  <Button 
                    type="primary" 
                    onClick={handlePayment}
                    loading={paymentLoading}
                    disabled={Number(usdtAllowance) < calculateTotalPrice()}
                  >
                    确认支付
                  </Button>
                </>
              )}
              <Button onClick={() => setCurrentStep(1)}>上一步</Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.successMessage}>
            <Title level={3}>订阅成功！</Title>
            <Text>您已成功订阅 {bot.name}，订阅时长 {subscriptionPeriod} 个月</Text>
            <div className={styles.successActions}>
              <Button type="primary" onClick={() => window.location.href = '/bots'}>
                返回机器人列表
              </Button>
              <Button type="primary" onClick={() => navigate('/subscription')}>
                订阅管理
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default BotDetail;