from web3 import Web3
from django.conf import settings

# 初始化web3连接（假设使用Infura连接以太坊主网）
w3 = Web3(Web3.HTTPProvider(settings.INFURA_URL))

def process_payment(from_wallet, to_wallet, amount):
    """链上支付功能"""
    if not w3.isAddress(from_wallet) or not w3.isAddress(to_wallet):
        raise ValueError("Invalid wallet address")
    
    transaction = {
        'to': to_wallet,
        'from': from_wallet,
        'value': w3.toWei(amount, 'ether'),  # 转账金额（单位：ETH）
        'gas': 2000000,
        'gasPrice': w3.toWei('20', 'gwei'),
        'nonce': w3.eth.getTransactionCount(from_wallet),
    }

    # 假设用户已经签署交易并返回签名
    signed_transaction = w3.eth.account.signTransaction(transaction, private_key="用户私钥")
    
    # 发送交易
    tx_hash = w3.eth.sendRawTransaction(signed_transaction.rawTransaction)
    return tx_hash
