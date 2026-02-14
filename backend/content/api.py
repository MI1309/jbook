from ninja import Router, Schema
from typing import List, Optional
from .models import Kanji, Grammar
from django.shortcuts import get_object_or_404
from uuid import UUID

router = Router()

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
    return get_object_or_404(Kanji, id=kanji_id)

@router.get("/grammar", response=List[GrammarSchema])
def list_grammar(request, level: Optional[int] = None):
    qs = Grammar.objects.all()
    if level:
        qs = qs.filter(jlpt_level=level)
    
    # Order by chapter then title
    qs = qs.order_by('chapter', 'title')
    return qs

@router.get("/grammar/{grammar_id}", response=GrammarSchema)
def get_grammar(request, grammar_id: UUID):
    return get_object_or_404(Grammar, id=grammar_id)
