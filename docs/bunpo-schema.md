# Bunpo Pattern Schema

Schema ini menjadi kontrak frontend untuk pola tata bahasa Bunpo. Implementasi validasi dan normalisasi ringan berada di `frontend-web/lib/bunpo-schema.js`. Schema bersifat additive: field lama dipertahankan dan semua field baru opsional.

## Sumber Data

Katalog dan detail Bunpo saat ini berasal dari Django Ninja API:

- `GET /content/grammar?limit=300&page=1`, dipanggil oleh `frontend-web/lib/bunpo-catalog.js`.
- `GET /content/grammar/{id}`, dipanggil oleh `frontend-web/lib/bunpo-catalog.js` untuk detail.
- Serializer backend berada di `backend/content/grammar_relations.py`; schema response berada di `backend/content/api.py`.

Slug di `frontend-web/data/bunpoSlugs.js` adalah mapping frontend, bukan sumber data konten. Jika field baru perlu disimpan atau dikirim oleh API, serializer dan schema Django Ninja juga perlu diperluas pada langkah backend terpisah. Langkah ini tidak mengubah backend.

## Field Lama

Field lama dari API tetap dipertahankan:

| Field | Bentuk | Keterangan |
|---|---|---|
| `title` | string | Judul/pola; wajib untuk validasi frontend. |
| `structure` | string | Rumus atau struktur pola. |
| `explanation` | string | Penjelasan pola. |
| `chapter` | number | Nomor bab. |
| `jlpt_level` | number | Level JLPT 1–5; wajib untuk validasi frontend. |
| `sentences` | array | Contoh lama dengan `jp`, `id`, dan opsional `expressions`. |

API juga mengirim `id`; detail dapat mengirim `source_data`. Normalizer mempertahankan field tambahan tersebut agar tidak memutus kontrak API yang sudah ada.

## Field Baru Opsional

Semua field berikut opsional. `normalizeBunpoPattern()` memberikan default frontend: object opsional yang tidak ada menjadi `null`, list opsional menjadi `[]`, dan field dalam section object diisi nilai kosong.

| Field | Bentuk |
|---|---|
| `slug` | string |
| `tags` | string[] |
| `sections.mainFunction` | `{ summary?: string, points?: string[] }` |
| `sections.sentencePattern` | `{ formula?: string, variations?: { label: string, formula: string, example: string }[], notes?: string[] }` |
| `sections.examples` | `{ jp: string, reading?: string, id: string, level?: string, expressions?: { word: string, reading?: string, meaning?: string }[] }[]` |
| `sections.comparison` | `{ summary?: string, items?: { vs: string, difference: string, example: string }[] }` |
| `sections.nuance` | `{ summary?: string, points?: string[] }` |
| `sections.coreExplanation` | `{ summary?: string, text?: string }` |
| `sections.commonMistakes` | `{ wrong: string, correct: string, reason: string }[]` |
| `sections.faq` | `{ q: string, a: string }[]` |
| `sections.miniPractice` | `{ type: string, question: string, options?: string[], answer: string, explanation?: string }[]` |
| `sections.conceptMap` | `{ summary?: string, nodes?: { id: string, label: string, type: string }[], edges?: { from: string, to: string, label: string }[] }` |
| `relatedPatterns` | `{ title: string, slug: string, level: string }[]` |
| `source` | `{ url?: string, name?: string, license?: string }` |
| `metadata` | `{ createdAt?: string, updatedAt?: string, version?: string, isComplete?: boolean }` |

## Contoh Data Lama

Record seperti ini tetap valid tanpa field baru:

```json
{
  "id": "example-id",
  "title": "〜は〜です",
  "structure": "N1 は N2 です",
  "explanation": "",
  "chapter": 0,
  "jlpt_level": 5,
  "sentences": []
}
```

## Contoh Schema Lengkap

Contoh berikut hanya menunjukkan bentuk dan sengaja memakai nilai kosong; bukan konten pembelajaran:

```json
{
  "id": "example-id",
  "title": "〜は〜です",
  "structure": "",
  "explanation": "",
  "chapter": 0,
  "jlpt_level": 5,
  "sentences": [],
  "slug": "wa-desu",
  "tags": [],
  "sections": {
    "mainFunction": { "summary": "", "points": [] },
    "sentencePattern": { "formula": "", "variations": [], "notes": [] },
    "examples": [],
    "comparison": { "summary": "", "items": [] },
    "nuance": { "summary": "", "points": [] },
    "coreExplanation": { "summary": "", "text": "" },
    "commonMistakes": [],
    "faq": [],
    "miniPractice": [],
    "conceptMap": { "summary": "", "nodes": [], "edges": [] }
  },
  "relatedPatterns": [],
  "source": { "url": "", "name": "", "license": "" },
  "metadata": {
    "createdAt": "",
    "updatedAt": "",
    "version": "",
    "isComplete": false
  }
}
```

`frontend-web/data/bunpo-sections-pilot.js` memuat placeholder yang sama untuk dijadikan referensi pada langkah pengisian konten berikutnya.

## Backward Compatibility

- `isValidBunpoPattern()` menerima record lama; hanya `title` non-kosong dan `jlpt_level` numerik yang wajib pada validasi frontend.
- Field baru diperiksa tipenya jika tersedia, tetapi tidak wajib.
- `normalizeBunpoPattern()` mempertahankan field lama dan properti API lain, lalu memberi default pada field baru.
- UI detail saat ini tetap merender penjelasan dan `sentences` legacy. `sections` baru belum dirender.

## Langkah Berikutnya

2. Isi konten pilot `〜は〜です` tanpa mengubah kontrak legacy.
3. Rencanakan dan implementasikan render section baru di UI pada perubahan terpisah.