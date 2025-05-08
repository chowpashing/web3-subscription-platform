from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from user.models import UserProfile
from .models import BotManagement
from .utils.ipfs_utils import IPFSUploader
from unittest.mock import patch, MagicMock
import io

class BotViewSetTest(APITestCase):
    def setUp(self):
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            role='developer'
        )
        
        # 创建API客户端
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # 创建测试URL
        self.url = reverse('bot-list')
        
        # 创建测试数据
        self.test_data = {
            'name': '测试机器人',
            'description': '这是一个测试机器人',
            'price': '0.1',
            'trial_time': 7
        }
        
        # 创建测试图片
        self.test_image = io.BytesIO(b'fake image data')
        self.test_image.name = 'test.jpg'
        self.test_image.content_type = 'image/jpeg'
    
    @patch('botmanagement.views.IPFSUploader')
    def test_create_bot(self, mock_ipfs_uploader):
        # 模拟IPFS上传成功
        mock_uploader = MagicMock()
        mock_uploader.upload_bot_data.return_value = {
            'success': True,
            'cid': 'QmTestHash',
            'url': 'https://ipfs.io/ipfs/QmTestHash'
        }
        mock_ipfs_uploader.return_value = mock_uploader
        
        # 准备测试数据
        data = self.test_data.copy()
        data['image'] = self.test_image
        
        # 发送创建请求
        response = self.client.post(self.url, data, format='multipart')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BotManagement.objects.count(), 1)
        
        # 验证数据库记录
        bot = BotManagement.objects.first()
        self.assertEqual(bot.name, self.test_data['name'])
        self.assertEqual(bot.description, self.test_data['description'])
        self.assertEqual(str(bot.price), self.test_data['price'])
        self.assertEqual(bot.trial_time, self.test_data['trial_time'])
        self.assertEqual(bot.ipfs_hash, 'QmTestHash')
        self.assertEqual(bot.ipfs_url, 'https://ipfs.io/ipfs/QmTestHash')
        self.assertEqual(bot.ipfs_status, 'uploaded')
        self.assertEqual(bot.user, self.user)
    
    @patch('botmanagement.views.IPFSUploader')
    def test_create_bot_ipfs_failure(self, mock_ipfs_uploader):
        # 模拟IPFS上传失败
        mock_uploader = MagicMock()
        mock_uploader.upload_bot_data.return_value = {
            'success': False,
            'error': 'IPFS上传失败'
        }
        mock_ipfs_uploader.return_value = mock_uploader
        
        # 准备测试数据
        data = self.test_data.copy()
        data['image'] = self.test_image
        
        # 发送创建请求
        response = self.client.post(self.url, data, format='multipart')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(BotManagement.objects.count(), 0)
    
    @patch('botmanagement.views.IPFSUploader')
    def test_update_bot(self, mock_ipfs_uploader):
        # 创建测试机器人
        bot = BotManagement.objects.create(
            user=self.user,
            name='原始名称',
            description='原始描述',
            price='0.1',
            trial_time=7
        )
        
        # 模拟IPFS上传成功
        mock_uploader = MagicMock()
        mock_uploader.upload_bot_data.return_value = {
            'success': True,
            'cid': 'QmNewHash',
            'url': 'https://ipfs.io/ipfs/QmNewHash'
        }
        mock_ipfs_uploader.return_value = mock_uploader
        
        # 准备更新数据
        update_data = {
            'name': '更新后的名称',
            'description': '更新后的描述',
            'price': '0.2',
            'trial_time': 14,
            'image': self.test_image
        }
        
        # 发送更新请求
        url = reverse('bot-detail', kwargs={'pk': bot.pk})
        response = self.client.patch(url, update_data, format='multipart')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 验证数据库记录
        bot.refresh_from_db()
        self.assertEqual(bot.name, update_data['name'])
        self.assertEqual(bot.description, update_data['description'])
        self.assertEqual(str(bot.price), update_data['price'])
        self.assertEqual(bot.trial_time, update_data['trial_time'])
        self.assertEqual(bot.ipfs_hash, 'QmNewHash')
        self.assertEqual(bot.ipfs_url, 'https://ipfs.io/ipfs/QmNewHash')
    
    def test_unauthorized_access(self):
        # 创建非开发者用户
        non_dev_user = User.objects.create_user(
            username='nondev',
            password='testpass123'
        )
        UserProfile.objects.create(
            user=non_dev_user,
            role='user'
        )
        
        # 使用非开发者用户认证
        self.client.force_authenticate(user=non_dev_user)
        
        # 尝试访问API
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
