# JLPT Curriculum

The curriculum catalog is additive. Existing `jlpt_level` fields and the legacy
`Grammar.chapter` field remain available to current web and mobile clients.
Legacy chapter values are not treated as reference-book unit identifiers.

## Data Model

- `CurriculumLevel` stores the displayable JLPT levels N5 through N1.
- `ReferenceBook` stores bibliographic metadata and can be associated with
  multiple levels.
- `CurriculumUnit` belongs to one level and one book. Its
  `original_unit_number` is the number printed in the referenced book;
  `display_order` controls ordering within that book and level.
- Grammar, vocabulary, kanji, and particles have optional many-to-many links
  to curriculum units. Existing content is not linked automatically because
  its source book cannot be established reliably from current fields.

The initial migration creates Minna no Nihongo Shokyu I for N5 and Shokyu II
for N4, each with original unit numbers 1-25. N5 display order is 1-25; N4
display order is 26-50. Bibliographic details not verified at implementation
time remain blank. N3, N2, and N1 levels exist without fabricated book/unit
records.

## API

- `GET /api/content/curriculum/levels`
- `GET /api/content/curriculum/books?level=N4`
- `GET /api/content/curriculum/books/{book_id}`
- `GET /api/content/curriculum/units?book={book_id}&level=N4`
- `GET /api/content/curriculum/units/{unit_id}`
- `GET /api/content/curriculum/units/{unit_id}/materials`
- `GET /api/content/bunpo?unit={unit_id}` filters grammar by its unit relation.

The legacy `level` and `chapter` filters for Bunpo remain supported. `chapter`
continues to mean the old `Grammar.chapter` field and is not reinterpreted as a
curriculum unit number.

## Manual Mapping

Use Django admin to maintain levels, reference books, and units. Add material
assignments from each Grammar, Vocab, Kanji, or Particle record using its
`curriculum_units` field. Verify the source book and original unit number
before assigning. Do not copy textbook passages; keep authored explanations and
examples separate from bibliographic metadata.