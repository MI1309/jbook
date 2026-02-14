from ninja import NinjaAPI
from content.api import router as content_router
from learning.api import router as learning_router
from users.api import router as users_router
from content.admin_api import router as admin_router

api = NinjaAPI()

api.add_router("/content", content_router)
api.add_router("/learning", learning_router)
api.add_router("/auth", users_router)
api.add_router("/admin", admin_router)
