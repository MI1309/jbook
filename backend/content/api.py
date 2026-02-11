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
    jlpt_level: int
    sentences: List[dict] = []

@router.get("/kanji", response=List[KanjiSchema])
def list_kanji(request, level: Optional[int] = None):
    qs = Kanji.objects.all()
    if level:
        qs = qs.filter(jlpt_level=level)
    return qs

@router.get("/kanji/{kanji_id}", response=KanjiSchema)
def get_kanji(request, kanji_id: UUID):
    return get_object_or_404(Kanji, id=kanji_id)

@router.get("/grammar", response=List[GrammarSchema])
def list_grammar(request, level: Optional[int] = None):
    qs = Grammar.objects.all()
    if level:
        qs = qs.filter(jlpt_level=level)
    return qs

@router.get("/grammar/{grammar_id}", response=GrammarSchema)
def get_grammar(request, grammar_id: UUID):
    return get_object_or_404(Grammar, id=grammar_id)
