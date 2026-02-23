from django.db import models
import uuid

class JLPTLevel(models.IntegerChoices):
    N5 = 5, 'N5'
    N4 = 4, 'N4'
    N3 = 3, 'N3'
    N2 = 2, 'N2'
    N1 = 1, 'N1'

class Kanji(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    character = models.CharField(max_length=1)
    meaning = models.CharField(max_length=255, help_text="Arti dalam Bahasa Indonesia")
    onyomi = models.JSONField(default=list)
    kunyomi = models.JSONField(default=list)
    strokes = models.IntegerField()
    jlpt_level = models.IntegerField(choices=JLPTLevel.choices)
    radical = models.CharField(max_length=5, blank=True, null=True, help_text="Radikal utama")
    examples = models.JSONField(default=list, help_text="List of words using this Kanji with Indonesian meanings")

    def __str__(self):
        return self.character

class Grammar(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    structure = models.CharField(max_length=255)
    explanation = models.TextField(help_text="Penjelasan detail dalam Bahasa Indonesia")
    chapter = models.IntegerField(default=0, help_text="Bab / Chapter number")
    jlpt_level = models.IntegerField(choices=JLPTLevel.choices)
    sentences = models.JSONField(default=list, help_text="Contoh kalimat dengan terjemahan Bahasa Indonesia")

    def __str__(self):
        return self.title

class Vocab(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    word = models.CharField(max_length=255)
    reading = models.CharField(max_length=255)
    furigana = models.CharField(max_length=255, blank=True, null=True, help_text="Cara baca spesifik dalam Kana (Furigana)")
    meaning = models.CharField(max_length=255, help_text="Arti kata dalam Bahasa Indonesia")
    kanji_rel = models.ManyToManyField(Kanji, related_name='vocab', blank=True)
    jlpt_level = models.IntegerField(choices=JLPTLevel.choices, default=JLPTLevel.N5)
    examples = models.JSONField(default=list, help_text="Contoh kalimat")

    def __str__(self):
        return self.word

class Blog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    content = models.TextField(help_text="Konten blog (Markdown/HTML)")
    tags = models.JSONField(default=list, help_text="Tags/Kategori")
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
