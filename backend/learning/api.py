from typing import List, Optional, Union
from ninja import Router, Schema
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import QuizAttempt
from content.models import Kanji, Vocab, Grammar
import random

User = get_user_model()

router = Router()

class OptionSchema(Schema):
    text: str
    is_correct: bool

class QuestionSchema(Schema):
    id: str  # Generic ID (can be kanji_id, vocab_id, etc)
    character: str  # Display text (Kanji char, Vocab word, Grammar title)
    type: str       # 'kanji', 'vocab', 'grammar'
    options: List[OptionSchema]
    # Extra fields for context if needed
    reading: Optional[str] = None 
    meaning: Optional[str] = None

class AnswerSchema(Schema):
    question_id: str
    type: str # 'kanji', 'vocab', 'grammar'
    is_correct: bool
    answer_given: Optional[str] = None

class SubmissionSchema(Schema):
    results: List[AnswerSchema]

class WrongStatSchema(Schema):
    character: str
    count: int
    type: str

class AnalyticsSchema(Schema):
    total_attempts: int
    accuracy: float
    wrong_stats: List[WrongStatSchema]

@router.get("/practice/generate", response=List[QuestionSchema])
def generate_quiz(request, limit: int = 10, level: Optional[int] = None, type: str = 'kanji'):
    if type == 'kanji':
        Model = Kanji
    elif type == 'vocab' or type == 'kotoba':
        Model = Vocab
        type = 'vocab' # Normalize
    elif type == 'grammar' or type == 'bunpo':
        Model = Grammar
        type = 'grammar' # Normalize
    else:
        return [] # Invalid type

    qs = Model.objects.all()
    
    if level:
        qs = qs.filter(jlpt_level=level)

    items = list(qs)
    if len(items) < 4:
         return []
    
    # Ensure limit doesn't exceed available items
    quiz_limit = min(len(items), limit)
    selected_items = random.sample(items, quiz_limit)
    
    questions = []
    
    for item in selected_items:
        # Distractors must come from the same pool (items) to ensure level consistency 
        # but excluding current item
        possible_distractors = [k for k in items if k.id != item.id]
        
        if len(possible_distractors) < 3:
             # Fallback if somehow not enough items
             distractors = possible_distractors
        else:
             distractors = random.sample(possible_distractors, 3)

        # Prepare question data based on type
        if type == 'kanji':
            display_text = item.character
            correct_answer = item.meaning
            distractor_answers = [d.meaning for d in distractors]
            reading = None
            meaning = item.meaning
        elif type == 'vocab':
            display_text = item.word
            correct_answer = item.meaning
            distractor_answers = [d.meaning for d in distractors]
            reading = item.reading
            meaning = item.meaning
        elif type == 'grammar':
            display_text = item.title # e.g. "〜ても"
            # For grammar, maybe asking for usage or meaning? 
            # Let's assume meaning for now.
            # But Grammar model has 'structure' and 'explanation'.
            # Ideally we want a short meaning. 'explanation' might be long.
            # But creating distractors from long explanations is hard.
            # Let's use 'structure' as answer? Or 'explanation' truncated?
            # Let's use title as prompt, and structure/explanation as clue?
            # Actually, typically grammar quiz is: Sentence with blank -> select correct grammar.
            # But our data structure is: Grammar -> Sentences.
            # Doing a proper grammar quiz is complex. 
            # For "Random Grammar" mode, maybe just matching Title <-> Meaning/Explanation?
            # Let's use Explanation (truncated) as the answer for now.
            correct_answer = item.explanation[:50] + "..." if len(item.explanation) > 50 else item.explanation
            distractor_answers = [(d.explanation[:50] + "..." if len(d.explanation) > 50 else d.explanation) for d in distractors]
            reading = item.structure 
            meaning = item.explanation

        options = [
            {"text": correct_answer, "is_correct": True},
            *[{"text": d_text, "is_correct": False} for d_text in distractor_answers]
        ]
        random.shuffle(options)
        
        questions.append({
            "id": str(item.id),
            "character": display_text,
            "type": type,
            "options": options,
            "reading": reading,
            "meaning": meaning
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
        attempt_data = {
            "user": user,
            "is_correct": res.is_correct,
            "answer_given": res.answer_given
        }
        
        if res.type == 'kanji':
            attempt_data["kanji_id"] = res.question_id
        elif res.type == 'vocab':
            attempt_data["vocab_id"] = res.question_id
        elif res.type == 'grammar':
            attempt_data["grammar_id"] = res.question_id
            
        attempts.append(QuizAttempt(**attempt_data))
        
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
    
    # Get wrong stats for all types
    # This is tricky because we need to join different tables.
    # For now, let's just do Kanji errors as it's the main feature, or try to aggregate.
    # Group by all foreign keys is hard in one query.
    # Let's fetch top 5 wrong regardless of type? 
    # Or just fetch top 5 wrong Kanji for now to keep it simple and consistent with previous behavior.
    
    wrong_stats_qs = qs.filter(is_correct=False, kanji__isnull=False).values('kanji__character')\
        .annotate(count=Count('id')).order_by('-count')[:5]
        
    wrong_stats = [
        {"character": item['kanji__character'], "count": item['count'], "type": "kanji"}
        for item in wrong_stats_qs
    ]
    
    # We could also add Vocab errors...
    wrong_vocab_qs = qs.filter(is_correct=False, vocab__isnull=False).values('vocab__word')\
        .annotate(count=Count('id')).order_by('-count')[:5]
    
    for item in wrong_vocab_qs:
        wrong_stats.append({
            "character": item['vocab__word'], 
            "count": item['count'], 
            "type": "vocab"
        })

    # Add Grammar errors
    wrong_grammar_qs = qs.filter(is_correct=False, grammar__isnull=False).values('grammar__title')\
        .annotate(count=Count('id')).order_by('-count')[:5]

    for item in wrong_grammar_qs:
        wrong_stats.append({
            "character": item['grammar__title'],
            "count": item['count'],
            "type": "grammar"
        })
        
    # Sort combined stats
    wrong_stats.sort(key=lambda x: x['count'], reverse=True)
        
    return {
        "total_attempts": total_attempts,
        "accuracy": round(accuracy, 1),
        "wrong_stats": wrong_stats[:5]
    }

@router.post("/practice/reset")
def reset_progress(request):
    user = request.user
    if not user.is_authenticated:
        user = User.objects.first()
        if not user:
             return {"status": "error", "message": "No user available"}

    # Delete all attempts for this user
    deleted_count, _ = QuizAttempt.objects.filter(user=user).delete()
    
    return {
        "status": "success",
        "message": f"Deleted {deleted_count} attempts",
        "deleted_count": deleted_count
    }
