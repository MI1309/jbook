from typing import List, Optional, Union
from ninja import Router, Schema
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import QuizAttempt, UserProgress
from .tts_logic import CrosswordGenerator
from content.models import Kanji, Vocab, Grammar, Particle, MinnaQuestion, DoukaiPassage, DoukaiQuestion
import random
import uuid
from datetime import datetime, timedelta

from ninja_jwt.authentication import JWTAuth
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
    level: Optional[int] = None

class MinnaQuestionSchema(Schema):
    id: str
    character: str
    type: str
    options: List[OptionSchema]
    reading: Optional[str] = None
    meaning: Optional[str] = None
    level: Optional[int] = None
    question_type: str
    explanation: Optional[str] = None
    book: Optional[int] = None
    chapter: Optional[int] = None

class TTSSchema(Schema):
    grid: List[List[str]]
    clues: List[dict]
    size: int

class AnswerSchema(Schema):
    question_id: str
    type: str # 'kanji', 'vocab', 'grammar'
    is_correct: bool
    answer_given: Optional[str] = None
    mode: Optional[str] = 'choice'



class SubmissionSchema(Schema):
    results: List[AnswerSchema]

class WrongStatSchema(Schema):
    character: str
    count: int
    type: str
    status: Optional[str] = None
    level: Optional[int] = None

class LevelStatSchema(Schema):
    level: int
    total: int
    correct: int
    accuracy: float

class KakitoriLevelSchema(Schema):
    level: int
    total: int
    correct: int
    accuracy: float

class KakitoriAttemptDetailSchema(Schema):
    id: uuid.UUID
    character: str
    reading: str
    answer_given: Optional[str]
    is_correct: bool
    timestamp: datetime

class KakitoriStatsSchema(Schema):
    total_attempts: int     # jumlah sesi (submit)
    total_questions: int    # total soal kakitori
    correct: int
    accuracy: float
    level_breakdown: List[KakitoriLevelSchema]
    recent_details: List[KakitoriAttemptDetailSchema] = [] # ← tambah ini

class AnalyticsSchema(Schema):
    total_attempts: int
    accuracy: float
    wrong_stats: List[WrongStatSchema]
    level_stats: List[LevelStatSchema]
    kakitori_stats: KakitoriStatsSchema  # ← tambah ini

class QuizAttemptExportSchema(Schema):
    kanji_id: Optional[uuid.UUID] = None
    vocab_id: Optional[uuid.UUID] = None
    grammar_id: Optional[uuid.UUID] = None
    particle_id: Optional[uuid.UUID] = None
    minna_question_id: Optional[uuid.UUID] = None
    is_correct: bool
    answer_given: Optional[str] = None
    timestamp: datetime
    type: Optional[str] = None
    label: Optional[str] = None
    wrong_count: Optional[int] = 0
    mode: Optional[str] = 'choice'


class UserProgressExportSchema(Schema):
    content_type_app: str
    content_type_model: str
    object_id: uuid.UUID
    srs_stage: int
    next_review: Optional[datetime] = None
    last_reviewed: Optional[datetime] = None

class DoukaiQuestionSchema(Schema):
    id: uuid.UUID
    question_text: str
    is_correct: bool
    explanation: str
    order: int

class DoukaiPassageSchema(Schema):
    id: uuid.UUID
    title: str
    text_jp: str
    text_id: Optional[str] = None
    book: Optional[int] = None
    chapter: Optional[int] = None
    jlpt_level: Optional[int] = None
    created_at: datetime
    question_count: int

class DoukaiPassageDetailSchema(DoukaiPassageSchema):
    questions: List[DoukaiQuestionSchema]

class ExportDataSchema(Schema):
    attempts: List[QuizAttemptExportSchema]
    progress: List[UserProgressExportSchema]

@router.get("/practice/generate", response=List[QuestionSchema])
def generate_quiz(request, limit: int = 10, level: Optional[str] = None, type: str = 'kanji'):
    # Cap the limit to a reasonable high value for full level review
    limit = min(max(1, limit), 2000)

    # Support multiple types and levels (comma separated)
    requested_types = [t.strip().lower() for t in type.split(',')]
    requested_levels = [int(l.strip()) for l in level.split(',') if l.strip().isdigit()] if level else []

    questions = []
    
    # Pre-fetch items from database with minimal fields to save memory
    # We use a combined approach to handle multiple types efficiently
    item_pool = []
    
    for t in requested_types:
        if t == 'kanji':
            qs = Kanji.objects.all()
            d_type = 'kanji'
        elif t in ['vocab', 'kotoba']:
            qs = Vocab.objects.all()
            d_type = 'vocab'
        elif t in ['grammar', 'bunpo']:
            qs = Grammar.objects.all()
            d_type = 'grammar'
        elif t == 'particle':
            qs = Particle.objects.all()
            d_type = 'particle'
        elif t == 'kana':
            # Kana is handled separately as it's not in DB
            from utils.kana import ROMAJI_MAP
            items = list(ROMAJI_MAP.items())
            random.shuffle(items)
            for romaji, kana in items[:limit]:
                all_romaji = [k for k, v in items if k != romaji]
                distractor_romaji = random.sample(all_romaji, 3)
                options = [{"text": romaji, "is_correct": True}, *[{"text": dr, "is_correct": False} for dr in distractor_romaji]]
                random.shuffle(options)
                questions.append({"id": f"kana_{kana}", "character": kana, "type": "kana", "options": options, "reading": romaji, "meaning": f"Karakter Kana: {kana}", "level": 0})
            continue
        else:
            continue

        if requested_levels:
            qs = qs.filter(jlpt_level__in=requested_levels)
        
        # Optimize: select only needed fields and limit pool for distractors
        # We need the full pool if limit is high, but we'll use iterator to save memory
        type_items = list(qs)
        if not type_items: continue
        
        # Sample items for questions
        sample_size = min(len(type_items), limit)
        selected_items = random.sample(type_items, sample_size)
        
        for item in selected_items:
            item_pool.append({
                'item': item,
                'type': d_type,
                'full_type_pool': type_items # Reference for distractors
            })

    if not item_pool:
        return questions

    # Shuffle the combined pool from all types
    random.shuffle(item_pool)
    final_selection = item_pool[:limit]
    
    from utils.kana import format_reading, to_kana

    for entry in final_selection:
        item = entry['item']
        d_type = entry['type']
        pool = entry['full_type_pool']
        
        # Fast distractor sampling
        # We pick 10 random items from pool and filter to get 3 unique distractors
        distractor_candidates = random.sample(pool, min(len(pool), 10))
        distractors = [d for d in distractor_candidates if d.id != item.id][:3]

        # Prepare question data
        if d_type == 'kanji':
            display_text = item.character
            correct_answer = item.meaning
            distractor_answers = [d.meaning for d in distractors]
            reading = f"On: {format_reading(item.onyomi, True)} | Kun: {format_reading(item.kunyomi, False)}"
            meaning = item.meaning
        elif d_type == 'vocab':
            display_text = item.word
            correct_answer = item.meaning
            distractor_answers = [d.meaning for d in distractors]
            reading = to_kana((item.furigana or item.reading or "").lower())
            meaning = item.meaning
        elif d_type == 'grammar':
            display_text = item.title
            correct_answer = item.explanation
            distractor_answers = [d.explanation for d in distractors]
            reading = item.structure 
            meaning = item.explanation
        elif d_type == 'particle':
            if item.sentences:
                sentence = random.choice(item.sentences)
                display_text = sentence.get("jp", item.character)
                correct_answer = sentence.get("answer", item.character.split()[0])
            else:
                display_text = item.character
                correct_answer = item.character.split()[0]
            distractor_answers = [d.character.split()[0] for d in distractors]
            reading = item.explanation
            meaning = item.meaning

        options = [{"text": correct_answer, "is_correct": True}, *[{"text": d_text, "is_correct": False} for d_text in distractor_answers]]
        random.shuffle(options)
        
        questions.append({
            "id": str(item.id),
            "character": display_text,
            "type": d_type,
            "options": options,
            "reading": reading,
            "meaning": meaning,
            "level": getattr(item, 'jlpt_level', None)
        })
        
    return questions

@router.get("/practice/minna/generate", response=List[MinnaQuestionSchema])
def generate_minna_quiz(request, book: Optional[str] = None, chapter: Optional[str] = None, type: Optional[str] = None, limit: int = 10, level: Optional[str] = None):
    limit = min(max(1, limit), 50)
    qs = MinnaQuestion.objects.all()
    if book:
        books = [int(b.strip()) for b in book.split(',') if b.strip().isdigit()]
        if books:
            qs = qs.filter(book__in=books)
    if chapter:
        chapters = [int(c.strip()) for c in chapter.split(',') if c.strip().isdigit()]
        if chapters:
            qs = qs.filter(chapter__in=chapters)
    if type:
        types = [t.strip().lower() for t in type.split(',') if t.strip()]
        if types:
            qs = qs.filter(question_type__in=types)
    if level:
        levels = [int(l.strip()) for l in level.split(',') if l.strip().isdigit()]
        if levels:
            qs = qs.filter(jlpt_level__in=levels)
            
    questions_list = list(qs.order_by('?')[:limit])
    
    questions_data = []
    for q in questions_list:
        options = []
        for opt in q.options:
            options.append({
                "text": opt,
                "is_correct": opt == q.correct_answer
            })
        if q.correct_answer and not any(o["text"] == q.correct_answer for o in options):
            options.append({
                "text": q.correct_answer,
                "is_correct": True
            })
        random.shuffle(options)
        
        display_char = q.question_jp
        if q.question_type == 'context_match' and not display_char:
            display_char = q.question_id

        questions_data.append({
            "id": str(q.id),
            "character": display_char,
            "type": "minna",
            "options": options,
            "reading": q.question_id,
            "meaning": q.correct_answer,
            "level": q.jlpt_level,
            "question_type": q.question_type,
            "explanation": q.explanation,
            "book": q.book,
            "chapter": q.chapter,
        })
    return questions_data

@router.get("/tts/generate", response=TTSSchema)
def generate_tts(request, level: Optional[int] = 5, limit: int = 15):
    # Fetch random vocab words for the crossword
    qs = Vocab.objects.filter(jlpt_level=level).order_by('?')[:limit * 2]
    words_data = []
    for v in qs:
        # We need clean words (no brackets for now or handle them)
        clean_word = v.word.replace('[', '').replace(']', '').replace(' ', '')
        words_data.append({
            'id': str(v.id),
            'word': clean_word,
            'meaning': v.meaning
        })

    # Try to generate a good crossword
    best_grid = None
    best_clues = []
    max_words = 0

    # Try a few times to get a dense grid
    for _ in range(5):
        random.shuffle(words_data)
        gen = CrosswordGenerator(words_data, size=15)
        grid, clues = gen.generate()
        if len(clues) > max_words:
            max_words = len(clues)
            best_grid = grid
            best_clues = clues
            if max_words >= limit: break

    return {
        "grid": best_grid,
        "clues": best_clues,
        "size": 15
    }

# ─── Doukai Endpoints ────────────────────────────────────────────────────────

@router.get("/doukai/count")
def get_doukai_count(request):
    """Cek apakah ada passage doukai tersedia (untuk disable UI)"""
    return {"count": DoukaiPassage.objects.count()}

@router.get("/doukai/passages", response=List[DoukaiPassageSchema])
def list_doukai_passages(request, book: Optional[int] = None, chapter: Optional[int] = None):
    """List semua passage doukai (read-only)"""
    qs = DoukaiPassage.objects.all()
    if book:
        qs = qs.filter(book=book)
    if chapter:
        qs = qs.filter(chapter=chapter)
    return qs

@router.get("/doukai/passages/{id}", response=DoukaiPassageDetailSchema)
def get_doukai_passage(request, id: uuid.UUID):
    """Detail passage beserta daftar soalnya"""
    passage = get_object_or_404(DoukaiPassage, id=id)
    return passage

@router.post("/practice/submit", auth=JWTAuth())
def submit_quiz(request, payload: SubmissionSchema):
    user = request.auth
    attempts = []
    
    # Pre-fetch all past attempts for this user to calculate accuracy efficiently
    # Or just query per item if there are not many items in a payload (usually 10)
    for res in payload.results:
        attempt_data = {
            "user": user,
            "is_correct": res.is_correct,
            "answer_given": res.answer_given,
            "mode": res.mode or 'choice',
        }
        
        filter_kwargs = {"user": user}
        if res.type == 'kanji':
            attempt_data["kanji_id"] = res.question_id
            filter_kwargs["kanji_id"] = res.question_id
        elif res.type == 'vocab':
            attempt_data["vocab_id"] = res.question_id
            filter_kwargs["vocab_id"] = res.question_id
        elif res.type in ['grammar', 'bunpo']:
            attempt_data["grammar_id"] = res.question_id
            filter_kwargs["grammar_id"] = res.question_id
        elif res.type == 'particle':
            attempt_data["particle_id"] = res.question_id
            filter_kwargs["particle_id"] = res.question_id
        elif res.type == 'minna':
            attempt_data["minna_question_id"] = res.question_id
            filter_kwargs["minna_question_id"] = res.question_id
            
        if res.is_correct:
            # Get past attempts for this specific question
            past_attempts = QuizAttempt.objects.filter(**filter_kwargs)
            try:
                total_past = past_attempts.count()
                correct_past = past_attempts.filter(is_correct=True).count()
                
                # Add current attempt to calculation
                total_attempts = total_past + 1
                correct_attempts = correct_past + 1
                
                # Calculate accuracy
                accuracy = (correct_attempts / total_attempts) * 100
                
                # If accuracy is 80% or more, delete the wrong attempts
                if accuracy >= 80.0:
                    past_attempts.filter(is_correct=False).delete()
            except Exception:
                pass
            
        try:
            attempts.append(QuizAttempt(**attempt_data))
        except Exception:
            pass
        
    if attempts:
        QuizAttempt.objects.bulk_create(attempts)
    return {"status": "success", "count": len(attempts), "results": "saved"}

@router.get("/practice/analytics", response=AnalyticsSchema, auth=JWTAuth())
def get_analytics(request):
    user = request.auth

    qs = QuizAttempt.objects.filter(user=user)
    
    total_attempts = qs.count()
    correct_count = qs.filter(is_correct=True).count()
    accuracy = (correct_count / total_attempts * 100) if total_attempts > 0 else 0.0

    def get_status_label(wrong, right):
        if wrong <= 0: return None
        if wrong == 1 and right >= 1: return None
        if wrong >= 4: return "Perbaiki"
        if wrong == 3: return "Cukup"
        if wrong == 2: return "Lumayan"
        return "Lumayan" # Default for 1 wrong 0 right

    # Kanji stats
    kanji_stats = qs.filter(kanji__isnull=False).values('kanji__character', 'kanji__jlpt_level')\
        .annotate(
            wrong=Count('id', filter=Q(is_correct=False)),
            right=Count('id', filter=Q(is_correct=True))
        ).order_by('-wrong')[:30]
        
    wrong_stats = []
    for item in kanji_stats:
        if item['wrong'] > 0:
            wrong_stats.append({
                "character": item['kanji__character'], 
                "count": item['wrong'], 
                "type": "kanji",
                "status": get_status_label(item['wrong'], item['right']),
                "level": item['kanji__jlpt_level']
            })
    
    # Vocab stats
    vocab_stats = qs.filter(vocab__isnull=False).values('vocab__word', 'vocab__jlpt_level')\
        .annotate(
            wrong=Count('id', filter=Q(is_correct=False)),
            right=Count('id', filter=Q(is_correct=True))
        ).order_by('-wrong')[:30]
    
    for item in vocab_stats:
        if item['wrong'] > 0:
            wrong_stats.append({
                "character": item['vocab__word'], 
                "count": item['wrong'], 
                "type": "vocab",
                "status": get_status_label(item['wrong'], item['right']),
                "level": item['vocab__jlpt_level']
            })

    # Grammar stats
    grammar_stats = qs.filter(grammar__isnull=False).values('grammar__title', 'grammar__jlpt_level')\
        .annotate(
            wrong=Count('id', filter=Q(is_correct=False)),
            right=Count('id', filter=Q(is_correct=True))
        ).order_by('-wrong')[:30]

    for item in grammar_stats:
        if item['wrong'] > 0:
            wrong_stats.append({
                "character": item['grammar__title'],
                "count": item['wrong'],
                "type": "grammar",
                "status": get_status_label(item['wrong'], item['right']),
                "level": item['grammar__jlpt_level']
            })
        
    # Particle stats
    particle_stats = qs.filter(particle__isnull=False).values('particle__character', 'particle__jlpt_level')\
        .annotate(
            wrong=Count('id', filter=Q(is_correct=False)),
            right=Count('id', filter=Q(is_correct=True))
        ).order_by('-wrong')[:30]

    for item in particle_stats:
        if item['wrong'] > 0:
            wrong_stats.append({
                "character": item['particle__character'],
                "count": item['wrong'],
                "type": "particle",
                "status": get_status_label(item['wrong'], item['right']),
                "level": item['particle__jlpt_level']
            })

    # Minna question stats
    minna_stats = qs.filter(minna_question__isnull=False).values('minna_question__question_jp', 'minna_question__jlpt_level')\
        .annotate(
            wrong=Count('id', filter=Q(is_correct=False)),
            right=Count('id', filter=Q(is_correct=True))
        ).order_by('-wrong')[:30]

    for item in minna_stats:
        if item['wrong'] > 0:
            wrong_stats.append({
                "character": item['minna_question__question_jp'][:30],
                "count": item['wrong'],
                "type": "minna",
                "status": get_status_label(item['wrong'], item['right']),
                "level": item['minna_question__jlpt_level']
            })
        
    # Sort combined stats
    wrong_stats.sort(key=lambda x: x['count'], reverse=True)
    
    # Calculate Level Stats
    level_stats_raw = {}
    for lvl in range(1, 6):
        level_qs = qs.filter(
            Q(kanji__jlpt_level=lvl) | 
            Q(vocab__jlpt_level=lvl) | 
            Q(grammar__jlpt_level=lvl) |
            Q(particle__jlpt_level=lvl) |
            Q(minna_question__jlpt_level=lvl)
        )
        total = level_qs.count()
        if total > 0:
            correct = level_qs.filter(is_correct=True).count()
            level_stats_raw[lvl] = {
                "level": lvl,
                "total": total,
                "correct": correct,
                "accuracy": round((correct / total * 100), 1)
            }

    # ── Kakitori Stats ──
    kakitori_qs = qs.filter(mode='kakitori')
    k_total = kakitori_qs.count()
    k_correct = kakitori_qs.filter(is_correct=True).count()
    # Anggap 1 submit ≈ 1 sesi; fallback konservatif jika data lama tidak menyimpan session id
    k_sessions = 0
    if k_total > 0:
        k_sessions = max(1, (k_total + 9) // 10)

    k_level_map = {}
    for lvl in range(1, 6):
        lvl_qs = kakitori_qs.filter(
            Q(kanji__jlpt_level=lvl) |
            Q(vocab__jlpt_level=lvl) |
            Q(grammar__jlpt_level=lvl) |
            Q(particle__jlpt_level=lvl)
        )
        total = lvl_qs.count()
        if total > 0:
            correct = lvl_qs.filter(is_correct=True).count()
            k_level_map[lvl] = {
                "level": lvl,
                "total": total,
                "correct": correct,
                "accuracy": round(correct / total * 100, 1)
            }

    # Fetch recent kakitori details for the new history feature
    recent_k_attempts = kakitori_qs.order_by('-timestamp')[:50]
    recent_details = []
    for att in recent_k_attempts:
        char = ""
        reading = ""
        if att.kanji:
            char = att.kanji.character
            reading = att.kanji.onyomi[0] if att.kanji.onyomi else (att.kanji.kunyomi[0] if att.kanji.kunyomi else "")
        elif att.vocab:
            char = att.vocab.word
            reading = att.vocab.reading
        
        recent_details.append({
            "id": att.id,
            "character": char,
            "reading": reading,
            "answer_given": att.answer_given,
            "is_correct": att.is_correct,
            "timestamp": att.timestamp
        })

    kakitori_stats = {
        "total_attempts": k_sessions,
        "total_questions": k_total,
        "correct": k_correct,
        "accuracy": round(k_correct / k_total * 100, 1) if k_total > 0 else 0.0,
        "level_breakdown": sorted(k_level_map.values(), key=lambda x: x['level'], reverse=True),
        "recent_details": recent_details
    }

    return {
        "total_attempts": total_attempts,
        "accuracy": round(accuracy, 1),
        "wrong_stats": wrong_stats[:50],
        "level_stats": sorted(level_stats_raw.values(), key=lambda x: x['level'], reverse=True),
        "kakitori_stats": kakitori_stats
    }

@router.post("/practice/reset", auth=JWTAuth())
def reset_progress(request):
    user = request.auth

    # Delete all attempts for this user
    deleted_count, _ = QuizAttempt.objects.filter(user=user).delete()
    
    return {
        "status": "success",
        "message": f"Deleted {deleted_count} attempts",
        "deleted_count": deleted_count
    }

@router.get("/practice/export", response=ExportDataSchema, auth=JWTAuth())
def export_practice_data(request):
    user = request.auth
    
    attempts = QuizAttempt.objects.filter(user=user)
    progress = UserProgress.objects.filter(user=user)
    
    # Pre-calculate mistake counts for all items to avoid N+1 queries in loops
    mistake_counts = attempts.filter(is_correct=False).values('kanji_id', 'vocab_id', 'grammar_id', 'particle_id', 'minna_question_id')\
        .annotate(count=Count('id'))
    
    # Create a lookup map
    lookup = {}
    for entry in mistake_counts:
        key = entry['kanji_id'] or entry['vocab_id'] or entry['grammar_id'] or entry['particle_id'] or entry['minna_question_id']
        if key: lookup[str(key)] = entry['count']

    # Fetch all related labels at once to avoid N+1 in the loop
    from content.models import Kanji, Vocab, Grammar, Particle, MinnaQuestion
    kanji_map = {str(k.id): k.character for k in Kanji.objects.filter(id__in=attempts.values_list('kanji_id', flat=True).distinct()) if k.id}
    vocab_map = {str(v.id): v.word for v in Vocab.objects.filter(id__in=attempts.values_list('vocab_id', flat=True).distinct()) if v.id}
    grammar_map = {str(g.id): g.title for g in Grammar.objects.filter(id__in=attempts.values_list('grammar_id', flat=True).distinct()) if g.id}
    p_map = {str(p.id): p.character for p in Particle.objects.filter(id__in=attempts.values_list('particle_id', flat=True).distinct()) if p.id}
    minna_map = {str(m.id): m.question_jp[:30] for m in MinnaQuestion.objects.filter(id__in=attempts.values_list('minna_question_id', flat=True).distinct()) if m.id}

    export_attempts = []
    for a in attempts:
        target_id = None
        item_type = None
        label = None
        
        if a.kanji_id:
            target_id = a.kanji_id
            item_type = 'kanji'
            label = kanji_map.get(str(a.kanji_id))
        elif a.vocab_id:
            target_id = a.vocab_id
            item_type = 'vocab'
            label = vocab_map.get(str(a.vocab_id))
        elif a.grammar_id:
            target_id = a.grammar_id
            item_type = 'grammar'
            label = grammar_map.get(str(a.grammar_id))
        elif a.particle_id:
            target_id = a.particle_id
            item_type = 'particle'
            label = p_map.get(str(a.particle_id))
        elif a.minna_question_id:
            target_id = a.minna_question_id
            item_type = 'minna'
            label = minna_map.get(str(a.minna_question_id))

        export_attempts.append({
            "kanji_id": a.kanji_id,
            "vocab_id": a.vocab_id,
            "grammar_id": a.grammar_id,
            "particle_id": a.particle_id,
            "minna_question_id": a.minna_question_id,
            "is_correct": a.is_correct,
            "answer_given": a.answer_given,
            "timestamp": a.timestamp,
            "type": item_type,
            "label": label,
            "wrong_count": lookup.get(str(target_id), 0) if target_id else 0,
            "mode": a.mode
        })

        
    export_progress = []
    for p in progress:
        export_progress.append({
            "content_type_app": p.content_type.app_label,
            "content_type_model": p.content_type.model,
            "object_id": p.object_id,
            "srs_stage": p.srs_stage,
            "next_review": p.next_review,
            "last_reviewed": p.last_reviewed
        })
        
    return {
        "attempts": export_attempts,
        "progress": export_progress
    }

@router.post("/practice/import", auth=JWTAuth())
def import_practice_data(request, payload: ExportDataSchema):
    user = request.auth
    from django.contrib.contenttypes.models import ContentType
    
    new_attempts = []
    skipped_count = 0
    
    for a in payload.attempts:
        # Check if already exists to avoid duplication if imported multiple times
        exists = QuizAttempt.objects.filter(
            user=user,
            kanji_id=a.kanji_id,
            vocab_id=a.vocab_id,
            grammar_id=a.grammar_id,
            particle_id=a.particle_id,
            minna_question_id=a.minna_question_id,
            is_correct=a.is_correct,
            timestamp__gte=a.timestamp - timedelta(seconds=1),
            timestamp__lte=a.timestamp + timedelta(seconds=1)
        ).exists()
        
        if not exists:
            new_attempts.append(QuizAttempt(
                user=user,
                kanji_id=a.kanji_id,
                vocab_id=a.vocab_id,
                grammar_id=a.grammar_id,
                particle_id=a.particle_id,
                minna_question_id=a.minna_question_id,
                is_correct=a.is_correct,
                answer_given=a.answer_given,
                timestamp=a.timestamp,
                mode=(a.mode or 'choice')
            ))
        else:
            skipped_count += 1
            
    if new_attempts:
        QuizAttempt.objects.bulk_create(new_attempts)
        
    progress_count = 0
    for p in payload.progress:
        try:
            ct = ContentType.objects.get(app_label=p.content_type_app, model=p.content_type_model)
            UserProgress.objects.update_or_create(
                user=user,
                content_type=ct,
                object_id=p.object_id,
                defaults={
                    "srs_stage": p.srs_stage,
                    "next_review": p.next_review,
                    "last_reviewed": p.last_reviewed
                }
            )
            progress_count += 1
        except ContentType.DoesNotExist:
            continue
            
    return {
        "status": "success",
        "imported": len(new_attempts),
        "skipped": skipped_count,
        "progress_updated": progress_count,
        "message": f"Berhasil mengimpor {len(new_attempts)} data latihan. {skipped_count} data sudah ada (dilewati)."
    }
