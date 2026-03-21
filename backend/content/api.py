from ninja import Router, Schema
from typing import List, Optional
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
    examples: List[dict] = []

class GrammarSchema(Schema):
    id: UUID
    title: str
    structure: str
    explanation: str
    chapter: int
    jlpt_level: int
    sentences: List[dict] = []

@router.get("/kanji", response=List[KanjiSchema])
def list_kanji(request, 
               level: Optional[int] = None, 
               search: Optional[str] = None,
               radical: Optional[str] = None,
               limit: int = 100,
               offset: int = 0):
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
    
    # Pagination
    return qs[offset : offset + limit]

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
    
    return kanji

@router.get("/grammar", response=List[GrammarSchema])
def list_grammar(request, 
                 level: Optional[int] = None,
                 search: Optional[str] = None,
                 chapter: Optional[int] = None,
                 limit: int = 100,
                 offset: int = 0):
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
    
    # Pagination
    return qs[offset : offset + limit]

@router.get("/grammar/{grammar_id}", response=GrammarSchema)
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

@router.get("/vocab", response=List[VocabSchema])
def list_vocab(request, 
               level: Optional[int] = None,
               search: Optional[str] = None,
               word_type: Optional[str] = None,
               limit: int = 100,
               offset: int = 0):
    from .models import Vocab
    from django.db.models import Q
    from utils.kana import to_kana
    
    qs = Vocab.objects.all().order_by('word')
    
    if level:
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
        
        
    return qs[offset : offset + limit]

@router.get("/vocab/{vocab_id}", response=VocabSchema)
def get_vocab(request, vocab_id: UUID):
    from .models import Vocab
    return get_object_or_404(Vocab, id=vocab_id)

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
