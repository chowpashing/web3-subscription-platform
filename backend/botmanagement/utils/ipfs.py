import json
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class IPFSUploader:
    def __init__(self):
        self.pinata_jwt = settings.PINATA_JWT
        self.pinata_endpoint = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
        
    def upload_bot_data(self, bot_data):
        """
        上传机器人数据到IPFS
        
        Args:
            bot_data (dict): 包含机器人信息的字典
            
        Returns:
            dict: 包含上传结果的字典
                {
                    'success': bool,
                    'cid': str,  # 如果成功
                    'url': str,  # 如果成功
                    'error': str  # 如果失败
                }
        """
        try:
            headers = {
                'Authorization': f'Bearer {self.pinata_jwt}',
                'Content-Type': 'application/json'
            }
            
            # 准备上传数据
            payload = {
                'pinataContent': bot_data
            }
            
            # 发送请求到Pinata
            response = requests.post(
                self.pinata_endpoint,
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                ipfs_hash = result['IpfsHash']
                ipfs_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
                
                return {
                    'success': True,
                    'cid': ipfs_hash,
                    'url': ipfs_url
                }
            else:
                error_msg = f"Pinata API错误: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"IPFS上传失败: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            } 