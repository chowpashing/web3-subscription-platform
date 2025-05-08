from rest_framework import permissions
import logging

logger = logging.getLogger(__name__)

class IsDeveloper(permissions.BasePermission):
    """
    自定义权限类，只允许开发者访问
    """
    def has_permission(self, request, view):
        # 记录权限检查的详细信息
        logger.info(f"Checking permission for user: {request.user}")
        logger.info(f"User is authenticated: {request.user.is_authenticated}")
        logger.info(f"User has profile: {hasattr(request.user, 'userprofile')}")
        if hasattr(request.user, 'userprofile'):
            logger.info(f"User is developer: {request.user.userprofile.is_developer}")
        
        # 检查用户是否已认证且是开发者
        has_permission = request.user.is_authenticated and hasattr(request.user, 'userprofile') and request.user.userprofile.is_developer
        logger.info(f"Permission check result: {has_permission}")
        return has_permission

    def has_object_permission(self, request, view, obj):
        # 确保用户只能操作自己的机器人
        has_permission = obj.user == request.user
        logger.info(f"Object permission check for user {request.user}: has_permission={has_permission}")
        return has_permission

class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # 允许任何已登录用户查看，但只有开发者可以修改
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and 
                   hasattr(request.user, 'userprofile') and 
                   request.user.userprofile.is_developer)

class IsAuthenticated(permissions.BasePermission):
    """
    自定义权限类，只检查用户是否已登录
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated 