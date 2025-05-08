from rest_framework import serializers
from .models import BotManagement

class BotManagementSerializer(serializers.ModelSerializer):
    developer = serializers.SerializerMethodField()

    class Meta:
        model = BotManagement
        fields = [
            'id',
            'name',
            'description',
            'price',
            'trial_time',
            'status',
            'image1',
            'image2',
            'image3',
            'external_link',
            'created_at',
            'ipfs_hash',
            'ipfs_status',
            'is_ipfs_locked',
            'developer',
            'contract_bot_id'
        ]
        read_only_fields = [
            'id',
            'created_at',
            'ipfs_hash',
            'ipfs_status',
            'is_ipfs_locked',
            'contract_bot_id'
        ]

    def get_developer(self, obj):
        """
        获取开发者钱包地址
        优先返回主钱包地址，如果没有主钱包则返回第一个钱包地址
        如果没有任何钱包地址，返回零地址
        """
        if not hasattr(obj.user, 'profile'):
            return '0x0000000000000000000000000000000000000000'
        
        try:
            # 处理 wallets 为 None 的情况
            if not obj.user.profile.wallets:
                return '0x0000000000000000000000000000000000000000'
                
            import json
            wallets = json.loads(obj.user.profile.wallets)
            
            # 如果没有钱包数据，返回零地址
            if not wallets:
                return '0x0000000000000000000000000000000000000000'
            
            # 优先查找主钱包地址
            primary_wallet = None
            for address, info in wallets.items():
                if info.get('is_primary', False):
                    primary_wallet = address
                    break
            
            # 如果有主钱包，返回主钱包地址
            if primary_wallet:
                return primary_wallet if primary_wallet.startswith('0x') else f'0x{primary_wallet}'
            
            # 如果没有主钱包，返回第一个钱包地址
            first_wallet = next(iter(wallets.keys()))
            return first_wallet if first_wallet.startswith('0x') else f'0x{first_wallet}'
            
        except (json.JSONDecodeError, AttributeError, TypeError):
            return '0x0000000000000000000000000000000000000000'

    def validate(self, data):
        """
        验证数据
        """
        # 确保价格是正数
        if 'price' in data and data['price'] <= 0:
            raise serializers.ValidationError("价格必须大于0")
        
        # 确保试用时间是正数
        if 'trial_time' in data and data['trial_time'] <= 0:
            raise serializers.ValidationError("试用时间必须大于0")
        
        # 检查是否已锁定IPFS上传
        if self.instance and self.instance.is_ipfs_locked:
            raise serializers.ValidationError("机器人信息已上传到IPFS，无法修改")
        
        return data

    def create(self, validated_data):
        # 确保新创建的机器人属于当前用户
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class BotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BotManagement
        fields = [
            'id',
            'name',
            'description',
            'price',
            'trial_time',
            'status',
            'image1',
            'image2',
            'image3',
            'created_at',
            'ipfs_status'
        ]
        read_only_fields = ['id', 'created_at', 'ipfs_status']
    
    def validate(self, data):
        """
        验证数据
        """
        # 确保价格是正数
        if 'price' in data and data['price'] <= 0:
            raise serializers.ValidationError("价格必须大于0")
        
        # 确保试用时间是正数
        if 'trial_time' in data and data['trial_time'] <= 0:
            raise serializers.ValidationError("试用时间必须大于0")
        
        # 检查是否已锁定IPFS上传
        if self.instance and self.instance.is_ipfs_locked:
            raise serializers.ValidationError("机器人信息已上传到IPFS，无法修改")
        
        return data