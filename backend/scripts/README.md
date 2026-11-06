# Backend Operational Scripts

Run commands from `backend/` unless stated otherwise. The scripts use local paths and project settings in several different ways, so confirm the expected input files and database before running them. Database mutation or deletion is called out below.

The repository does not identify a maintainer for these scripts; owner is **unknown** for every entry. “Supported” below means that a workflow is documented in the repository, not that it has a production support guarantee. Every other script is marked `# EXPERIMENTAL — tidak didukung` in its file header. No script has been moved or deleted.

## `backend/scripts/`

| Script | Purpose and usage | Status | Owner |
|---|---|---|---|
| `check_kanji.py` | Print Kanji count/sample; `python scripts/check_kanji.py` (legacy settings/path may fail). | Experimental | Unknown |
| `check_kanji_db.py` | Count Kanji by JLPT from SQLite; `python scripts/check_kanji_db.py` (hard-coded DB path). | Experimental | Unknown |
| `check_n4_online.py` | Compare N4 JSON with API; `python scripts/check_n4_online.py`; requires `JBOOK_API_EMAIL`, `JBOOK_API_PASSWORD`, optional `JBOOK_API_BASE_URL`, network and `deep-translator`. | Experimental | Unknown |
| `cleanup_duplicates.py` | Remove duplicate Kanji/vocab and fill selected radicals; `python scripts/cleanup_duplicates.py` (destructive DB writes). | Experimental | Unknown |
| `cleanup_n4_vocab.py` | Normalize N4 vocab meanings; `python scripts/cleanup_n4_vocab.py` (DB writes; compare with `cleanup_n4_kotoba` command). | Experimental | Unknown |
| `compare_kanji_db.py` | Compare local PDF Kanji with DB; `python scripts/compare_kanji_db.py`; requires `pypdf` and files under `/home/imron/jbook/data_proses`. | Experimental | Unknown |
| `compile_n5.py` | Compile hand-curated N5 entries into `scripts/n5_594.json`; `python scripts/compile_n5.py`. | Experimental | Unknown |
| `do_import.py` | Import `bunpo_data_n4.json` and rewrite its IDs; `python scripts/do_import.py` from a directory containing that file (DB and JSON writes, runs on import). | Experimental | Unknown |
| `fix_svg.py` | Reload/normalize Kanji SVG data from `kanjivg_files/`; `python scripts/fix_svg.py` (bulk DB updates). | Experimental | Unknown |
| `import_jsho_batch.py` | Batch-import EDICT as N5 vocab; `python scripts/import_jsho_batch.py`; expects `~/jbook/data_proses/data_jsho/edict`, Django and `deep-translator` (DB writes). | Experimental | Unknown |
| `import_jsho_interactive.py` | Manually review/translate EDICT entries and import vocab; `python scripts/import_jsho_interactive.py`; expects `~/jbook/data_proses/data_jsho/edict` and `deep-translator`. Documented in `docs/database_schema.md` and `docs/logic_app.md`. | Supported, documented workflow | Unknown |
| `import_kotoba_ji_to_tadoshi.py` | Sync `data/kotoba_ji_to_tadoshi.json` to vocab, replacing same-word entries; `python scripts/import_kotoba_ji_to_tadoshi.py` (DB writes). | Experimental | Unknown |
| `import_n4.py` | Import N4 grammar and rewrite invalid IDs; `python scripts/import_n4.py` (DB and JSON writes). | Experimental | Unknown |
| `import_n4_debug.py` | Debug N4 grammar import and rewrite IDs; `python scripts/import_n4_debug.py` (DB and JSON writes). | Experimental | Unknown |
| `insert_svg.py` | Load Kanji SVG files from `kanjivg_files/`; `python scripts/insert_svg.py` (bulk DB writes). | Experimental | Unknown |
| `inspect_kanji_pdf.py` | Inspect local Kanji PDFs; `python scripts/inspect_kanji_pdf.py`; requires `pypdf` and files under `/home/imron/jbook/data_proses`. | Experimental | Unknown |
| `populate_bunpo.py` | Seed three sample grammar entries; `python scripts/populate_bunpo.py`. | Experimental | Unknown |
| `populate_bunpo_n2_n1.py` | Import N2/N1 grammar fixtures; `python scripts/populate_bunpo_n2_n1.py` (upserts; related `import_bunpo` command exists). | Experimental | Unknown |
| `populate_bunpo_n3.py` | Import N3 grammar fixture; `python scripts/populate_bunpo_n3.py` (upserts; related `import_bunpo` command exists). | Experimental | Unknown |
| `populate_grammar.py` | Import `content/fixtures/grammar_data.json`; `python scripts/populate_grammar.py` (DB writes). | Experimental | Unknown |
| `populate_kanji.py` | Import N5-N1 Kanji JSON and fill missing radicals; `python scripts/populate_kanji.py` (related `populate_kanji` command exists). | Experimental | Unknown |
| `populate_kanji_standalone.py` | Seed three sample Kanji; `python scripts/populate_kanji_standalone.py`. | Experimental | Unknown |
| `populate_kanji_types.py` | Derive Kanji word types from vocab relations; `python scripts/populate_kanji_types.py` (DB writes). | Experimental | Unknown |
| `populate_minna_ii.py` | Import `data/minna_ii_*.json` as N4 vocab; `python scripts/populate_minna_ii.py` (DB writes). | Experimental | Unknown |
| `populate_particles.py` | Seed ten N5 particles; `python scripts/populate_particles.py`. | Experimental | Unknown |
| `populate_particles_direct.py` | Update particles through direct SQLite; `python scripts/populate_particles_direct.py` from `backend/` (bypasses ORM). | Experimental | Unknown |
| `populate_vocab.py` | Seed mock N5/N4 vocab; `python scripts/populate_vocab.py`. | Experimental | Unknown |
| `process_n5.py` | Process curated N5 entries into `scripts/n5_594.json`; `python scripts/process_n5.py`. | Experimental | Unknown |
| `sync_kanji_levels.py` | Update levels for hard-coded Kanji through SQLite; `python scripts/sync_kanji_levels.py` (hard-coded DB writes). | Experimental | Unknown |
| `sync_pdf_vocab.py` | Replace vocab at each level from parsed JSON; `python scripts/sync_pdf_vocab.py` (deletes all existing rows at affected levels first). | Experimental | Unknown |
| `temp_parser.py` | Markdown-table parsing helpers with unfinished/manual workflow; `python scripts/temp_parser.py`. | Experimental | Unknown |
| `test_api_fetch.py` | Probe local API login/Kanji/admin endpoints; `python scripts/test_api_fetch.py`; expects server on port 8000 and contains hard-coded test credentials. | Experimental | Unknown |
| `test_filter.py` | Print vocab filter counts/examples; `python scripts/test_filter.py`. | Experimental | Unknown |
| `test_jamdict.py` | Probe Jamdict lookup for `食べる`; `python scripts/test_jamdict.py`; requires Jamdict data. | Experimental | Unknown |
| `test_schema.py` | Validate a mock Pydantic object; `python scripts/test_schema.py`. | Experimental | Unknown |
| `test_setup.py` | Initialize Django and print grammar count; `python scripts/test_setup.py`. | Experimental | Unknown |
| `translate_csv.py` | Translate CSV `meaning` column; `python scripts/translate_csv.py <source_file> <expected_rows>`; requires network and `deep-translator`. | Experimental | Unknown |
| `translate_csv_n5.py` | Translate a fixed N5 CSV (expects 718 rows); `python scripts/translate_csv_n5.py`; fixed paths, network and `deep-translator` required. | Experimental | Unknown |
| `update_admin.py` | Prompt for an email and grant staff access; `python scripts/update_admin.py`. One-time operational workflow documented in `docs/backend_setup.md`. | Supported, documented one-time operation | Unknown |
| `update_vocab_types.py` | Update vocab `word_type` using Jamdict; `python scripts/update_vocab_types.py`; requires Jamdict. | Experimental | Unknown |

## Root-Level `backend/` Scripts

| Script | Purpose and usage | Status | Owner |
|---|---|---|---|
| `batch_translate.py` | Heuristically translate/update vocab using SQLite; `python batch_translate.py` from `backend/` (network and direct DB writes). | Experimental | Unknown |
| `check_english.py` | Print vocab meanings that look English; `python check_english.py`. | Experimental | Unknown |
| `cleanup_vocab.py` | Merge/delete duplicate or redundant vocab; `python cleanup_vocab.py` (destructive DB writes). | Experimental | Unknown |
| `count_eng.py` | Count likely untranslated meanings using SQLite; `python count_eng.py` from `backend/`. | Experimental | Unknown |
| `find_dups.py` | Print duplicate N4 vocab candidates; `python find_dups.py`. | Experimental | Unknown |
| `main.py` | CLI for vocab list/add/sync/translate/export; `python main.py <command>`. `add` uses `--word`/`--meaning`; `sync` uses optional `--file`/`--skip-existing`; translation needs network; export supports `--format json|csv`. | Experimental pending owner confirmation | Unknown |
| `sync_n5.py` | Replace N5 vocab from `scripts/n5_594.json`; `python sync_n5.py` (deletes current N5 rows first). | Experimental | Unknown |
| `translate_vocab.py` | Heuristically translate/update vocab meanings; `python translate_vocab.py`; requires network and `deep-translator` (similar `translate_vocab` command exists). | Experimental | Unknown |

## Supporting Data Files

| File | Purpose |
|---|---|
| `scripts/import_progress.json` | Runtime progress state for JSHO importers; not executable. |
| `scripts/n5_594.json` | Generated N5 dataset used by `sync_n5.py`; not executable. |

## Future Management Command Candidates

Prioritize repeatable Django ORM imports, syncs, and cleanup operations, after comparing input contracts and behavior with existing commands: `cleanup_duplicates.py`, `cleanup_n4_vocab.py`, `import_jsho_batch.py`, `import_kotoba_ji_to_tadoshi.py`, `import_n4.py`, `fix_svg.py`, `insert_svg.py`, the grammar/vocab/Kanji/particle/Minna population scripts, `populate_kanji_types.py`, `sync_pdf_vocab.py`, `batch_translate.py`, `cleanup_vocab.py`, `sync_n5.py`, and `translate_vocab.py`. Related commands already exist for some work, including `cleanup_n4_kotoba`, `import_bunpo`, `populate_kanji`, and `translate_vocab`; do not assume they are behaviorally interchangeable. No migration or file move is part of this inventory step.