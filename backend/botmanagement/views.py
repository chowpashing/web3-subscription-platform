from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from .models import BotManagement
from .serializers import BotSerializer, BotManagementSerializer
from user.models import UserProfile
from .utils.ipfs import IPFSUploader
import logging
from django.utils import timezone
from web3 import Web3
from django.conf import settings
from .permissions import IsAuthenticated
import json
import os

logger = logging.getLogger(__name__)

# 在文件开头添加
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOT_REGISTRY_ABI_PATH = os.path.join(BASE_DIR, '..', 'blockchain', 'artifacts', 'contracts', 'BotRegistry.sol', 'BotRegistry.json')

# 初始化 Web3
w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URL))

# 加载合约 ABI
with open(BOT_REGISTRY_ABI_PATH) as f:
    BOT_REGISTRY_ABI = json.load(f)['abi']

# 创建合约实例
bot_registry_contract = w3.eth.contract(
    address=settings.BOT_REGISTRY_CONTRACT_ADDRESS,
    abi=BOT_REGISTRY_ABI
)

class BotViewSet(viewsets.ModelViewSet):
    queryset = BotManagement.objects.all()
    serializer_class = BotManagementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # 获取当前用户
        user = self.request.user
        # 只返回当前用户创建的机器人
        return BotManagement.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        try:
            # 获取上传的图片
            image_file = request.FILES.get('image')
            
            # 准备数据库保存数据
            db_data = {
                'user': request.user,
                'name': request.data.get('name'),
                'description': request.data.get('description'),
                'price': request.data.get('price'),
                'trial_time': request.data.get('trial_time', 0),
                'status': 'draft',
                'ipfs_status': 'pending',
                'is_ipfs_locked': False
            }
            
            # 如果有图片，保存到本地
            if image_file:
                db_data['image1'] = image_file
            
            # 创建机器人记录
            bot = BotManagement.objects.create(**db_data)
            
            # 序列化并返回数据
            serializer = self.get_serializer(bot)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"创建机器人失败: {str(e)}")
            return Response(
                {'error': f"创建机器人失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # 检查是否已锁定IPFS上传
            if instance.is_ipfs_locked:
                return Response(
                    {'error': "机器人信息已上传到IPFS，无法修改"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 获取上传的新图片
            image_file = request.FILES.get('image')
            
            # 更新字段
            instance.name = request.data.get('name', instance.name)
            instance.description = request.data.get('description', instance.description)
            instance.price = request.data.get('price', instance.price)
            instance.trial_time = request.data.get('trial_time', instance.trial_time)
            
            # 如果有新图片，更新图片
            if image_file:
                instance.image1 = image_file
            
            # 保存更新
            instance.save()
            
            # 序列化并返回数据
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"更新机器人失败: {str(e)}")
            return Response(
                {'error': f"更新机器人失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='upload_to_ipfs')
    def upload_to_ipfs(self, request, pk=None):
        logger.info(f"Received upload_to_ipfs request for bot {pk}")
        try:
            instance = self.get_object()
            logger.info(f"Found bot instance: {instance.name}")
            
            # 检查是否已锁定
            if instance.is_ipfs_locked:
                logger.warning(f"Bot {pk} is already locked for IPFS upload")
                return Response(
                    {'error': "机器人信息已上传到IPFS，无法重复上传"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 准备机器人数据
            bot_data = {
                'name': instance.name,
                'description': instance.description,
                'price': str(int(float(instance.price) * 10**6)),  # 转换为USDT的最小单位（6位小数）
                'trial_time': instance.trial_time,
                'created_by': instance.user.id
            }
            logger.info(f"Prepared bot data: {bot_data}")
            
            # 初始化IPFS上传器
            ipfs_uploader = IPFSUploader()
            
            # 上传到IPFS
            logger.info("Starting IPFS upload...")
            ipfs_result = ipfs_uploader.upload_bot_data(bot_data)
            logger.info(f"IPFS upload result: {ipfs_result}")
            
            if not ipfs_result['success']:
                instance.ipfs_status = 'failed'
                instance.save()
                logger.error(f"IPFS upload failed: {ipfs_result.get('error', '未知错误')}")
                return Response(
                    {'error': f"IPFS上传失败: {ipfs_result.get('error', '未知错误')}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # 更新IPFS相关字段
            instance.ipfs_hash = ipfs_result['cid']
            instance.ipfs_url = ipfs_result['url']
            instance.ipfs_status = 'uploaded'
            instance.ipfs_uploaded_at = timezone.now()
            instance.is_ipfs_locked = True
            instance.save()
            logger.info(f"Successfully updated bot {pk} with IPFS data")
            
            # 序列化并返回数据
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"上传到IPFS失败: {str(e)}")
            return Response(
                {'error': f"上传到IPFS失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        try:
            instance = self.get_object()
            
            # 1. 验证机器人信息是否完整
            if not instance.ipfs_hash or instance.ipfs_status != 'uploaded':
                return Response(
                    {'error': "请先上传到IPFS"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 2. 准备上链数据
            bot_data = {
                'ipfsHash': instance.ipfs_hash,
                'price': str(int(float(instance.price) * 10**6)),  # 转换为USDT的最小单位（6位小数）
                'trialTime': instance.trial_time,
                'name': instance.name,
                'description': instance.description
            }
            
            # 3. 返回需要签名的数据
            return Response({
                'status': 'ready',
                'data': {
                    'contractAddress': settings.BOT_REGISTRY_CONTRACT_ADDRESS,
                    'botData': bot_data,
                    'method': 'registerBot'
                }
            })
            
        except Exception as e:
            logger.error(f"准备上链数据失败: {str(e)}")
            return Response(
                {'error': f"准备上链数据失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def confirm_publish(self, request, pk=None):
        try:
            instance = self.get_object()
            transaction_hash = request.data.get('transactionHash')
            
            logger.info(f"开始处理confirm_publish请求，Bot ID: {pk}, Transaction Hash: {transaction_hash}")
            
            if not transaction_hash:
                logger.error("请求中缺少transactionHash")
                return Response(
                    {'error': "缺少交易哈希"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 第一步：验证交易是否成功上链
            try:
                logger.info(f"开始验证交易 {transaction_hash}")
                logger.info("尝试获取交易收据...")
                tx_receipt = w3.eth.get_transaction_receipt(transaction_hash)
                logger.info(f"成功获取交易收据: {tx_receipt}")
                
                if not tx_receipt:
                    logger.error("未找到交易收据")
                    return Response(
                        {'error': "未找到交易收据"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if tx_receipt.status != 1:
                    logger.error(f"交易状态不是成功: {tx_receipt.status}")
                    return Response(
                        {'error': f"交易状态不是成功: {tx_receipt.status}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # 等待区块确认
                current_block = w3.eth.block_number
                confirmations = current_block - tx_receipt.blockNumber
                logger.info(f"当前区块: {current_block}, 交易区块: {tx_receipt.blockNumber}, 确认数: {confirmations}")
                
                # 在开发环境中允许0个确认数
                if not settings.DEBUG and confirmations < 1:
                    logger.info(f"等待区块确认，当前确认数: {confirmations}")
                    return Response(
                        {'error': "交易正在确认中，请稍后再试"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
            except Exception as e:
                logger.error(f"验证交易状态失败: {str(e)}")
                logger.error("详细错误信息:", exc_info=True)
                return Response(
                    {'error': f"验证交易状态失败: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # 第二步：验证机器人是否在合约中注册
            try:
                logger.info(f"开始验证机器人 {pk} 的注册状态")
                logger.info(f"合约地址: {settings.BOT_REGISTRY_CONTRACT_ADDRESS}")
                
                # 从交易日志中获取机器人ID
                bot_id = None
                logger.info(f"交易日志数量: {len(tx_receipt.logs)}")
                for idx, log in enumerate(tx_receipt.logs):
                    logger.info(f"处理第 {idx+1} 个日志")
                    logger.info(f"日志地址: {log.address}")
                    logger.info(f"日志主题: {log.topics}")
                    
                    if log.address.lower() == settings.BOT_REGISTRY_CONTRACT_ADDRESS.lower():
                        # 解析日志数据
                        bot_id = int.from_bytes(log.topics[1], 'big')
                        logger.info(f"从日志中获取到机器人ID: {bot_id}")
                        break
                
                if not bot_id:
                    logger.error("未从交易日志中找到机器人ID")
                    return Response(
                        {'error': "未从交易日志中找到机器人ID"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # 使用从日志中获取的ID查询合约
                logger.info(f"开始查询合约，机器人ID: {bot_id}")
                bot_details = bot_registry_contract.functions.getBotDetails(bot_id).call()
                logger.info(f"获取到机器人详情: {bot_details}")
                
                if not bot_details:
                    logger.error("未找到机器人详情")
                    return Response(
                        {'error': "未找到机器人详情"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if not bot_details[6]:  # isActive 字段
                    logger.error("机器人未激活")
                    return Response(
                        {'error': "机器人未激活"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # 更新数据库中的机器人ID
                instance.contract_bot_id = bot_id
                instance.save()
                logger.info(f"成功更新数据库中的机器人ID: {bot_id}")
                
            except Exception as e:
                logger.error(f"验证机器人注册状态失败: {str(e)}")
                logger.error("详细错误信息:", exc_info=True)
                return Response(
                    {'error': f"验证机器人注册状态失败: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 所有验证都通过后，更新状态
            instance.status = 'published'
            instance.transaction_hash = transaction_hash
            instance.published_at = timezone.now()
            instance.save()
            
            logger.info(f"Bot {pk} published successfully with transaction hash: {transaction_hash}")
            
            return Response({
                'status': 'success',
                'message': '机器人发布成功',
                'data': {
                    'transaction_hash': transaction_hash,
                    'ipfs_hash': instance.ipfs_hash,
                    'ipfs_url': instance.ipfs_url
                }
            })
                
        except Exception as e:
            logger.error(f"确认发布失败: {str(e)}")
            logger.error("详细错误信息:", exc_info=True)
            return Response(
                {'error': f"确认发布失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def published(self, request):
        """
        获取所有已发布的机器人
        """
        try:
            # 查询所有状态为published的机器人
            bots = BotManagement.objects.filter(status='published')
            serializer = self.get_serializer(bots, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"获取已发布机器人失败: {str(e)}")
            return Response(
                {'error': f"获取已发布机器人失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def get_published_bot(self, request, pk=None):
        """
        获取已发布的特定机器人
        """
        try:
            # 查询状态为published的特定机器人
            bot = BotManagement.objects.filter(status='published', id=pk).first()
            if not bot:
                return Response(
                    {'error': "机器人不存在或未发布"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = self.get_serializer(bot)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"获取已发布机器人失败: {str(e)}")
            return Response(
                {'error': f"获取已发布机器人失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
