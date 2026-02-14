from typing import List, Optional
from ninja import Router, Schema
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import QuizAttempt
from content.models import Kanji
import random

User = get_user_model()

router = Router()

class OptionSchema(Schema):
    text: str
    is_correct: bool

class QuestionSchema(Schema):
    kanji_id: str
    character: str
    options: List[OptionSchema]

class AnswerSchema(Schema):
    kanji_id: str
    is_correct: bool
    answer_given: Optional[str] = None

class SubmissionSchema(Schema):
    results: List[AnswerSchema]

class WrongStatSchema(Schema):
    character: str
    count: int

class AnalyticsSchema(Schema):
    total_attempts: int
    accuracy: float
    wrong_stats: List[WrongStatSchema]

@router.get("/practice/generate", response=List[QuestionSchema])
def generate_quiz(request, limit: int = 10, level: Optional[int] = None):
    qs = Kanji.objects.all()
    
    if level:
        qs = qs.filter(jlpt_level=level)

    items = list(qs)
    if len(items) < 4:
         return []
    
    # Ensure limit doesn't exceed available items
    quiz_limit = min(len(items), limit)
    selected_kanji = random.sample(items, quiz_limit)
    
    questions = []
    # Get ALL items for distractors to ensure variety even if level is filtered?
    # Actually, standard practice is distractors from same level usually, but to make it harder/easier?
    # Let's keep distractors from the same filtered set for consistency.
    
    for kanji in selected_kanji:
        # Distractors must come from the same pool (items) to ensure level consistency 
        # but excluding current kanji
        possible_distractors = [k for k in items if k.id != kanji.id]
        
        if len(possible_distractors) < 3:
             # Fallback if somehow not enough items
             distractors = possible_distractors
        else:
             distractors = random.sample(possible_distractors, 3)

        options = [
            {"text": kanji.meaning, "is_correct": True},
            *[{"text": d.meaning, "is_correct": False} for d in distractors]
        ]
        random.shuffle(options)
        
        questions.append({
            "kanji_id": str(kanji.id),
            "character": kanji.character,
            "options": options
        })
        
    return questions

@router.post("/practice/submit")
def submit_quiz(request, payload: SubmissionSchema):
    user = request.user
    if not user.is_authenticated:
        # Fallback to first user for testing purposes
        user = User.objects.first()
        if not user:
            return {"status": "error", "message": "No user available for tracking"}

    attempts = []
    for res in payload.results:
        attempts.append(QuizAttempt(
            user=user,
            kanji_id=res.kanji_id,
            is_correct=res.is_correct,
            answer_given=res.answer_given
        ))
        
    QuizAttempt.objects.bulk_create(attempts)
    return {"status": "success", "count": len(attempts)}

@router.get("/practice/analytics", response=AnalyticsSchema)
def get_analytics(request):
    user = request.user
    if not user.is_authenticated:
        user = User.objects.first()
        if not user:
            return {
                "total_attempts": 0,
                "accuracy": 0.0,
                "wrong_stats": []
            }

    qs = QuizAttempt.objects.filter(user=user)
    
    total_attempts = qs.count()
    correct_count = qs.filter(is_correct=True).count()
    accuracy = (correct_count / total_attempts * 100) if total_attempts > 0 else 0.0
    
    wrong_stats_qs = qs.filter(is_correct=False).values('kanji__character')\
        .annotate(count=Count('id')).order_by('-count')[:5]
        
    wrong_stats = [
        {"character": item['kanji__character'], "count": item['count']}
        for item in wrong_stats_qs
    ]
        
    return {
        "total_attempts": total_attempts,
        "accuracy": round(accuracy, 1),
        "wrong_stats": wrong_stats
    }
