from ninja import Router, Schema
from typing import List, Optional
from pydantic import BaseModel
from .models import Kanji, Grammar, Blog, ContentSuggestion
from django.shortcuts import get_object_or_404
from uuid import UUID
from datetime import datetime

router = Router()

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
        
        # Format onyomi/kunyomi to Katakana/Hiragana
        k.onyomi = [to_katakana(r.lower()) for r in k.onyomi]
        k.kunyomi = [to_kana(r.lower()) for r in k.kunyomi]

    return {
        "items": results,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/kanji/{kanji_id}", response=KanjiSchema)
def get_kanji(request, kanji_id: UUID):
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
    kanji.onyomi = [to_katakana(r.lower()) for r in kanji.onyomi]
    kanji.kunyomi = [to_kana(r.lower()) for r in kanji.kunyomi]
            
    return kanji

@router.get("/bunpo", response=GrammarListResponse)
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

# Alias for compatibility with production/older frontend
@router.get("/grammar", response=GrammarListResponse)
def list_grammar_alias(request, **kwargs):
    return list_grammar(request, **kwargs)

@router.get("/grammar/{grammar_id}", response=GrammarSchema)
def get_grammar_alias(request, grammar_id: UUID):
    return get_grammar(request, grammar_id)

@router.get("/bunpo/{grammar_id}", response=GrammarSchema)
def get_grammar(request, grammar_id: UUID):
    return get_object_or_404(Grammar, id=grammar_id)


class VocabSchema(Schema):
    id: UUID
    word: str
    reading: str
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

# Alias for compatibility with production/older frontend
@router.get("/vocab", response=VocabListResponse)
def list_vocab_alias(request, **kwargs):
    return list_vocab(request, **kwargs)

@router.get("/vocab/{vocab_id}", response=VocabSchema)
def get_vocab_alias(request, vocab_id: UUID):
    return get_vocab(request, vocab_id)

@router.get("/kotoba/{vocab_id}", response=VocabSchema)
def get_vocab(request, vocab_id: UUID):
    from .models import Vocab
    vocab = get_object_or_404(Vocab, id=vocab_id)
    from utils.kana import to_kana
    vocab.reading = to_kana(vocab.reading.lower())
    if vocab.furigana:
        vocab.furigana = to_kana(vocab.furigana.lower())
    return vocab

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
