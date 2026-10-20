# SEO JBook: Implementasi dan Progress

Panduan ini menyatukan implementasi SEO yang ada dan pola kode untuk pengembangan berikutnya. Catatan arsitektur penting: Next.js di Vercel adalah pemilik halaman publik di `https://jbook-five.vercel.app`; Django saat ini melayani API di `/api/`. Karena itu Google harus menerima canonical URL di domain frontend, bukan halaman HTML duplikat di host backend.

## Status Implementasi

- Metadata global, Open Graph, Twitter Card, canonical, dan `robots.txt` tersedia di Next.js.
- Detail kanji, bunpo, dan kotoba dirender oleh server Next.js, memiliki metadata dinamis, `LearningResource`, dan breadcrumb JSON-LD.
- Sitemap Next.js mengambil seluruh kanji dan memaginasi grammar serta vocab, tidak berhenti pada 300 entri pertama.
- Model Django memakai UUID untuk vocab/grammar/kanji; vocab dan grammar belum memiliki slug. URL frontend aktif ialah `/kotoba/[id]`, `/bunpo/[id]`, dan `/kanji/[id]`.
- Django belum menjadi renderer HTML SEO. Endpoint quiz saat ini menghasilkan soal latihan, bukan quiz publik permanen yang otomatis layak diindeks.

## 1. Programmatic SEO dan URL

### Pilihan untuk deployment sekarang

Jangan membuat halaman Django kedua pada URL materi yang sama. Pertahankan halaman publik di Next.js dan gunakan API Django sebagai sumber data. Jika ingin URL lebih mudah diingat, tambahkan slug sebagai alamat kanonis secara bertahap; UUID tetap menjadi primary key dan identifier API.

Slug perlu diisi dan diperiksa unik sebelum route dipublikasikan. Jangan mengandalkan slugify untuk mengubah kana menjadi romaji: simpan slug editorial/romaji yang stabil, misalnya `taberu`, dan fallback ke UUID bila transliterasi tidak tersedia. Kanji boleh menggunakan karakter Unicode di segmen URL; encode ketika URL dibentuk.

Contoh field untuk model vocab dan grammar. Migrasikan dengan kolom nullable, lakukan backfill slug unik, kemudian ubah menjadi wajib. Jangan menambah kolom unik non-null pada tabel yang sudah berisi data tanpa backfill.

```python
# content/models.py
class Vocab(models.Model):
    # Pertahankan field lain yang sudah ada.
    seo_slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)

class Grammar(models.Model):
    # Pertahankan field lain yang sudah ada.
    seo_slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)
```

Tambahkan field ke admin agar slug konten baru dapat dikelola. Bila ingin berlaku untuk kanji, gunakan `character` sebagai URL seperti saat ini atau tambahkan field slug Unicode yang unique. Jangan mengubah primary key.

Jika Django kelak menjadi renderer publik, route berikut menerima karakter Unicode dan mengembalikan 404 untuk slug yang tidak dikenal:

```python
# content/seo_urls.py
from django.urls import path
from . import seo_views

urlpatterns = [
    path("vocab/<slug:slug>/", seo_views.vocab_detail, name="seo-vocab-detail"),
    path("kanji/<str:character>/", seo_views.kanji_detail, name="seo-kanji-detail"),
    path("grammar/<slug:slug>/", seo_views.grammar_detail, name="seo-grammar-detail"),
]
```

```python
# core/urls.py, hanya bila Django memang menjadi web frontend publik
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
    path("", include("content.seo_urls")),
]
```

Contoh view menggunakan model yang ada setelah migrasi slug:

```python
# content/seo_views.py
from django.shortcuts import get_object_or_404, render
from .models import Grammar, Kanji, Vocab

def vocab_detail(request, slug):
    vocab = get_object_or_404(
        Vocab.objects.prefetch_related("kanji_rel", "curriculum_units"), seo_slug=slug
    )
    return render(request, "content/vocab_detail.html", {"vocab": vocab})

def kanji_detail(request, character):
    kanji = get_object_or_404(Kanji, character=character)
    return render(request, "content/kanji_detail.html", {"kanji": kanji})

def grammar_detail(request, slug):
    grammar = get_object_or_404(
        Grammar.objects.prefetch_related("curriculum_units"), seo_slug=slug
    )
    return render(request, "content/grammar_detail.html", {"grammar": grammar})
```

Untuk deployment sekarang, padanannya adalah Next.js App Router dengan `generateMetadata()` dan Server Component. Pastikan konten materi hadir di HTML awal, bukan baru diambil setelah browser berjalan. Filter pencarian, dashboard, editor, dan latihan personal bukan landing page materi dan tidak seharusnya masuk sitemap.

## 2. Sitemap, Cache, dan SSR

### Sitemap production

`frontend-web/app/sitemap.js` adalah sitemap publik yang tepat untuk deployment Vercel. Next.js memanggil API Django dan mengeluarkan URL canonical frontend. Daftar vocab/grammar dipaginasi dengan `limit` maksimum API 300. Revalidasi 24 jam menyeimbangkan biaya API dan kesegaran; gunakan on-demand revalidation jika konten perlu muncul lebih cepat.

Management command tidak otomatis berjalan saat database berubah. Menulis ulang XML melalui `post_save` bukan pola yang disarankan: request admin menjadi lambat, operasi bersamaan dapat saling menimpa, dan filesystem serverless bersifat ephemeral. Untuk sistem saat ini, jangan menghasilkan sitemap kedua dari Django. Jika Django kelak menjadi host sitemap, sitemap dinamis berbasis query lebih sesuai. Command berikut hanya untuk ekspor snapshot/CI atau host Django dengan lokasi output yang dipublikasikan.

Contoh `backend/content/management/commands/build_seo_sitemap.py`. Kode ini sengaja menggunakan URL UUID yang saat ini aktif; ganti hanya setelah route slug benar-benar dideploy dan redirect lama tersedia.

```python
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from content.models import FeatureSetting, Grammar, Kanji, Vocab

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

def disabled_levels(key, default=()):
    setting = FeatureSetting.objects.filter(key=key).only("value").first()
    if not setting or not isinstance(setting.value, dict):
        return set(default)
    return {
        level for level in setting.value.get("disabled_levels", [])
        if level in range(1, 6)
    }

class Command(BaseCommand):
    help = "Generate an XML sitemap snapshot for public JBook content"

    def handle(self, *args, **options):
        output = os.environ.get("SEO_SITEMAP_OUTPUT")
        if not output:
            raise CommandError("Set SEO_SITEMAP_OUTPUT to the public sitemap.xml output path")

        base = settings.FRONTEND_URL.rstrip("/")
        entries = [(f"{base}/", None)]
        entries += [
            (f"{base}/kanji/{obj.pk}", None)
            for obj in Kanji.objects.exclude(
                jlpt_level__in=disabled_levels("kanji_visibility", default=(1, 2, 3))
            ).only("id", "jlpt_level")
        ]
        entries += [
            (f"{base}/bunpo/{obj.pk}", None)
            for obj in Grammar.objects.exclude(
                jlpt_level__in=disabled_levels("bunpo_visibility")
            ).only("id", "jlpt_level")
        ]
        entries += [
            (f"{base}/kotoba/{obj.pk}", None)
            for obj in Vocab.objects.exclude(
                jlpt_level__in=disabled_levels("vocab_visibility")
            ).only("id", "jlpt_level")
        ]

        if len(entries) > 50_000:
            raise CommandError("More than 50,000 URLs; split into files and publish a sitemap index")

        root = Element(f"{{{SITEMAP_NS}}}urlset")
        lastmod = datetime.now(timezone.utc).date().isoformat()
        for url, _ in entries:
            item = SubElement(root, f"{{{SITEMAP_NS}}}url")
            SubElement(item, f"{{{SITEMAP_NS}}}loc").text = url
            SubElement(item, f"{{{SITEMAP_NS}}}lastmod").text = lastmod

        destination = Path(output)
        destination.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary = tempfile.mkstemp(dir=destination.parent, prefix=".sitemap-")
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
                stream.write(tostring(root, encoding="utf-8"))
            os.replace(temporary, destination)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

        self.stdout.write(self.style.SUCCESS(f"Wrote {len(entries)} URLs to {destination}"))
```

Jalankan pada lingkungan Django setelah membuat command: `SEO_SITEMAP_OUTPUT=/path/yang/dipublikasikan/sitemap.xml python manage.py build_seo_sitemap`. Jangan arahkan ke filesystem ephemeral Vercel dan jangan menjalankan command ini sebagai pengganti `app/sitemap.js` untuk deployment yang sekarang.

### Cache dan rendering

- Cache hanya materi publik. Jangan cache response yang bergantung pada authorization, progress user, dashboard, atau cookie.
- Fetch detail publik di Next dapat menggunakan `next: { revalidate: 3600 }` (atau lebih lama untuk konten stabil). Gunakan on-demand revalidation setelah publikasi jika freshness 24 jam terlalu lambat.
- Halaman materi publik sebaiknya request-independent Server Components dan mengirim HTML bermakna pada response pertama. Jangan memaksa static generation untuk halaman yang bergantung pada sesi.
- Vercel menangani SSR/ISR Next.js. Pisahkan data publik Django dari endpoint personal; jangan memasukkan data privat ke response SEO.
- `robots.txt` adalah petunjuk crawling, bukan kontrol akses. Lindungi endpoint privat dengan auth dan gunakan `noindex` untuk layar aplikasi privat sebagai sinyal tambahan.
- Cache Django file-based saat ini untuk rate-limit/OTP bukan cache halaman Vercel dan tidak dibagi lintas instance. Gunakan cache terkelola bersama, seperti Redis, hanya jika beban API memang membutuhkannya.

## 3. JSON-LD LearningResource dan Quiz

Structured data harus cocok dengan materi yang terlihat. `LearningResource` sesuai untuk detail materi. Gunakan `Quiz` hanya untuk landing page kuis publik yang konten dan ringkasannya terlihat; endpoint `/practice/generate` menghasilkan soal acak per request sehingga bukan halaman statis yang perlu diindeks. Jangan masukkan jawaban, token, atau data pribadi ke JSON-LD. Schema valid tidak menjamin rich result.

Siapkan JSON-LD di view dan escape karakter HTML setelah serialisasi untuk mencegah konten database menutup elemen `<script>`:

```python
import json
from django.conf import settings
from django.shortcuts import get_object_or_404, render
from .models import Vocab

def safe_json_ld(value):
    return (json.dumps(value, ensure_ascii=False)
            .replace("<", "\\u003c")
            .replace(">", "\\u003e")
            .replace("&", "\\u0026"))

def vocab_detail(request, slug):
    vocab = get_object_or_404(Vocab, seo_slug=slug)
    canonical = f"{settings.FRONTEND_URL.rstrip('/')}/kotoba/{vocab.pk}"
    schema = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": f"Arti {vocab.word} ({vocab.reading}) dalam Bahasa Indonesia",
        "description": f"Pelajari arti {vocab.word}: {vocab.meaning}, cara baca, dan contoh kalimat.",
        "learningResourceType": "Vocabulary lesson",
        "inLanguage": ["id", "ja"],
        "educationalLevel": f"JLPT N{vocab.jlpt_level}",
        "url": canonical,
        "isPartOf": {
            "@type": "WebSite", "name": "JBook", "url": settings.FRONTEND_URL
        },
    }
    return render(request, "content/vocab_detail.html", {
        "vocab": vocab,
        "canonical": canonical,
        "json_ld": safe_json_ld(schema),
    })
```

```django
{# content/vocab_detail.html #}
<script type="application/ld+json">{{ json_ld|safe }}</script>
<article>
  <h1>{{ vocab.word }} ({{ vocab.reading }})</h1>
  <p>{{ vocab.meaning }}</p>
</article>
```

Untuk landing page kuis tetap, contoh schema minimum:

```python
quiz_schema = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": "Latihan Kosakata JLPT N5",
    "description": "Latihan 10 soal kosakata Jepang tingkat JLPT N5.",
    "educationalLevel": "JLPT N5",
    "inLanguage": "id",
    "numberOfQuestions": 10,
    "about": {"@type": "Thing", "name": "Kosakata bahasa Jepang"},
}
```

Di Next.js, render JSON-LD dari Server Component sebagai script bertipe `application/ld+json`; escape `<` menjadi `\\u003c` sebelum menyisipkan. Detail kanji/kotoba/bunpo yang ada sudah menggunakan pola `LearningResource`.

## 4. Internal Linking dan Content Silo

Gunakan kurikulum sebagai hub karena `CurriculumUnit` sudah menghubungkan vocab, grammar, dan kanji. Tautkan hanya materi publik dan tampilkan daftar terkait kecil serta relevan. Contoh query berbasis relasi Django yang sudah tersedia:

```python
from .models import Grammar, Vocab

unit_ids = vocab.curriculum_units.values_list("id", flat=True)
related_vocab = Vocab.objects.filter(
    curriculum_units__id__in=unit_ids,
    jlpt_level=vocab.jlpt_level,
).exclude(pk=vocab.pk).distinct().order_by("word")[:8]

related_grammar = Grammar.objects.filter(
    curriculum_units__id__in=unit_ids,
    jlpt_level=vocab.jlpt_level,
).distinct().order_by("chapter", "title")[:6]

grammar_vocab = Vocab.objects.filter(
    grammar_sentences__grammar=grammar,
).distinct().order_by("word")[:8]
```

Tampilkan `CurriculumUnit` sebagai parent hub, lalu hubungkan ke halaman level JLPT yang nyata dan dapat di-crawl, misalnya katalog `/kotoba?level=5`. Untuk kanji, gunakan relasi `kanji_rel` alih-alih pencarian substring kata. Untuk grammar, `GrammarSentence.expressions` menyediakan vocab kontekstual; JSON `sentences` bisa menjadi fallback bila record relasional belum tersedia. Link detail tetap memakai ID seperti sitemap saat ini sampai migrasi slug dan redirect selesai.

## 5. Metadata Dinamis

Django template melakukan autoescape secara default. Buat title dan description dari field teks, jangan gunakan HTML mentah atau `safe` untuk metadata.

```python
from django.conf import settings
from django.shortcuts import get_object_or_404, render
from django.utils.html import strip_tags
from django.utils.text import Truncator
from .models import Vocab

def vocab_detail(request, slug):
    vocab = get_object_or_404(Vocab, seo_slug=slug)
    description = Truncator(strip_tags(
        f"Arti {vocab.word} ({vocab.reading}): {vocab.meaning}. "
        "Pelajari contoh kalimat dan cara baca di JBook."
    )).chars(155)
    return render(request, "content/vocab_detail.html", {
        "vocab": vocab,
        "page_title": f"Arti {vocab.word} ({vocab.reading}) | JBook",
        "page_description": description,
        "canonical": f"{settings.FRONTEND_URL.rstrip('/')}/kotoba/{vocab.pk}",
    })
```

```django
<title>{{ page_title }}</title>
<meta name="description" content="{{ page_description }}">
<link rel="canonical" href="{{ canonical }}">
<h1>Arti {{ vocab.word }} ({{ vocab.reading }})</h1>
```

Untuk route Next.js aktif, gunakan `generateMetadata({ params })`, `metadataBase` global, dan canonical URL pada domain frontend. Metadata harus cocok dengan teks yang terlihat. Untuk objek yang tidak ditemukan, gunakan 404 (`notFound()` di Next) dan hindari metadata generik yang dapat terindeks.

## Progress dan Verifikasi

- Selesai: audit arsitektur menunjukkan Next.js adalah renderer SEO publik, sedangkan Django adalah API.
- Selesai: sitemap Next.js mengambil seluruh halaman vocab/grammar melalui paginasi API dan mempertahankan URL UUID aktif.
- Sudah tersedia: metadata global/detail, `LearningResource`, breadcrumb JSON-LD, robots, dan server rendering halaman detail Next.js.
- Berikutnya: uji `/sitemap.xml` hasil deploy untuk memastikan jumlah entri melampaui 300; periksa HTML awal untuk H1, title, description, canonical, konten dan JSON-LD; uji structured data dengan Schema Markup Validator.
- Sebelum mengaktifkan slug: backfill unik, uji 404/duplikat, siapkan redirect permanen dari URL lama, lalu perbarui canonical dan sitemap secara bersamaan.
- Setelah deploy: submit `https://jbook-five.vercel.app/sitemap.xml` di Google Search Console dan pantau coverage serta Core Web Vitals.

Slug dan management command Django dalam dokumen ini merupakan opsi bila diperlukan, bukan jalur production saat Next.js tetap menjadi host halaman publik. Prioritas SEO berikutnya adalah audit HTML hasil deploy, kelengkapan konten, internal linking antar-unit kurikulum, dan pengukuran Search Console.
