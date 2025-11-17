from rest_framework import permissions

class IsRegularUser(permissions.BasePermission):
    """
    Allow only logged in users whose user.is_regular_user is True.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_regular_user", False))
