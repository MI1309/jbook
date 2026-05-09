import sys
import csv
import time
from deep_translator import GoogleTranslator
import os

def main():
    if len(sys.argv) != 3:
        print("Usage: python translate_csv.py <source_file> <expected_rows>")
        return

    source_file = sys.argv[1]
    expected_rows = int(sys.argv[2])
    target_file = source_file.replace('.csv', '_translated.csv')

    translator = GoogleTranslator(source='en', target='id')

    # Read original data
    rows = []
    with open(source_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        rows.append(header)
        for row in reader:
            rows.append(row)

    total_rows = len(rows) - 1 # excluding header
    print(f"Total rows found (excluding header): {total_rows}")

    if total_rows != expected_rows:
        print(f"Warning: Expected {expected_rows} rows but found {total_rows}!")
        return

    # Find the index of the 'meaning' column
    try:
        meaning_idx = header.index('meaning')
    except ValueError:
        print("Error: 'meaning' column not found in header!")
        return

    print("Starting translation...")
    
    # Translate (row[meaning_idx])
    for i in range(1, len(rows)):
        row = rows[i]
        original_meaning = row[meaning_idx]
        
        # We will translate every meaning to be safe
        try:
            translated_meaning = translator.translate(original_meaning)
            row[meaning_idx] = translated_meaning
        except Exception as e:
            print(f"Error translating row {i} - '{original_meaning}': {e}")
            # Keep original if failed
        
        if i % 50 == 0:
            print(f"Translated {i}/{total_rows} rows...")
        
        time.sleep(0.5) # Rate limit

    print("Translation complete. Saving to target file...")

    # Write to target file
    with open(target_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print(f"Successfully saved to {target_file}")
    
    # Verify row count of new file
    with open(target_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        new_row_count = sum(1 for _ in reader) - 1
        
    print(f"New file row count: {new_row_count}")
    
    if new_row_count == expected_rows:
        print(f"Row count matches exactly {expected_rows}. Everything looks good!")
        print(f"You can safely replace {os.path.basename(source_file)} with {os.path.basename(target_file)}")
    else:
        print("Row count mismatch! Do not replace.")


if __name__ == '__main__':
    main()
