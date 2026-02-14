from typing import List, Optional
from uuid import UUID
from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.security import HttpBearer
from ninja.errors import HttpError
from pydantic import BaseModel
from .models import Kanji, Grammar, Blog, JLPTLevel
from users.api import AuthBearer

router = Router()

class AdminAuth(AuthBearer):
    def authenticate(self, request, token):
        user = super().authenticate(request, token)
        # Check specific email or staff status
        if user.email == "imronm1309@gmail.com" or user.is_staff:
            return user
        raise HttpError(403, "Admin access required")

# Schemas
class BlogSchema(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    tags: List[str]
    is_published: bool
    created_at: str
    
    model_config = {"from_attributes": True}

class BlogCreateSchema(BaseModel):
    title: str
    slug: str
    content: str
    tags: List[str] = []
    is_published: bool = False

class SearchResultSchema(BaseModel):
    id: str
    type: str # 'kanji', 'bunpo', 'blog'
    title: str
    subtitle: Optional[str] = None
    tags: List[str] = []

# Admin Dashboard Stats
@router.get("/stats", auth=AdminAuth(), response=dict)
def get_stats(request):
    return {
        "kanji_count": Kanji.objects.count(),
        "bunpo_count": Grammar.objects.count(),
        "blog_count": Blog.objects.count(),
    }

# Unified Search Engine
@router.get("/search", auth=AdminAuth(), response=List[SearchResultSchema])
def admin_search(request, q: str):
    results = []
    
    # Search Kanji
    kanjis = Kanji.objects.filter(
        Q(character__icontains=q) | 
        Q(meaning__icontains=q) |
        Q(onyomi__icontains=q) | 
        Q(kunyomi__icontains=q)
    )[:10]
    for k in kanjis:
        results.append({
            "id": str(k.id),
            "type": "kanji",
            "title": k.character,
            "subtitle": k.meaning,
            "tags": [f"N{k.jlpt_level}"]
        })

    # Search Grammar
    grammars = Grammar.objects.filter(
        Q(title__icontains=q) | 
        Q(structure__icontains=q) | 
        Q(explanation__icontains=q)
    )[:10]
    for g in grammars:
        results.append({
            "id": str(g.id),
            "type": "bunpo",
            "title": g.title,
            "subtitle": g.structure,
            "tags": [f"N{g.jlpt_level}", f"Ch{g.chapter}"]
        })

    # Search Blog
    blogs = Blog.objects.filter(
        Q(title__icontains=q) | 
        Q(content__icontains=q)
    )[:10]
    for b in blogs:
        results.append({
            "id": str(b.id),
            "type": "blog",
            "title": b.title,
            "subtitle": "Published" if b.is_published else "Draft",
            "tags": b.tags
        })

    return results

# Blog CRUD
@router.post("/blog", auth=AdminAuth(), response=BlogSchema)
def create_blog(request, payload: BlogCreateSchema):
    blog = Blog.objects.create(**payload.dict())
    return blog

@router.get("/blog", auth=AdminAuth(), response=List[BlogSchema])
def list_blogs(request):
    return Blog.objects.all().order_by('-created_at')

@router.get("/blog/{id}", auth=AdminAuth(), response=BlogSchema)
def get_blog(request, id: str):
    return get_object_or_404(Blog, id=id)

@router.put("/blog/{id}", auth=AdminAuth(), response=BlogSchema)
def update_blog(request, id: str, payload: BlogCreateSchema):
    blog = get_object_or_404(Blog, id=id)
    for attr, value in payload.dict().items():
        setattr(blog, attr, value)
    blog.save()
    return blog

@router.delete("/blog/{id}", auth=AdminAuth())
def delete_blog(request, id: str):
    blog = get_object_or_404(Blog, id=id)
    blog.delete()
    return {"success": True}

# Kanji Schemas
class KanjiCreateSchema(BaseModel):
    character: str
    meaning: str
    onyomi: List[str] = []
    kunyomi: List[str] = []
    strokes: int
    jlpt_level: int
    radical: Optional[str] = None
    examples: List[dict] = []

class KanjiSchema(KanjiCreateSchema):
    id: UUID
    model_config = {"from_attributes": True}

# Kanji CRUD
@router.get("/kanji", auth=AdminAuth(), response=List[KanjiSchema])
def list_kanjis(request, level: int = None):
    query = Kanji.objects.all().order_by('jlpt_level', 'id')
    if level:
        query = query.filter(jlpt_level=level)
    return query

@router.post("/kanji", auth=AdminAuth(), response=KanjiSchema)
def create_kanji(request, payload: KanjiCreateSchema):
    kanji = Kanji.objects.create(**payload.dict())
    return kanji

@router.get("/kanji/{id}", auth=AdminAuth(), response=KanjiSchema)
def get_kanji(request, id: str):
    return get_object_or_404(Kanji, id=id)

@router.put("/kanji/{id}", auth=AdminAuth(), response=KanjiSchema)
def update_kanji(request, id: str, payload: KanjiCreateSchema):
    kanji = get_object_or_404(Kanji, id=id)
    for attr, value in payload.dict().items():
        setattr(kanji, attr, value)
    kanji.save()
    return kanji

@router.delete("/kanji/{id}", auth=AdminAuth())
def delete_kanji(request, id: str):
    kanji = get_object_or_404(Kanji, id=id)
    kanji.delete()
    return {"success": True}

# Bunpo Schemas
class GrammarCreateSchema(BaseModel):
    title: str
    structure: str
    explanation: str
    chapter: int
    jlpt_level: int
    sentences: List[dict] = []

class GrammarSchema(GrammarCreateSchema):
    id: UUID
    model_config = {"from_attributes": True}

# Bunpo CRUD
@router.get("/bunpo", auth=AdminAuth(), response=List[GrammarSchema])
def list_bunpos(request, level: int = None, chapter: int = None):
    query = Grammar.objects.all().order_by('chapter', 'jlpt_level', 'id')
    if level:
        query = query.filter(jlpt_level=level)
    if chapter:
        query = query.filter(chapter=chapter)
    return query

@router.post("/bunpo", auth=AdminAuth(), response=GrammarSchema)
def create_bunpo(request, payload: GrammarCreateSchema):
    grammar = Grammar.objects.create(**payload.dict())
    return grammar

@router.get("/bunpo/{id}", auth=AdminAuth(), response=GrammarSchema)
def get_bunpo(request, id: str):
    return get_object_or_404(Grammar, id=id)

@router.put("/bunpo/{id}", auth=AdminAuth(), response=GrammarSchema)
def update_bunpo(request, id: str, payload: GrammarCreateSchema):
    grammar = get_object_or_404(Grammar, id=id)
    for attr, value in payload.dict().items():
        setattr(grammar, attr, value)
    grammar.save()
    return grammar

@router.delete("/bunpo/{id}", auth=AdminAuth())
def delete_bunpo(request, id: str):
    grammar = get_object_or_404(Grammar, id=id)
    grammar.delete()
    return {"success": True}
