from django.db import models
import uuid

class JLPTLevel(models.IntegerChoices):
    N5 = 5, 'N5'
    N4 = 4, 'N4'
    N3 = 3, 'N3'
    N2 = 2, 'N2'
    N1 = 1, 'N1'

class WordType(models.TextChoices):
    NOUN = 'noun', 'Noun (Kata Benda)'
    GODAN_VERB = 'godan', 'Godan Verb (Kata Kerja Golongan 1)'
    ICHIDAN_VERB = 'ichidan', 'Ichidan Verb (Kata Kerja Golongan 2)'
    SURU_VERB = 'suru', 'Suru Verb (Kata Kerja Golongan 3)'
    INTRANSITIVE_VERB = 'intransitive', 'Intransitive Verb (Kata Kerja Intransitif)'
    TRANSITIVE_VERB = 'transitive', 'Transitive Verb (Kata Kerja Transitif)'
    ADJECTIVE_I = 'i_adj', 'I-Adjective (Kata Sifat I)'
    ADJECTIVE_NA = 'na_adj', 'Na-Adjective (Kata Sifat Na)'
    ADVERB = 'adverb', 'Adverb (Kata Keterangan)'
    PARTICLE = 'particle', 'Particle (Partikel)'
    SUFFIX = 'suffix', 'Suffix (Akhiran)'
    CONJUNCTION = 'conjunction', 'Conjunction (Kata Sambung)'
    INTERJECTION = 'interjection', 'Interjection (Kata Seru)'
    PRONOUN = 'pronoun', 'Pronoun (Kata Ganti)'
    COUNTER = 'counter', 'Counter (Kata Bantu Bilangan)'
    OTHER = 'other', 'Lain-lain'

class Kanji(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    character = models.CharField(max_length=1)
    meaning = models.CharField(max_length=255, help_text="Arti dalam Bahasa Indonesia")
    onyomi = models.JSONField(default=list)
    kunyomi = models.JSONField(default=list)
    strokes = models.IntegerField()
    jlpt_level = models.IntegerField(choices=JLPTLevel.choices)
    radical = models.CharField(max_length=5, blank=True, null=True, help_text="Radikal utama")
    word_type = models.CharField(max_length=20, choices=WordType.choices, blank=True, null=True, help_text="Tipe kata utama jika ada")
    examples = models.JSONField(default=list, help_text="List of words using this Kanji with Indonesian meanings")
    
    # 🌟 TAMBAHAN BARU: Field untuk menyimpan data teks mentah SVG dari KanjiVG
    svg_data = models.TextField(blank=True, null=True, help_text="Data mentah file SVG dari KanjiVG")

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
    word_type = models.CharField(max_length=20, choices=WordType.choices, blank=True, null=True, help_text="Tipe kata (e.g. Noun, Godan Verb)")
    kanji_rel = models.ManyToManyField(Kanji, related_name='vocab', blank=True)
    jlpt_level = models.IntegerField(choices=JLPTLevel.choices, default=JLPTLevel.N5)
    examples = models.JSONField(default=list, help_text="Contoh kalimat")

    def __str__(self):
        return self.word

class Particle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    character = models.CharField(max_length=10, help_text="Karakter partikel (e.g. は, が, を)")
    meaning = models.CharField(max_length=255, help_text="Arti/Fungsi singkat")
    explanation = models.TextField(help_text="Penjelasan penggunaan")
    jlpt_level = models.IntegerField(choices=JLPTLevel.choices, default=JLPTLevel.N5)
    sentences = models.JSONField(default=list, help_text="Contoh kalimat dengan placeholder ( ) dan terjemahan")

    def __str__(self):
        return self.character

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

class ContentSuggestion(models.Model):
    TYPES = [
        ('kanji', 'Kanji'),
        ('bunpo', 'Grammar'),
    ]
    STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=TYPES)
    data = models.JSONField()
    status = models.CharField(max_length=10, choices=STATUS, default='pending')
    approval_token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} suggestion - {self.status}"

class Announcement(models.Model):
    ANNOUNCEMENT_TYPES = [
        ('info', 'Informasi (Biru)'),
        ('warning', 'Peringatan (Kuning)'),
        ('important', 'Penting (Merah)'),
        ('success', 'Sukses (Hijau)'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    content = models.TextField(help_text="Isi pengumuman (mendukung teks panjang)")
    type = models.CharField(max_length=20, choices=ANNOUNCEMENT_TYPES, default='info')
    is_active = models.BooleanField(default=True)
    show_as_popup = models.BooleanField(default=False, help_text="Jika dicentang, akan muncul sebagai modal popup, jika tidak hanya sebagai banner")
    priority = models.IntegerField(default=0, help_text="Prioritas pengumuman (makin besar makin awal muncul)")
    show_from = models.DateTimeField(null=True, blank=True, help_text="Mulai ditampilkan pada")
    show_until = models.DateTimeField(null=True, blank=True, help_text="Selesai ditampilkan pada")
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_type_display()})"

class QuestionType(models.TextChoices):
    DOUKAI        = 'doukai',         'Doukai (Benar/Salah)'
    FILL_BLANK    = 'fill_blank',     'Fill in the Blank'
    CONTEXT_MATCH = 'context_match',  'Context Match'
    CHOICE        = 'choice',         'Multiple Choice'

class MinnaQuestion(models.Model):
    """
    Bank soal latihan khusus buku Minna no Nihongo.
    Mendukung empat tipe soal:
      - doukai       : Tampilkan kalimat + terjemahan → user pilih Benar/Salah
      - fill_blank   : Kalimat dengan ____ → pilih kata yang tepat
      - context_match: Tampilkan arti Indonesia → pilih kalimat Jepang yang benar
      - choice       : Pilihan ganda standar
    """
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book           = models.IntegerField(choices=[(1, 'Minna no Nihongo 1'), (2, 'Minna no Nihongo 2')],
                                         help_text="Nomor buku Minna no Nihongo (1 atau 2)")
    chapter        = models.IntegerField(help_text="Nomor bab dalam buku")
    question_type  = models.CharField(max_length=20, choices=QuestionType.choices,
                                       help_text="Tipe soal latihan")

    # Teks soal
    question_jp    = models.TextField(help_text="Kalimat/soal dalam bahasa Jepang")
    question_id    = models.TextField(blank=True, help_text="Konteks soal dalam Bahasa Indonesia (opsional)")

    # Khusus Doukai: terjemahan yang "ditampilkan" ke user (bisa sengaja salah)
    shown_translation      = models.TextField(blank=True,
                                               help_text="Terjemahan yang ditampilkan (khusus tipe doukai)")
    is_translation_correct = models.BooleanField(null=True, blank=True,
                                                  help_text="Apakah shown_translation itu benar? (kunci jawaban doukai)")

    # Jawaban dan pilihan
    correct_answer = models.CharField(max_length=512, help_text="Jawaban yang benar")
    options        = models.JSONField(default=list,
                                       help_text="Daftar pilihan jawaban (list of string)")

    # Penjelasan setelah menjawab
    explanation    = models.TextField(blank=True,
                                       help_text="Penjelasan singkat setelah user menjawab")

    # Relasi ke konten yang relevan
    grammar = models.ForeignKey('Grammar', null=True, blank=True, on_delete=models.SET_NULL,
                                 related_name='minna_questions',
                                 help_text="Pola tata bahasa yang terkait")
    vocab   = models.ForeignKey('Vocab', null=True, blank=True, on_delete=models.SET_NULL,
                                 related_name='minna_questions',
                                 help_text="Kosakata yang terkait")

    jlpt_level = models.IntegerField(choices=JLPTLevel.choices, default=JLPTLevel.N5,
                                      help_text="Level JLPT yang sesuai")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['book', 'chapter', 'question_type']
        indexes  = [
            models.Index(fields=['book', 'chapter']),
            models.Index(fields=['question_type', 'jlpt_level']),
        ]

    def __str__(self):
        return f"[Minna {self.book} Bab {self.chapter}] {self.get_question_type_display()} — {self.question_jp[:50]}"