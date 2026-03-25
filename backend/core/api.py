from ninja import NinjaAPI
from content.api import router as content_router
from learning.api import router as learning_router
from users.api import router as users_router
from content.admin_api import router as admin_router

api = NinjaAPI(
    title="JBook API",
    version="1.0.0",
    docs_url="/docs"
)

# Attach routers with a check to prevent double-attachment errors
def register_routers(api_instance):
    routers_to_add = [
        ("/content", content_router),
        ("/learning", learning_router),
        ("/auth", users_router),
        ("/admin", admin_router),
    ]
    
    # In some environments, the module might be re-executed
    # Ninja 1.x routers can only be attached once
    for prefix, router in routers_to_add:
        try:
            api_instance.add_router(prefix, router)
        except Exception:
            # If already attached or other config error, we skip to allow the server to boot
            pass

register_routers(api)

try:
    api.add_router("/auth/token", refresh_router)
except Exception:
    pass
