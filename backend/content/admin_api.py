from typing import List, Optional
from uuid import UUID
from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Router, Schema, File
from ninja.files import UploadedFile
from ninja.security import HttpBearer
from ninja.errors import HttpError
from pydantic import BaseModel, Field
import csv
import json
import mimetypes
import os
from datetime import datetime
from django.http import HttpResponse
from django.conf import settings
from .models import Kanji, Grammar, Blog, JLPTLevel, Vocab, Particle, Announcement, MediaAttachment
from users.api import AuthBearer
from django.db import transaction


def get_file_url(file_field):
    if not file_field:
        return None
    name = str(file_field.name) if hasattr(file_field, 'name') else str(file_field)
    if name.startswith('http://') or name.startswith('https://'):
        return name
    media_url = settings.MEDIA_URL if settings.MEDIA_URL.endswith('/') else f"{settings.MEDIA_URL}/"
    if not media_url.startswith('/') and not media_url.startswith('http'):
        media_url = f"/{media_url}"
    return f"{media_url}{name.lstrip('/')}"

router = Router()

class AdminAuth(AuthBearer):
    def authenticate(self, request, token):
        user = super().authenticate(request, token)
        # Check specific email, staff status, or superuser status
        if user.email == "imronm1309@gmail.com" or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or user.username == "admin":
            return user
        raise HttpError(403, "Admin access required")

# Schemas
class MediaAttachmentSchema(BaseModel):
    id: UUID
    filename: str
    media_type: str
    mime_type: Optional[str] = None
    file_size: int = 0
    url: str
    created_at: datetime

    class Config:
        from_attributes = True


class BlogSchema(BaseModel):
    id: UUID
    title: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255, pattern=r"^[a-zA-Z0-9-]+$")
    content: str = Field(..., max_length=100000)
    excerpt: Optional[str] = None
    featured_image_url: Optional[str] = None
    tags: List[str]
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BlogCreateSchema(BaseModel):
    title: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255, pattern=r"^[a-zA-Z0-9-]+$")
    content: str = Field(..., max_length=100000)
    excerpt: Optional[str] = Field("", max_length=1000)
    featured_image_url: Optional[str] = Field("", max_length=1000)
    tags: List[str] = Field(default_factory=list)
    is_published: bool = False

class SearchResultSchema(BaseModel):
    id: str
    type: str = Field(..., max_length=100)  # 'kanji', 'bunpo', 'blog'
    title: str = Field(..., max_length=255)
    subtitle: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

# Admin Dashboard Stats
@router.get("/stats", auth=AdminAuth(), response=dict)
def admin_get_stats(request):
    return {
        "kanji_count": Kanji.objects.count(),
        "bunpo_count": Grammar.objects.count(),
        "blog_count": Blog.objects.count(),
        "announcement_count": Announcement.objects.count(),
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


# ================================
# MEDIA ATTACHMENT CRUD / UPLOAD
# ================================
def _detect_media_type(mime: str, filename: str) -> str:
    if mime:
        if mime.startswith('image/'):
            return 'image'
        if mime.startswith('audio/'):
            return 'audio'
        if mime.startswith('video/'):
            return 'video'
        if mime in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                   'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
            return 'document'
    ext = os.path.splitext(filename)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']:
        return 'image'
    if ext in ['.mp3', '.wav', '.ogg', '.m4a', '.aac']:
        return 'audio'
    if ext in ['.mp4', '.webm', '.mov', '.avi']:
        return 'video'
    if ext in ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt']:
        return 'document'
    return 'other'


@router.post("/media/upload", auth=AdminAuth(), response=MediaAttachmentSchema)
def admin_upload_media(request, file: UploadedFile = File(...)):
    mime = file.content_type or mimetypes.guess_type(file.name)[0] or ''
    media_type = _detect_media_type(mime, file.name)

    attachment = MediaAttachment.objects.create(
        file=file,
        filename=file.name,
        media_type=media_type,
        mime_type=mime,
        file_size=file.size if hasattr(file, 'size') else 0
    )

    attachment.url = get_file_url(attachment.file)
    return attachment


@router.get("/media", auth=AdminAuth(), response=List[MediaAttachmentSchema])
def admin_list_media(request):
    items = list(MediaAttachment.objects.all().order_by('-created_at')[:100])
    for item in items:
        item.url = get_file_url(item.file)
    return items


@router.delete("/media/{id}", auth=AdminAuth())
def admin_delete_media(request, id: str):
    attachment = get_object_or_404(MediaAttachment, id=id)
    try:
        if attachment.file and attachment.file.path:
            if os.path.isfile(attachment.file.path):
                os.remove(attachment.file.path)
    except Exception:
        pass
    attachment.delete()
    return {"success": True}


# Blog CRUD
@router.post("/blog", auth=AdminAuth(), response=BlogSchema)
def admin_create_blog(request, payload: BlogCreateSchema):
    data = payload.dict()
    featured_url = data.pop('featured_image_url', '') or None
    blog = Blog.objects.create(**data)

    if featured_url:
        prefix = settings.MEDIA_URL
        if prefix and featured_url.startswith(prefix):
            rel_path = featured_url[len(prefix):]
            blog.featured_image = rel_path
        else:
            blog.featured_image = featured_url
        blog.save(update_fields=['featured_image'])

    blog.featured_image_url = get_file_url(blog.featured_image)
    return blog


@router.get("/blog", auth=AdminAuth(), response=List[BlogSchema])
def admin_list_blogs(request):
    blogs = list(Blog.objects.all().order_by('-created_at'))
    for b in blogs:
        b.featured_image_url = get_file_url(b.featured_image)
    return blogs


@router.get("/blog/{id}", auth=AdminAuth(), response=BlogSchema)
def admin_get_blog(request, id: str):
    blog = get_object_or_404(Blog, id=id)
    blog.featured_image_url = get_file_url(blog.featured_image)
    return blog


@router.put("/blog/{id}", auth=AdminAuth(), response=BlogSchema)
def admin_update_blog(request, id: str, payload: BlogCreateSchema):
    blog = get_object_or_404(Blog, id=id)
    data = payload.dict()
    featured_url = data.pop('featured_image_url', '')

    for attr, value in data.items():
        setattr(blog, attr, value)

    prefix = settings.MEDIA_URL
    if featured_url:
        if prefix and featured_url.startswith(prefix):
            blog.featured_image = featured_url[len(prefix):]
        else:
            blog.featured_image = featured_url
    else:
        blog.featured_image = None

    blog.save()
    blog.featured_image_url = get_file_url(blog.featured_image)
    return blog


@router.delete("/blog/{id}", auth=AdminAuth())
def admin_delete_blog(request, id: str):
    blog = get_object_or_404(Blog, id=id)
    blog.delete()
    return {"success": True}

# Kanji Schemas
class KanjiCreateSchema(BaseModel):
    character: str = Field(..., min_length=1, max_length=5)
    meaning: str = Field(..., max_length=500)
    onyomi: List[str] = Field(default_factory=list)
    kunyomi: List[str] = Field(default_factory=list)
    strokes: int = Field(..., ge=1)
    jlpt_level: int = Field(..., ge=1, le=5)
    radical: Optional[str] = None
    word_type: Optional[str] = None
    examples: List[dict] = Field(default_factory=list)
    svg_data: Optional[str] = None

class KanjiSchema(KanjiCreateSchema):
    id: UUID
    model_config = {"from_attributes": True}

class DeleteIdsSchema(BaseModel):
    ids: List[UUID]

# Kanji CRUD
@router.get("/kanji", auth=AdminAuth(), response=List[KanjiSchema])
def admin_list_kanjis(request, level: int = None):
    query = Kanji.objects.all().order_by('jlpt_level', 'id')
    if level:
        query = query.filter(jlpt_level=level)
    
    results = list(query)
    from utils.kana import to_kana, to_katakana
    for k in results:
        k.onyomi = [to_katakana(r.lower()) for r in k.onyomi]
        k.kunyomi = [to_kana(r.lower()) for r in k.kunyomi]
        
    return results

@router.post("/kanji", auth=AdminAuth(), response=KanjiSchema)
def admin_create_kanji(request, payload: KanjiCreateSchema):
    kanji = Kanji.objects.create(**payload.dict())
    return kanji

@router.get("/kanji/duplicates", auth=AdminAuth())
def admin_kanji_duplicates(request):
    try:
        # group by character
        kanjis = Kanji.objects.all().order_by('character')
        groups = {}
        for k in kanjis:
            groups.setdefault(k.character, []).append(k)

        result = []
        for char, items in groups.items():
            if len(items) > 1:
                result.append({
                    "character": char,
                    "count": len(items),
                    "items": [{"id": str(i.id), "meaning": i.meaning, "jlpt_level": i.jlpt_level} for i in items]
                })
        return result
    except Exception as e:
        print(f"DEBUG: Kanji duplicates error: {e}")
        raise HttpError(500, f"Kanji duplicates error: {str(e)}")


@router.post("/kanji/duplicates/delete", auth=AdminAuth())
def admin_kanji_duplicates_delete(request, payload: DeleteIdsSchema):
    ids = payload.ids
    if not ids:
        raise HttpError(400, "No ids provided")
    with transaction.atomic():
        objs = Kanji.objects.filter(id__in=ids)
        count = objs.count()
        objs.delete()
    return {"deleted": count}

@router.get("/kanji/{id}", auth=AdminAuth(), response=KanjiSchema)
def admin_get_kanji(request, id: str):
    kanji = get_object_or_404(Kanji, id=id)
    from utils.kana import to_kana, to_katakana
    kanji.onyomi = [to_katakana(r.lower()) for r in kanji.onyomi]
    kanji.kunyomi = [to_kana(r.lower()) for r in kanji.kunyomi]
    return kanji

@router.put("/kanji/{id}", auth=AdminAuth(), response=KanjiSchema)
def admin_update_kanji(request, id: str, payload: KanjiCreateSchema):
    kanji = get_object_or_404(Kanji, id=id)
    for attr, value in payload.dict().items():
        setattr(kanji, attr, value)
    kanji.save()
    return kanji

@router.delete("/kanji/{id}", auth=AdminAuth())
def admin_delete_kanji(request, id: str):
    kanji = get_object_or_404(Kanji, id=id)
    kanji.delete()
    return {"success": True}

@router.get("/kanji/export/csv", auth=AdminAuth())
def admin_export_kanji_csv(request, level: int = None, search: str = None):
    query = Kanji.objects.all().order_by('jlpt_level', 'character')
    if level:
        query = query.filter(jlpt_level=level)
    if search:
        query = query.filter(Q(character__icontains=search) | Q(meaning__icontains=search))
        
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="kanji_export.csv"'
    writer = csv.writer(response)
    writer.writerow(['Character', 'Meaning', 'Onyomi', 'Kunyomi', 'Strokes', 'JLPT Level', 'Radical'])
    
    from utils.kana import format_reading
    for obj in query:
        onyomi_str = format_reading(obj.onyomi, is_onyomi=True)
        kunyomi_str = format_reading(obj.kunyomi, is_onyomi=False)
        writer.writerow([obj.character, obj.meaning, onyomi_str, kunyomi_str, obj.strokes, obj.jlpt_level, obj.radical])
    return response


@router.get("/kanji/duplicates", auth=AdminAuth())
def admin_kanji_duplicates(request):
    try:
        # group by character
        kanjis = Kanji.objects.all().order_by('character')
        groups = {}
        for k in kanjis:
            groups.setdefault(k.character, []).append(k)

        result = []
        for char, items in groups.items():
            if len(items) > 1:
                result.append({
                    "character": char,
                    "count": len(items),
                    "items": [{"id": str(i.id), "meaning": i.meaning, "jlpt_level": i.jlpt_level} for i in items]
                })
        return result
    except Exception as e:
        raise HttpError(500, f"Kanji duplicates error: {str(e)}")


@router.post("/kanji/duplicates/delete", auth=AdminAuth())
def admin_kanji_duplicates_delete(request, payload: DeleteIdsSchema):
    ids = payload.ids
    if not ids:
        raise HttpError(400, "No ids provided")
    with transaction.atomic():
        objs = Kanji.objects.filter(id__in=ids)
        count = objs.count()
        objs.delete()
    return {"deleted": count}

# Bunpo Schemas
class GrammarCreateSchema(BaseModel):
    title: str = Field(..., max_length=255)
    structure: str = Field(..., max_length=500)
    explanation: str = Field(..., max_length=10000)
    chapter: int = Field(..., ge=1)
    jlpt_level: int = Field(..., ge=1, le=5)
    sentences: List[dict] = Field(default_factory=list)

class GrammarSchema(GrammarCreateSchema):
    id: UUID
    model_config = {"from_attributes": True}

# Bunpo CRUD
@router.get("/bunpo", auth=AdminAuth(), response=List[GrammarSchema])
@router.get("/grammar", auth=AdminAuth(), response=List[GrammarSchema])
def admin_list_bunpos(request, level: int = None, chapter: int = None, search: str = None):
    query = Grammar.objects.all().order_by('chapter', 'jlpt_level', 'id')
    
    if level:
        query = query.filter(jlpt_level=level)
    if chapter:
        query = query.filter(chapter=chapter)
        
    if search:
        query = query.filter(
            Q(title__icontains=search) | 
            Q(structure__icontains=search) | 
            Q(explanation__icontains=search)
        )
        
    return list(query[:1000])  # grammar lists are usually small, safety cap

@router.post("/bunpo", auth=AdminAuth(), response=GrammarSchema)
def admin_create_bunpo(request, payload: GrammarCreateSchema):
    grammar = Grammar.objects.create(**payload.dict())
    return grammar

@router.get("/bunpo/{id}", auth=AdminAuth(), response=GrammarSchema)
def admin_get_bunpo(request, id: str):
    return get_object_or_404(Grammar, id=id)

@router.put("/bunpo/{id}", auth=AdminAuth(), response=GrammarSchema)
def admin_update_bunpo(request, id: str, payload: GrammarCreateSchema):
    grammar = get_object_or_404(Grammar, id=id)
    for attr, value in payload.dict().items():
        setattr(grammar, attr, value)
    grammar.save()
    return grammar

@router.delete("/bunpo/{id}", auth=AdminAuth())
def admin_delete_bunpo(request, id: str):
    grammar = get_object_or_404(Grammar, id=id)
    grammar.delete()
    return {"success": True}

@router.get("/bunpo/export/csv", auth=AdminAuth())
def admin_export_grammar_csv(request, level: int = None, chapter: int = None, search: str = None):
    query = Grammar.objects.all().order_by('chapter', 'jlpt_level', 'id')
    if level:
        query = query.filter(jlpt_level=level)
    if chapter:
        query = query.filter(chapter=chapter)
    if search:
        query = query.filter(Q(title__icontains=search) | Q(structure__icontains=search) | Q(explanation__icontains=search))

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="grammar_export.csv"'
    writer = csv.writer(response)
    writer.writerow(['Title', 'Structure', 'Explanation', 'Chapter', 'JLPT Level'])
    for obj in query:
        writer.writerow([obj.title, obj.structure, obj.explanation, obj.chapter, obj.jlpt_level])
    return response

# Vocab Schemas
from .models import Vocab

class VocabCreateSchema(BaseModel):
    word: str = Field(..., max_length=255)
    reading: Optional[str] = None
    furigana: Optional[str] = None
    furigana_map: Optional[List[str]] = Field(default_factory=list)
    meaning: Optional[str] = None
    word_type: Optional[str] = None
    jlpt_level: int = Field(..., ge=1, le=5)
    examples: Optional[List[dict]] = Field(default_factory=list)

class VocabSchema(VocabCreateSchema):
    id: UUID
    model_config = {"from_attributes": True}

class VocabListResponse(BaseModel):
    items: List[VocabSchema]
    total: int
    debug_level: Optional[int] = None
    debug_search: Optional[str] = None

# Vocab CRUD
@router.get("/kotoba", auth=AdminAuth(), response=List[VocabSchema])
@router.get("/vocab", auth=AdminAuth(), response=List[VocabSchema])
def admin_list_vocabs(request, level: int = None, search: str = None, limit: int = 10000):
    from utils.kana import to_kana
    
    query = Vocab.objects.all().order_by('jlpt_level', 'word')

    if level is not None:
        query = query.filter(jlpt_level=level)
        
    if search:
        search_kana = to_kana(search)
        query = query.filter(
            Q(word__icontains=search) | 
            Q(reading__icontains=search) | 
            Q(meaning__icontains=search) |
            Q(reading__icontains=search_kana)
        )
        
    items = list(query[:limit])  # safely cap from query param
    from utils.kana import to_kana
    for v in items:
        if v.reading:
            v.reading = to_kana(v.reading.lower())
        if v.reading:
            v.reading = to_kana(v.reading.lower())
        
    return items

@router.post("/kotoba", auth=AdminAuth(), response=VocabSchema)
@router.post("/vocab", auth=AdminAuth(), response=VocabSchema)
def admin_create_vocab(request, payload: VocabCreateSchema):
    vocab = Vocab.objects.create(**payload.dict())
    return vocab

@router.get("/kotoba/export/csv", auth=AdminAuth())
@router.get("/vocab/export/csv", auth=AdminAuth())
def admin_export_vocab_csv(request, level: int = None, search: str = None):
    query = Vocab.objects.all().order_by('jlpt_level', 'word')
    if level is not None:
        query = query.filter(jlpt_level=level)
    if search:
        from utils.kana import to_kana
        search_kana = to_kana(search)
        query = query.filter(Q(word__icontains=search) | Q(reading__icontains=search) | Q(meaning__icontains=search) | Q(reading__icontains=search_kana))

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="vocab_export.csv"'
    writer = csv.writer(response)
    writer.writerow(['Word', 'Reading', 'Meaning', 'JLPT Level'])
    from utils.kana import to_kana
    for obj in query:
        writer.writerow([obj.word, to_kana(obj.reading.lower()), obj.meaning, obj.jlpt_level])
    return response

# Duplicate endpoints for Vocab/Kotoba
@router.get("/kotoba/duplicates", auth=AdminAuth())
def admin_kotoba_duplicates(request):
    try:
        vocabs = Vocab.objects.all().order_by('word')
        groups = {}
        for v in vocabs:
            key = f"{(v.word or '').strip().lower()}||{(v.meaning or '').strip().lower()}"
            groups.setdefault(key, []).append(v)

        result = []
        for key, items in groups.items():
            if len(items) > 1:
                result.append({
                    "key": key,
                    "count": len(items),
                    "items": [{"id": str(i.id), "word": i.word, "meaning": i.meaning, "jlpt_level": i.jlpt_level} for i in items]
                })
        return result
    except Exception as e:
        print(f"DEBUG: Kotoba duplicates error: {e}")
        raise HttpError(500, f"Kotoba duplicates error: {str(e)}")


@router.post("/kotoba/duplicates/delete", auth=AdminAuth())
def admin_kotoba_duplicates_delete(request, payload: DeleteIdsSchema):
    ids = payload.ids
    if not ids:
        raise HttpError(400, "No ids provided")
    with transaction.atomic():
        objs = Vocab.objects.filter(id__in=ids)
        count = objs.count()
        objs.delete()
    return {"deleted": count}

@router.get("/kotoba/{id}", auth=AdminAuth(), response=VocabSchema)
@router.get("/vocab/{id}", auth=AdminAuth(), response=VocabSchema)
def admin_get_vocab(request, id: str):
    vocab = get_object_or_404(Vocab, id=id)
    from utils.kana import to_kana
    vocab.reading = to_kana(vocab.reading.lower())
    return vocab

@router.put("/kotoba/{id}", auth=AdminAuth(), response=VocabSchema)
@router.put("/vocab/{id}", auth=AdminAuth(), response=VocabSchema)
def admin_update_vocab(request, id: str, payload: VocabCreateSchema):
    vocab = get_object_or_404(Vocab, id=id)
    for attr, value in payload.dict().items():
        setattr(vocab, attr, value)
    vocab.save()
    return vocab

@router.delete("/kotoba/{id}", auth=AdminAuth())
@router.delete("/vocab/{id}", auth=AdminAuth())
def admin_delete_vocab(request, id: str):
    vocab = get_object_or_404(Vocab, id=id)
    vocab.delete()
    return {"success": True}

@router.get("/particle/export/csv", auth=AdminAuth())
def admin_export_particle_csv(request, level: int = None):
    query = Particle.objects.all().order_by('jlpt_level', 'character')
    if level:
        query = query.filter(jlpt_level=level)
        
    import json
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="particle_export.csv"'
    writer = csv.writer(response)
    writer.writerow(['Character', 'Meaning', 'Explanation', 'JLPT Level', 'Sentences'])
    for obj in query:
        sentences_str = json.dumps(obj.sentences)
        writer.writerow([obj.character, obj.meaning, obj.explanation, obj.jlpt_level, sentences_str])
    return response

# Announcement Schemas
class AnnouncementCreateSchema(BaseModel):
    title: str = Field(..., max_length=255)
    content: str = Field(..., max_length=10000)
    type: str = Field(..., max_length=100)
    priority: int = Field(0, ge=0, le=100)
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None
    is_active: bool = True
    show_as_popup: bool = False

class AnnouncementSchema(AnnouncementCreateSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

# Announcement CRUD
@router.get("/announcements", auth=AdminAuth(), response=List[AnnouncementSchema])
def admin_list_announcements(request):
    return Announcement.objects.filter(deleted_at__isnull=True).order_by('-priority', '-created_at')

@router.post("/announcements", auth=AdminAuth(), response=AnnouncementSchema)
def admin_create_announcement(request, payload: AnnouncementCreateSchema):
    announcement = Announcement.objects.create(**payload.dict())
    return announcement

@router.get("/announcements/{id}", auth=AdminAuth(), response=AnnouncementSchema)
def admin_get_announcement(request, id: str):
    return get_object_or_404(Announcement, id=id)

@router.put("/announcements/{id}", auth=AdminAuth(), response=AnnouncementSchema)
def admin_update_announcement(request, id: str, payload: AnnouncementCreateSchema):
    announcement = get_object_or_404(Announcement, id=id)
    for attr, value in payload.dict().items():
        setattr(announcement, attr, value)
    announcement.save()
    return announcement

@router.delete("/announcements/{id}", auth=AdminAuth())
def admin_delete_announcement(request, id: str):
    from django.utils import timezone
    announcement = get_object_or_404(Announcement, id=id)
    announcement.deleted_at = timezone.now()
    announcement.save()
    return {"success": True}

# Custom Module Schemas
from .models import CustomModule, CustomQuestion, CustomModuleType, CustomQuestionType

class CustomQuestionCreateSchema(BaseModel):
    question_type: str = Field('choice', max_length=100)
    question_text: str = Field(..., max_length=5000)
    options: List[str] = Field(default_factory=list)
    correct_answer: str = Field(..., max_length=1000)
    explanation: Optional[str] = Field("", max_length=5000)
    order: int = Field(0, ge=0)

class CustomQuestionSchema(CustomQuestionCreateSchema):
    id: UUID
    model_config = {"from_attributes": True}

class CustomModuleCreateSchema(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = Field("", max_length=10000)
    module_type: str = Field('general', max_length=100)
    passage: Optional[str] = Field("", max_length=100000)
    audio_url: Optional[str] = Field("", max_length=1000)
    is_published: bool = False

class CustomModuleSchema(CustomModuleCreateSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

# Custom Module CRUD
@router.get("/custom-modules", auth=AdminAuth(), response=List[CustomModuleSchema])
def admin_list_custom_modules(request):
    return CustomModule.objects.all().order_by('-created_at')

@router.post("/custom-modules", auth=AdminAuth(), response=CustomModuleSchema)
def admin_create_custom_module(request, payload: CustomModuleCreateSchema):
    module = CustomModule.objects.create(**payload.dict())
    return module

@router.get("/custom-modules/{id}", auth=AdminAuth(), response=CustomModuleSchema)
def admin_get_custom_module(request, id: str):
    return get_object_or_404(CustomModule, id=id)

@router.put("/custom-modules/{id}", auth=AdminAuth(), response=CustomModuleSchema)
def admin_update_custom_module(request, id: str, payload: CustomModuleCreateSchema):
    module = get_object_or_404(CustomModule, id=id)
    for attr, value in payload.dict().items():
        setattr(module, attr, value)
    module.save()
    return module

@router.delete("/custom-modules/{id}", auth=AdminAuth())
def admin_delete_custom_module(request, id: str):
    module = get_object_or_404(CustomModule, id=id)
    module.delete()
    return {"success": True}

# Custom Question CRUD
@router.get("/custom-modules/{module_id}/questions", auth=AdminAuth(), response=List[CustomQuestionSchema])
def admin_list_custom_questions(request, module_id: str):
    return CustomQuestion.objects.filter(module_id=module_id).order_by('order', 'id')

@router.post("/custom-modules/{module_id}/questions", auth=AdminAuth(), response=CustomQuestionSchema)
def admin_create_custom_question(request, module_id: str, payload: CustomQuestionCreateSchema):
    module = get_object_or_404(CustomModule, id=module_id)
    question = CustomQuestion.objects.create(module=module, **payload.dict())
    return question

@router.delete("/custom-questions/{id}", auth=AdminAuth())
def admin_delete_custom_question(request, id: str):
    question = get_object_or_404(CustomQuestion, id=id)
    question.delete()
    return {"success": True}

# Upload Excel Endpoint
from ninja import File
from ninja.files import UploadedFile
import pandas as pd

@router.post("/custom-modules/{module_id}/upload-excel", auth=AdminAuth())
def admin_upload_custom_module_excel(request, module_id: str, file: UploadedFile = File(...)):
    module = get_object_or_404(CustomModule, id=module_id)
    try:
        df = pd.read_excel(file.read())
        # Expected columns: question_type, question, option_a, option_b, option_c, option_d, correct_answer, explanation
        
        # Delete existing questions if needed, or append. Let's append but start order from max
        max_order = CustomQuestion.objects.filter(module=module).count()
        
        questions_to_create = []
        for index, row in df.iterrows():
            q_type = row.get('question_type', 'choice')
            if pd.isna(q_type):
                q_type = 'choice'
            else:
                q_type = str(q_type).lower().strip()
                
            question_text = str(row.get('question', ''))
            if pd.isna(row.get('question')) or not question_text:
                continue
                
            correct_answer = str(row.get('correct_answer', ''))
            if pd.isna(row.get('correct_answer')):
                correct_answer = ''
                
            explanation = str(row.get('explanation', ''))
            if pd.isna(row.get('explanation')):
                explanation = ''
                
            options = []
            if q_type == 'choice':
                for opt_col in ['option_a', 'option_b', 'option_c', 'option_d']:
                    opt_val = row.get(opt_col)
                    if not pd.isna(opt_val):
                        options.append(str(opt_val))
            
            max_order += 1
            questions_to_create.append(CustomQuestion(
                module=module,
                question_type=q_type,
                question_text=question_text,
                options=options,
                correct_answer=correct_answer,
                explanation=explanation,
                order=max_order
            ))
            
        CustomQuestion.objects.bulk_create(questions_to_create)
        return {"success": True, "count": len(questions_to_create)}
    except Exception as e:
        raise HttpError(400, f"Error processing Excel: {str(e)}")
