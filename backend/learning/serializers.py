from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from ninja import Schema
from pydantic import Field


class VocabularySchema(Schema):
    id: UUID
    word: str
    reading: str
    meaning: str
    jlpt_level: int
    examples: List[dict]


class UserVocabularyCreateSchema(Schema):
    vocabulary_id: UUID


class UserVocabularyUpdateSchema(Schema):
    status: Optional[Literal["new", "learning", "mastered"]] = None
    box_level: Optional[int] = Field(default=None, ge=0, le=5)
    next_review_date: Optional[date] = None


class VocabularyReviewSchema(Schema):
    correct: bool


class UserVocabularySchema(Schema):
    id: int
    vocabulary: VocabularySchema
    status: Literal["new", "learning", "mastered"]
    box_level: int
    next_review_date: Optional[date] = None
    times_reviewed: int
    created_at: datetime
    updated_at: datetime


class DailyActivitySchema(Schema):
    date: date
    items_studied: int


class ActivityBreakdownSchema(Schema):
    activity_type: str
    items_studied: int


class UserDashboardStatsSchema(Schema):
    total_saved: int
    mastered: int
    learning: int
    new: int
    daily_activity: List[DailyActivitySchema]
    activity_breakdown: List[ActivityBreakdownSchema]
