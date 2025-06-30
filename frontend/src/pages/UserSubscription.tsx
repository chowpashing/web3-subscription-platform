import React, { useState, useEffect } from 'react';
import { message, Table } from 'antd';
import axios from '../utils/axios';
import { ethers } from 'ethers';
import { NEW_BOT_SUBSCRIPTION_CONTRACT_ADDRESS, switchToOpSepolia, NETWORK_CONFIG } from '../contracts/addresses';
import { SUBSCRIPTION_ABI } from '../contracts/abis/subscription';


interface SubscriptionRecord {
  id: number;
  bot: string;
  contract_bot_id: number;
  payment_time: string;
  payment_amount: number;
  currency: string;
  transaction_hash: string;
  expiration_date: string;
  status: string;
  active: boolean;
  trial_period_hours: number;
  status_description: string;
  message: string;
  cancel_subscription_url?: string;
}

function UserSubscription() {
  const [subscriptionRecords, setSubscriptionRecords] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionRecords();
  }, []);

  const fetchSubscriptionRecords = async () => {
    try {
      const response = await axios.get('/api/subscription/status/');
      const data = Array.isArray(response.data) ? response.data : [response.data];
      setSubscriptionRecords(data);
    } catch {
      message.error('获取订阅记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (botId: number, transactionHash: string) => {
    try {
      // 确保连接到 OP Sepolia 网络
      await switchToOpSepolia();
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      
      // 检查网络
      const network = await provider.getNetwork();
      if (network.chainId !== NETWORK_CONFIG.chainId) {
        throw new Error('请切换到 OP Sepolia 网络');
      }
      
      const subscriptionContract = new ethers.Contract(
        NEW_BOT_SUBSCRIPTION_CONTRACT_ADDRESS,
        SUBSCRIPTION_ABI,
        signer
      );
      const userAddress = await signer.getAddress();
      // 获取链上订阅详情
      const subscription = await subscriptionContract.getSubscription(userAddress, botId);
      const trialEndTime = new Date(Number(subscription.trialEndTime) * 1000);
      const now = new Date();
      if (now > trialEndTime) {
        throw new Error(`试用期已结束。试用期到期时间为 ${trialEndTime.toLocaleString()}`);
      }
      // 二次校验链上试用期
      const isTrial = await subscriptionContract.isTrialActive(userAddress, botId);
      if (!isTrial) {
        throw new Error(`试用期已结束或链上状态不同步。`);
      }
      const tx = await subscriptionContract.cancel(botId);
      await tx.wait();
      message.success('订阅已取消');
      // 只使用原始交易哈希
      await axios.post('/api/subscription/set_inactive/', { 
        transaction_hash: transactionHash
      });
      fetchSubscriptionRecords();
    } catch (error: any) {
      message.error(error.message || '取消订阅失败');
    }
  };

  const columns = [
    {
      title: 'Bot',
      dataIndex: 'bot',
      key: 'bot',
    },
    {
      title: 'Payment Time',
      dataIndex: 'payment_time',
      key: 'payment_time',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: 'Payment Amount',
      dataIndex: 'payment_amount',
      key: 'payment_amount',
      render: (amount: number, record: SubscriptionRecord) => 
        amount ? `${amount} ${record.currency || ''}` : '-',
    },
    {
      title: 'Expiration Date',
      dataIndex: 'expiration_date',
      key: 'expiration_date',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status_description',
      key: 'status_description',
      render: (text: string) => text ? text.charAt(0).toUpperCase() + text.slice(1) : '-',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (text: string, record: any) => {
        // 获取链上 trialEndTime 并本地化展示
        if (record.status_description === 'trial' && record.contract_bot_id) {
     
          const match = text && text.match(/Before ([^,]+), you/);
          if (match && match[1]) {
            const localTime = new Date(match[1]).toLocaleString();
            return (
              <span>
                {text.replace(match[1], localTime)}
                <a onClick={() => handleCancelSubscription(record.contract_bot_id, record.transaction_hash)} style={{ marginLeft: '10px', cursor: 'pointer' }}>
                  Cancel Subscription
                </a>
              </span>
            );
          }
        }
        return <span>{text}</span>;
      },
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean, record: SubscriptionRecord) => (
        <span>
          {active ? (
            <a href={`/bot/${record.bot}`} target="_blank" rel="noopener noreferrer">
              Access Bot
            </a>
          ) : 'No'}
        </span>
      ),
    },
    {
      title: 'Trial Time',
      dataIndex: 'trial_period_hours',
      key: 'trial_period_hours',
      render: (time: number) => time > 0 ? `${time} hours` : 'No trial',
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="subscription-container">
      <h1>Subscription Management</h1>
      <Table dataSource={subscriptionRecords} columns={columns} rowKey="id" />
    </div>
  );
}

export default UserSubscription;