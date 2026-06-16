import pypdf
import os

pdf_dir = "/home/imron/jbook/data_proses"

for lvl in [5, 4, 3, 2, 1]:
    pdf_path = os.path.join(pdf_dir, f"KanjiList.N{lvl}.pdf")
    if os.path.exists(pdf_path):
        print(f"\n--- N{lvl} Kanji PDF ({pdf_path}) ---")
        try:
            reader = pypdf.PdfReader(pdf_path)
            print(f"Total pages: {len(reader.pages)}")
            if len(reader.pages) > 0:
                first_page_text = reader.pages[0].extract_text()
                print("First 800 chars of page 1:")
                print(first_page_text[:800])
                print("-------------------------------")
        except Exception as e:
            print(f"Error reading N{lvl}: {e}")
    else:
        print(f"KanjiList.N{lvl}.pdf not found")
