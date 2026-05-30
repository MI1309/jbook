from ninja import Router, Schema
from typing import List, Optional
from pydantic import BaseModel
from ninja.security import HttpBearer
from .models import Kanji, Grammar, Blog, ContentSuggestion, Announcement, Vocab
from django.shortcuts import get_object_or_404
from django.db.models import Q
from uuid import UUID
from datetime import datetime
from django.http import HttpResponse

router = Router()

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        from ninja_jwt.authentication import JWTAuth
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            # JWTAuth returns (user, token)
            auth_result = JWTAuth().authenticate(request, token)
            if auth_result:
                user = auth_result[0] if isinstance(auth_result, tuple) else auth_result
                # Pastikan user adalah objek User dan punya akses staff
                if user and (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
                    return user
        except Exception as e:
            print(f"Auth error: {e}")
            return None
        return None

class VocabSchema(Schema):
    id: UUID
    word: str
    reading: str
    meaning: str
    word_type: Optional[str] = None
    jlpt_level: int
    furigana: Optional[str] = None
    examples: List[dict] = []

class UpdateVocabSchema(Schema):
    meaning: Optional[str] = None
    word_type: Optional[str] = None
    reading: Optional[str] = None
    furigana: Optional[str] = None

class UpdateKanjiSchema(Schema):
    meaning: Optional[str] = None
    onyomi: Optional[List[str]] = None
    kunyomi: Optional[List[str]] = None
    strokes: Optional[int] = None
    jlpt_level: Optional[int] = None

@router.put("/vocab/{vocab_id}", response=VocabSchema, auth=AuthBearer())
def update_vocab(request, vocab_id: UUID, data: UpdateVocabSchema):
    vocab = get_object_or_404(Vocab, id=vocab_id)
    for attr, value in data.dict(exclude_unset=True).items():
        setattr(vocab, attr, value)
    vocab.save()
    return vocab

@router.put("/kanji/{kanji_id}", response=KanjiSchema, auth=AuthBearer())
def update_kanji(request, kanji_id: UUID, data: UpdateKanjiSchema):
    kanji = get_object_or_404(Kanji, id=kanji_id)
    for attr, value in data.dict(exclude_unset=True).items():
        setattr(kanji, attr, value)
    kanji.save()
    return kanji

class AnnouncementSchema(Schema):
    id: UUID
    title: str
    content: str
    type: str
    priority: int
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None
    is_active: bool
    show_as_popup: bool
    created_at: datetime

class AnnouncementCreateSchema(Schema):
    title: str
    content: str
    type: str
    is_active: Optional[bool] = True
    show_as_popup: Optional[bool] = False

@router.get("/announcements", response=List[AnnouncementSchema])
def list_announcements(request, response: HttpResponse):
    from django.utils import timezone
    from django.db.models import Q
    
    now = timezone.now()
    qs = Announcement.objects.filter(
        is_active=True,
        deleted_at__isnull=True
    ).filter(
        Q(show_from__isnull=True) | Q(show_from__lte=now)
    ).filter(
        Q(show_until__isnull=True) | Q(show_until__gte=now)
    ).order_by('-priority', '-created_at')
    
    response["Cache-Control"] = "public, max-age=300"
    return qs

class BlogSchema(Schema):
    id: UUID
    title: str
    slug: str
    content: str
    tags: List[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime

class KanjiSchema(Schema):
    id: UUID
    character: str
    meaning: str
    onyomi: List[str]
    kunyomi: List[str]
    strokes: int
    jlpt_level: int
    word_type: Optional[str] = None
    examples: List[dict] = []
    svg_data: Optional[str] = None

class GrammarSchema(Schema):
    id: UUID
    title: str
    structure: str
    explanation: str
    chapter: int
    jlpt_level: int
    sentences: List[dict] = []

class KanjiListResponse(BaseModel):
    items: List[KanjiSchema]
    total: int
    page: int
    pages: int

class GrammarListResponse(BaseModel):
    items: List[GrammarSchema]
    total: int
    page: int
    pages: int

@router.get("/kanji", response=KanjiListResponse)
def list_kanji(request, 
               level: Optional[int] = None, 
               search: Optional[str] = None,
               radical: Optional[str] = None,
               limit: int = 50,
               page: int = 1):
    qs = Kanji.objects.all()
    
    if level:
        qs = qs.filter(jlpt_level=level)
        
    if radical:
        qs = qs.filter(radical=radical)
        
    if search:
        # Search in character, meaning, onyomi, kunyomi
        # For JSON fields (onyomi, kunyomi), we can use contains if it's a list of strings
        # or just reliable text search on character and meaning
        from django.db.models import Q
        qs = qs.filter(
            Q(character__icontains=search) | 
            Q(meaning__icontains=search) |
            Q(onyomi__icontains=search) |  # Simple text matching in JSON array string representation
            Q(kunyomi__icontains=search)
        )
        
    # Order by level and strokes for consistency
    qs = qs.order_by('jlpt_level', 'strokes')
    
    total = qs.count()
    pages = (total + limit - 1) // limit
    offset = (page - 1) * limit
    
    # Pagination
    results = list(qs[offset : offset + limit])
    
    from utils.kana import to_kana, to_katakana
    
    # Dynamically add word_type from Vocab and format readings
    from .models import Vocab
    for k in results:
        v = Vocab.objects.filter(word=k.character).first()
        if v:
            k.word_type = v.word_type
        else:
            v_tilde = Vocab.objects.filter(word=f"～{k.character}").first()
            if v_tilde:
                k.word_type = v_tilde.word_type
        
        # Format onyomi/kunyomi to Katakana/Hiragana (defensive: data can contain nulls)
        k.onyomi = [to_katakana(r.lower()) for r in (k.onyomi or []) if isinstance(r, str) and r]
        k.kunyomi = [to_kana(r.lower()) for r in (k.kunyomi or []) if isinstance(r, str) and r]

    return {
        "items": results,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/kanji/{kanji_id}", response=KanjiSchema)
def get_kanji(request, kanji_id: str):
    try:
        # Menangani UUID baik dengan atau tanpa strip
        if '-' not in kanji_id and len(kanji_id) == 32:
            import uuid
            kanji_id = str(uuid.UUID(kanji_id))
    except (ValueError, TypeError):
        pass
        
    kanji = get_object_or_404(Kanji, id=kanji_id)
    from .models import Vocab
    
    # Dynamically find vocabulary that contains this Kanji
    vocab_matches = Vocab.objects.filter(word__contains=kanji.character)[:10]
    
    # Convert to example format
    dynamic_examples = []
    for v in vocab_matches:
        dynamic_examples.append({
            "word": v.word,
            "reading": v.reading,
            "meaning": v.meaning,
            "type": v.word_type
        })
        
    # Merge with existing static examples, avoiding duplicates by word
    existing_words = {ex.get('word') for ex in kanji.examples}
    
    # We create a new list to avoid mutating the database object directly if it's cached
    merged_examples = list(kanji.examples)
    for dex in dynamic_examples:
        if dex['word'] not in existing_words:
            merged_examples.append(dex)
            existing_words.add(dex['word'])
            
    # Update the object's examples field for the response (doesn't save to DB)
    kanji.examples = merged_examples
    
    # Also find top-level word_type if not already set (fallback)
    if not kanji.word_type:
        v = Vocab.objects.filter(word=kanji.character).first()
        if v:
            kanji.word_type = v.word_type
        else:
            v_tilde = Vocab.objects.filter(word=f"～{kanji.character}").first()
            if v_tilde:
                kanji.word_type = v_tilde.word_type
    
    # Format readings
    from utils.kana import to_kana, to_katakana
    kanji.onyomi = [to_katakana(r.lower()) for r in (kanji.onyomi or []) if isinstance(r, str) and r]
    kanji.kunyomi = [to_kana(r.lower()) for r in (kanji.kunyomi or []) if isinstance(r, str) and r]
            
    return kanji

@router.get("/bunpo", response=GrammarListResponse)
@router.get("/grammar", response=GrammarListResponse)
def list_grammar(request, 
                 level: Optional[int] = None,
                 search: Optional[str] = None,
                 chapter: Optional[int] = None,
                 limit: int = 50,
                 page: int = 1):
    qs = Grammar.objects.all()
    if level:
        qs = qs.filter(jlpt_level=level)

    if chapter:
        qs = qs.filter(chapter=chapter)

    if search:
        from django.db.models import Q
        qs = qs.filter(
            Q(title__icontains=search) | 
            Q(structure__icontains=search) | 
            Q(explanation__icontains=search)
        )
    
    # Order by chapter then title
    qs = qs.order_by('chapter', 'title')
    
    total = qs.count()
    pages = (total + limit - 1) // limit
    offset = (page - 1) * limit
    
    return {
        "items": list(qs[offset : offset + limit]),
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/bunpo/{grammar_id}", response=GrammarSchema)
@router.get("/grammar/{grammar_id}", response=GrammarSchema)
def get_grammar(request, grammar_id: str):
    try:
        if '-' not in grammar_id and len(grammar_id) == 32:
            import uuid
            grammar_id = str(uuid.UUID(grammar_id))
    except (ValueError, TypeError):
        pass
    return get_object_or_404(Grammar, id=grammar_id)


class VocabSchema(Schema):
    id: UUID
    word: str
    reading: Optional[str] = None
    furigana: Optional[str] = None
    meaning: str
    word_type: Optional[str] = None
    jlpt_level: int
    examples: List[dict] = []

@router.get("/random-kotoba", response=VocabSchema)
def get_random_kotoba(request):
    from .models import Vocab
    # Efficient enough for small datasets
    vocab = Vocab.objects.order_by('?').first()
    if not vocab:
        return 404, {"message": "No vocabulary found"}
    return vocab

class VocabListResponse(BaseModel):
    items: List[VocabSchema]
    total: int
    page: int
    pages: int
    debug_level: Optional[int] = None
    debug_search: Optional[str] = None

@router.get("/kotoba", response=VocabListResponse)
@router.get("/vocab", response=VocabListResponse)
def list_vocab(request, 
               level: Optional[int] = None,
               search: Optional[str] = None,
               word_type: Optional[str] = None,
               limit: int = 50,
               page: int = 1):
    from .models import Vocab
    from django.db.models import Q
    from utils.kana import to_kana
    
    qs = Vocab.objects.all().order_by('word')
    
    if level is not None:
        qs = qs.filter(jlpt_level=level)
        
    if word_type:
        qs = qs.filter(word_type=word_type)

    if search:
        search_kana = to_kana(search)
        qs = qs.filter(
            Q(word__icontains=search) | 
            Q(reading__icontains=search) | 
            Q(meaning__icontains=search) |
            Q(word__icontains=search_kana) | # If word is simple kana
            Q(reading__icontains=search_kana) # Determine if input was romaji, searching in kana reading
        )
        
    total = qs.count()
    pages = (total + limit - 1) // limit
    offset = (page - 1) * limit
    
    items = list(qs[offset : offset + limit])
    from utils.kana import to_kana
    for v in items:
        if v.reading:
            v.reading = to_kana(v.reading.lower())
        if v.furigana:
            v.furigana = to_kana(v.furigana.lower())
            
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages,
        "debug_level": level,
        "debug_search": search
    }



@router.get("/kotoba/{vocab_id}", response=VocabSchema)
@router.get("/vocab/{vocab_id}", response=VocabSchema)
def get_vocab(request, vocab_id: str):
    from .models import Vocab
    try:
        if '-' not in vocab_id and len(vocab_id) == 32:
            import uuid
            vocab_id = str(uuid.UUID(vocab_id))
    except (ValueError, TypeError):
        pass
    vocab = get_object_or_404(Vocab, id=vocab_id)
    from utils.kana import to_kana
    if vocab.reading:
        vocab.reading = to_kana(vocab.reading.lower())
    if vocab.furigana:
        vocab.furigana = to_kana(vocab.furigana.lower())
    return vocab


@router.get("/kotoba/{vocab_id}/audio")
@router.get("/vocab/{vocab_id}/audio")
def get_vocab_audio(request, vocab_id: str):
    from .models import Vocab
    import requests
    from django.http import StreamingHttpResponse
    import urllib.parse
    
    try:
        if '-' not in vocab_id and len(vocab_id) == 32:
            import uuid
            vocab_id = str(uuid.UUID(vocab_id))
    except (ValueError, TypeError):
        pass
        
    vocab = get_object_or_404(Vocab, id=vocab_id)
    text = vocab.word
    
    # Remove annotations/examples from text if present
    if " " in text:
        text = text.split(" ")[0]
    if "(" in text:
        text = text.split("(")[0]
    if "（" in text:
        text = text.split("（")[0]
        
    # Use reading for accurate furigana pronunciation if available
    text_to_speak = vocab.reading if vocab.reading else text
    
    encoded_text = urllib.parse.quote(text_to_speak)
    tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q={encoded_text}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    req = requests.get(tts_url, headers=headers, stream=True)
    response = StreamingHttpResponse(
        req.iter_content(chunk_size=4096),
        content_type="audio/mpeg"
    )
    response["Content-Disposition"] = f'inline; filename="{vocab_id}.mp3"'
    return response


@router.get("/tts")
def get_arbitrary_tts(request, text: str):
    import requests
    from django.http import StreamingHttpResponse
    import urllib.parse
    
    encoded_text = urllib.parse.quote(text)
    tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q={encoded_text}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    req = requests.get(tts_url, headers=headers, stream=True)
    response = StreamingHttpResponse(
        req.iter_content(chunk_size=4096),
        content_type="audio/mpeg"
    )
    return response



class VocabCreateSchema(Schema):
    word: str
    reading: Optional[str] = None
    furigana: Optional[str] = None
    meaning: Optional[str] = None
    word_type: Optional[str] = None
    jlpt_level: Optional[int] = 5
    examples: List[dict] = []

class SyncRequestSchema(Schema):
    data: List[dict]

class TranslateRequestSchema(Schema):
    text: str

@router.post("/kotoba", response={200: VocabSchema, 400: dict})
@router.post("/vocab", response={200: VocabSchema, 400: dict})
def create_vocab(request, payload: VocabCreateSchema):
    from .models import Vocab
    try:
        vocab = Vocab.objects.create(**payload.dict())
        return 200, vocab
    except Exception as e:
        return 400, {"error": str(e)}

@router.put("/kotoba/{vocab_id}", response={200: VocabSchema, 404: dict, 400: dict})
@router.put("/vocab/{vocab_id}", response={200: VocabSchema, 404: dict, 400: dict})
def update_vocab(request, vocab_id: str, payload: VocabCreateSchema):
    from .models import Vocab
    vocab = get_object_or_404(Vocab, id=vocab_id)
    try:
        for attr, value in payload.dict().items():
            setattr(vocab, attr, value)
        vocab.save()
        return 200, vocab
    except Exception as e:
        return 400, {"error": str(e)}

@router.delete("/kotoba/{vocab_id}")
@router.delete("/vocab/{vocab_id}")
def delete_vocab(request, vocab_id: str):
    from .models import Vocab
    vocab = get_object_or_404(Vocab, id=vocab_id)
    vocab.delete()
    return {"success": True}

@router.post("/kotoba/sync")
def sync_kotoba(request, payload: SyncRequestSchema):
    from utils.kotoba_sync import sync_kotoba_data
    stats = sync_kotoba_data(payload.data)
    return stats

@router.post("/kotoba/translate")
def translate_kotoba(request, payload: TranslateRequestSchema):
    from utils.kotoba_sync import translate_ja_to_id, generate_furigana
    meaning = translate_ja_to_id(payload.text)
    furigana = generate_furigana(payload.text)
    return {"word": payload.text, "meaning": meaning, "furigana": furigana}

from ninja import File
from ninja.files import UploadedFile

@router.post("/kotoba/import")
def import_kotoba(request, file: UploadedFile = File(...)):
    import json
    from utils.kotoba_sync import sync_kotoba_data
    try:
        data = json.loads(file.read().decode('utf-8'))
        if not isinstance(data, list):
            return 400, {"error": "Format JSON harus array/list of objects."}
        stats = sync_kotoba_data(data)
        return stats
    except Exception as e:
        return 400, {"error": str(e)}

@router.get("/blog", response=List[BlogSchema])
def list_blog(request):
    return Blog.objects.filter(is_published=True).order_by('-created_at')

@router.get("/blog/{slug}", response=BlogSchema)
def get_blog(request, slug: str):
    return get_object_or_404(Blog, slug=slug, is_published=True)

class SuggestionSchema(Schema):
    type: str
    data: dict

@router.post("/suggest")
def suggest_content(request, payload: SuggestionSchema):
    from django.core.mail import send_mail
    from django.conf import settings
    import json
    from django.http import HttpResponse # Import here to avoid overlap
    
    suggestion = ContentSuggestion.objects.create(
        type=payload.type,
        data=payload.data
    )
    
    approve_url = f"{settings.BACKEND_URL}/api/content/suggest/{suggestion.id}/approve?token={suggestion.approval_token}"
    reject_url = f"{settings.BACKEND_URL}/api/content/suggest/{suggestion.id}/reject?token={suggestion.approval_token}"
    
    subject = f"[JBook] New Content Suggestion: {payload.type.upper()}"
    message = f"Tipe: {payload.type}\nData:\n{json.dumps(payload.data, indent=2)}\n\n" \
              f"Klik link di bawah untuk menyetujui:\n{approve_url}\n\n" \
              f"Klik link di bawah untuk menolak:\n{reject_url}"
              
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [settings.EMAIL_HOST_USER],
        fail_silently=False,
    )
    
    return {"message": "Saran kamu sudah dikirim ke admin untuk direview. Terima kasih!"}

@router.get("/suggest/{id}/approve")
def approve_suggestion(request, id: UUID, token: UUID):
    from django.http import HttpResponse
    suggestion = get_object_or_404(ContentSuggestion, id=id, approval_token=token, status='pending')
    
    if suggestion.type == 'kanji':
        Kanji.objects.create(**suggestion.data)
    elif suggestion.type == 'bunpo':
        Grammar.objects.create(**suggestion.data)
        
    suggestion.status = 'approved'
    suggestion.save()
    
    return HttpResponse("Suggestion approved! Content has been added to the database.")

@router.get("/suggest/{id}/reject")
def reject_suggestion(request, id: UUID, token: UUID):
    from django.http import HttpResponse
    suggestion = get_object_or_404(ContentSuggestion, id=id, approval_token=token, status='pending')
    suggestion.status = 'rejected'
    suggestion.save()
    return HttpResponse("Suggestion rejected.")


