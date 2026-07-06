from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from ninja.errors import HttpError
from functools import wraps
from ninja_jwt.authentication import JWTAuth


def rate_limit(key='ip', rate='100/m', block=False):
    """Decorator for Django Ninja endpoints to rate limit requests.
    
    Keys supported:
    - 'ip': By IP address (default)
    - 'user': By authenticated user (works with JWT
    """
    def decorator(func):
        @wraps(func)
        @ratelimit(key=key, rate=rate, block=block)
        def wrapped_func(request, *args, **kwargs):
            if getattr(request, 'limited', False):
                raise HttpError(429, "Too many requests. Please try again later.")
            return func(request, *args, **kwargs)
        return wrapped_func
    return decorator
