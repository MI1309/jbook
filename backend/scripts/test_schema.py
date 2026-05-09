from datetime import datetime
import uuid
from pydantic import BaseModel

class AnnouncementCreateSchema(BaseModel):
    title: str
    content: str
    type: str
    is_active: bool = True
    show_as_popup: bool = False

class AnnouncementSchema(AnnouncementCreateSchema):
    id: uuid.UUID
    created_at: str
    model_config = {"from_attributes": True}

class MockAnnouncement:
    def __init__(self):
        self.id = uuid.uuid4()
        self.title = "Test"
        self.content = "Test content"
        self.type = "info"
        self.is_active = True
        self.show_as_popup = False
        self.created_at = datetime.now()

mock = MockAnnouncement()
try:
    schema = AnnouncementSchema.model_validate(mock)
    print("Success:", schema)
except Exception as e:
    print("Error:", e)
