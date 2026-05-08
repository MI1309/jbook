import random

class CrosswordGenerator:
    def __init__(self, words_data, size=15):
        """
        words_data: list of dicts {'word': '...', 'meaning': '...', 'id': '...'}
        size: grid size (square)
        """
        self.size = size
        self.words_data = words_data
        self.grid = [['' for _ in range(size)] for _ in range(size)]
        self.placed_words = [] # list of dicts {'word', 'row', 'col', 'dir', 'meaning', 'id'}

    def generate(self):
        # Sort words by length descending to place longer words first
        available_words = sorted(self.words_data, key=lambda x: len(x['word']), reverse=True)
        
        if not available_words:
            return self.grid, []

        # Place the first word in the middle
        first = available_words.pop(0)
        start_row = self.size // 2
        start_col = (self.size - len(first['word'])) // 2
        self._place_word(first, start_row, start_col, 'H')

        # Try to place remaining words
        for _ in range(3): # Retry loop to increase density
            for word_info in available_words[:]:
                if any(pw['id'] == word_info['id'] for pw in self.placed_words):
                    continue
                
                # Find all possible intersections
                best_fit = self._find_best_fit(word_info)
                if best_fit:
                    self._place_word(word_info, *best_fit)
                    available_words.remove(word_info)

        return self.grid, self.placed_words

    def _place_word(self, word_info, row, col, direction):
        word = word_info['word']
        for i, char in enumerate(word):
            if direction == 'H':
                self.grid[row][col + i] = char
            else:
                self.grid[row + i][col] = char
        
        self.placed_words.append({
            'id': word_info['id'],
            'word': word,
            'meaning': word_info['meaning'],
            'row': row,
            'col': col,
            'direction': direction,
            'length': len(word)
        })

    def _find_best_fit(self, word_info):
        word = word_info['word']
        possible_fits = []

        for pw in self.placed_words:
            for i, char1 in enumerate(word):
                for j, char2 in enumerate(pw['word']):
                    if char1 == char2:
                        # Intersection found! Try to place 'word' perpendicular to 'pw'
                        new_dir = 'V' if pw['direction'] == 'H' else 'H'
                        
                        if new_dir == 'V':
                            new_row = pw['row'] - i
                            new_col = pw['col'] + j
                        else:
                            new_row = pw['row'] + j
                            new_col = pw['col'] - i
                        
                        if self._can_place(word, new_row, new_col, new_dir):
                            possible_fits.append((new_row, new_col, new_dir))

        if not possible_fits:
            return None
        
        # Return a random fit among possible fits
        return random.choice(possible_fits)

    def _can_place(self, word, row, col, direction):
        # Bounds check
        if row < 0 or col < 0: return False
        if direction == 'H' and col + len(word) > self.size: return False
        if direction == 'V' and row + len(word) > self.size: return False

        for i, char in enumerate(word):
            curr_row = row + (i if direction == 'V' else 0)
            curr_col = col + (i if direction == 'H' else 0)
            
            existing = self.grid[curr_row][curr_col]
            
            # 1. Must be empty or match the character
            if existing != '' and existing != char:
                return False
            
            # 2. Neighbors check (simplified: avoid parallel touching)
            if existing == '':
                if direction == 'H':
                    if self._has_neighbors(curr_row, curr_col, 'V'): return False
                else:
                    if self._has_neighbors(curr_row, curr_col, 'H'): return False

        # End of word check (ensure no character right after)
        if direction == 'H':
            if col > 0 and self.grid[row][col-1] != '': return False
            if col + len(word) < self.size and self.grid[row][col+len(word)] != '': return False
        else:
            if row > 0 and self.grid[row-1][col] != '': return False
            if row + len(word) < self.size and self.grid[row+len(word)][col] != '': return False

        return True

    def _has_neighbors(self, r, c, direction):
        """Checks if cell has neighbors in specific direction (orthogonal to placement)"""
        if direction == 'V':
            if r > 0 and self.grid[r-1][c] != '': return True
            if r < self.size - 1 and self.grid[r+1][c] != '': return True
        else:
            if c > 0 and self.grid[r][c-1] != '': return True
            if c < self.size - 1 and self.grid[r][c+1] != '': return True
        return False
