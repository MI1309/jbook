import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Delete } from 'lucide-react';

const hiraganaMap = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', 'ゆ', 'よ', 'わ', 'を', 'ん'],
  // Dakuten / Handakuten can be toggled or shown as separate page,
  // but for a simple MVP we can add the most common ones or let wanakana handle it.
  // Actually, providing a basic one is fine.
  ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
  ['ゃ', 'ゅ', 'ょ', 'っ', 'ー']
];

export const VirtualKeyboard = () => {
  const { gameState, inputChar, deleteChar } = useGameStore();

  if (!gameState.grid) return null;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner mt-4 block sm:hidden">
      <div className="flex flex-col gap-1">
        {hiraganaMap.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map((char, cIdx) => (
              <button
                key={cIdx}
                onClick={() => inputChar(char)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded shadow-sm flex items-center justify-center text-lg active:bg-red-100 dark:active:bg-red-900 transition-colors"
              >
                {char}
              </button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-1 mt-2">
          <button
            onClick={deleteChar}
            className="w-20 h-12 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded shadow-sm flex items-center justify-center active:bg-red-200 transition-colors"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
