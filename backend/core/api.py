from ninja import NinjaAPI
from content.api import router as content_router

api = NinjaAPI()

api.add_router("/content", content_router)
