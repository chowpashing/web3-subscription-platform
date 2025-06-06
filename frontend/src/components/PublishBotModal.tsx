import { useState } from 'react';
import { Modal, Steps, Button, message, Alert } from 'antd';
import { ethers } from 'ethers';
import { Bot, PublishResponse, PublishConfirmResponse } from '../types/bot';
import { uploadToIPFS, publishBot, confirmPublish } from '../services/botService';
import { BOT_REGISTRY_ABI } from '../contracts/abi';

const { Step } = Steps;

interface PublishBotModalProps {
  bot: Bot;
  visible: boolean;
  onSuccess: (data: PublishConfirmResponse['data']) => void;
  onCancel: () => void;
}

const PublishBotModal: React.FC<PublishBotModalProps> = ({
  bot,
  visible,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishData, setPublishData] = useState<PublishConfirmResponse['data'] | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // 获取 Sepolia 区块浏览器链接
  const getExplorerLink = (hash: string) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  // 1. 上传到IPFS
  const handleUploadToIPFS = async () => {
    try {
      setPublishing(true);
      const response = await uploadToIPFS(bot.id);
      console.log('IPFS upload response:', response);
      
      if (response && response.ipfs_status === 'uploaded' && response.ipfs_hash) {
        message.success('Upload to IPFS successful');
        setCurrentStep(1);
      } else {
        message.error('Upload failed: ' + (response.error || 'No IPFS hash obtained'));
      }
    } catch (error: unknown) {
      console.error('IPFS upload error:', error);
      message.error(error instanceof Error ? error.message : 'Upload failed');
      setCurrentStep(0);
    } finally {
      setPublishing(false);
    }
  };

  // 2. 发布到区块链
  const handlePublish = async () => {
    try {
      setPublishing(true);
      
      // 1. 获取发布数据
      const response = await publishBot(bot.id);
      console.log('Publish response:', response);
      
      if (response.status !== 'ready') {
        throw new Error('Failed to get publish data');
      }

      // 2. 连接钱包
      if (!window.ethereum) {
        throw new Error('Please install MetaMask wallet');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // 请求连接钱包
      const signer = provider.getSigner();
      
      // 3. 创建合约实例
      const contract = new ethers.Contract(
        response.data.contractAddress,
        BOT_REGISTRY_ABI,
        signer
      );
      console.log('contract address:', contract.address);
      console.log('contract ABI:', contract.interface.fragments);

      // 4. 调用合约方法
      const { botData } = response.data;
      console.log('registerBot params:', botData.ipfsHash, botData.price, botData.trialTime, botData.name, botData.description);
      const tx = await contract.registerBot(
        botData.ipfsHash,
        botData.price,
        botData.trialTime,
        botData.name,
        botData.description
      );
      console.log('registerBot tx:', tx);
      console.log('registerBot tx hash:', tx.hash);
      
      // 5. 等待交易确认
      message.info('Transaction submitted, waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('registerBot receipt:', receipt);
      console.log('registerBot receipt.logs:', receipt.logs);
      
      // 6. 保存发布数据和交易哈希
      const hash = receipt.transactionHash;
      setTransactionHash(hash);
      setPublishData({
        ...response.data,
        transactionHash: hash
      });
      
      message.success('Contract call successful');
      setCurrentStep(2);
      
    } catch (error: unknown) {
      console.error('Publish error:', error);
      message.error(error instanceof Error ? error.message : 'Publish failed');
      setCurrentStep(1);
    } finally {
      setPublishing(false);
    }
  };

  // 3. 确认发布
  const handleConfirmPublish = async () => {
    if (!publishData || !publishData.transactionHash) {
      message.error('Missing transaction hash');
      return;
    }
    
    try {
      setPublishing(true);
      const response = await confirmPublish(bot.id, publishData.transactionHash);
      if (response.status === 'success') {
        message.success('Publish successful');
        onSuccess(publishData);
        onCancel();
      }
    } catch (error: unknown) {
      console.error('Confirm publish error:', error);
      message.error(error instanceof Error ? error.message : 'Confirm publish failed');
      setCurrentStep(1);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal
      title="Publish Bot"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Steps current={currentStep}>
        <Step title="Upload to IPFS" description="Upload bot data to IPFS" />
        <Step title="Publish to Blockchain" description="Publish bot to blockchain" />
        <Step title="Confirm Publish" description="Confirm publish completed" />
      </Steps>

      {transactionHash && (
        <Alert
          style={{ marginTop: 16 }}
          message="Transaction submitted to blockchain"
          description={
            <div>
              <p>Transaction hash: {transactionHash}</p>
              <p>
                You can view the transaction details on the 
                <a 
                  href={getExplorerLink(transactionHash)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Sepolia block explorer
                </a>
                {' '}View transaction details
              </p>
            </div>
          }
          type="success"
          showIcon
        />
      )}

      <div style={{ marginTop: 24 }}>
        {currentStep === 0 && (
          <Button 
            type="primary" 
            onClick={handleUploadToIPFS}
            loading={publishing}
          >
            Upload to IPFS
          </Button>
        )}

        {currentStep === 1 && (
          <Button 
            type="primary" 
            onClick={handlePublish}
            loading={publishing}
          >
            Publish to Blockchain
          </Button>
        )}

        {currentStep === 2 && (
          <Button 
            type="primary" 
            onClick={handleConfirmPublish}
            loading={publishing}
          >
            Confirm Publish
          </Button>
        )}

        <Button 
          style={{ marginLeft: 8 }} 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default PublishBotModal;