from django.shortcuts import render

# Create your views here.
# trading_bot/views.py
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import TradingBot
from .serializers import TradingBotSerializer

@api_view(['POST'])
def upload_trading_bot(request):
    if request.user.is_developer:  # 确保用户是开发者
        data = request.data
        trading_bot = TradingBot.objects.create(
            developer=request.user.wallet_address,
            name=data['name'],
            description=data.get('description', ''),
            price_per_day=data['price_per_day'],
            trial_days=data['trial_days'],
            strategy_tags=data['strategy_tags'],
        )
        return JsonResponse({"status": "success", "bot_id": trading_bot.id})
    else:
        return JsonResponse({"status": "error", "message": "Only developers can upload trading bots."})


@api_view(['GET'])
def get_trading_bots(request):
    bots = TradingBot.objects.filter(audit_status=TradingBot.AuditStatus.APPROVED)
    bots_data = []
    for bot in bots:
        bots_data.append({
            "id": str(bot.id),
            "name": bot.name,
            "price_per_day": bot.price_per_day,
            "strategy_tags": bot.strategy_tags,
            "trial_days": bot.trial_days,
        })
    return JsonResponse({"status": "success", "data": bots_data})


@api_view(['GET'])
def get_trading_bot_detail(request, bot_id):
    try:
        bot = TradingBot.objects.get(id=bot_id, audit_status=TradingBot.AuditStatus.APPROVED)
        bot_data = {
            "name": bot.name,
            "description": bot.description,
            "price_per_day": bot.price_per_day,
            "strategy_tags": bot.strategy_tags,
            "trial_days": bot.trial_days,
        }
        return JsonResponse({"status": "success", "data": bot_data})
    except TradingBot.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Bot not found or not approved."})
