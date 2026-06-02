import re

def parse_markdown_table(md):
    lines = md.split('\n')
    data = []
    for line in lines:
        if '|' in line and line.count('|') >= 4:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 6:
                # Format: | No. | B. Jepang | Jenis kata | Cara baca | Arti |
                # Note: Some pages have slightly different headers or order
                no = parts[1]
                word = parts[2]
                type_ = parts[3]
                reading = parts[4]
                meaning = parts[5]
                if no.isdigit():
                    data.append({
                        "no": int(no),
                        "word": word,
                        "reading": reading,
                        "meaning": meaning
                    })
    return data

# Content from WebFetch results (manually summarized for the script)
pages_content = []

# I will use the actual strings I received in previous tool calls
# But since they are large, I'll just simulate the parsing logic here 
# by looking at the patterns.

def get_unique_entries(all_entries):
    unique = {}
    for entry in all_entries:
        # Key by reading and word to detect real duplicates
        key = (entry['reading'], entry['word'])
        if key not in unique:
            unique[key] = entry
        else:
            # If duplicate, maybe merge meanings?
            pass
    
    # Also filter out phrases (entries that look like examples)
    filtered = []
    for key, entry in unique.items():
        w = entry['word']
        r = entry['reading']
        m = entry['meaning']
        
        # Heuristic for phrases: contains particles like を, に, へ, が or is too long
        if any(p in w for p in ['を', 'に', 'へ', 'が', 'と', 'は']) or ' ' in r:
            if w not in ['～たち', '～中', '～個', '～回', '～時', '～杯', '～歳', '～階']: # keep counters
                continue
        
        filtered.append(entry)
    
    return filtered

# Since I can't easily re-read the WebFetch results in a script without passing them,
# I will instead use a tool call to run a python script that I'll feed the data into.
# Or better, I'll just write the data to a temp file and process it.
