import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { clsx } from 'clsx';
import { Volume2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-toastify';

export const CluePanel = () => {
  const { gameState, selectCell, inputChar } = useGameStore();
  const clueRefs = useRef({});
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Determine which word is currently active
  const activeWordIds = gameState.selectedCell 
    ? gameState.grid?.cells[gameState.selectedCell.row][gameState.selectedCell.col].wordIds 
    : [];
  
  const activeWordId = activeWordIds.find(id => {
    const w = gameState.grid?.words.find(word => word.id === id);
    return w?.direction === gameState.selectedDirection;
  }) || activeWordIds[0];

  // Auto-scroll to active clue (desktop only so mobile screen doesn't jump/scroll down)
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) return;

    if (activeWordId && clueRefs.current[activeWordId]) {
      clueRefs.current[activeWordId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeWordId]);

  if (!gameState.grid) return null;

  if (gameState.mode === 'kanji') {
    const kanjiChoices = gameState.grid.choiceBank || [...new Set(gameState.grid.words.flatMap(word => [...word.text]))];
    const isSelectedCellCorrect = gameState.grid.cells[gameState.selectedCell?.row]?.[gameState.selectedCell?.col]?.validationState === 'correct';
    const activeWord = gameState.grid?.words.find(word => word.id === activeWordId);

    return (
      <div className="w-full p-4 sm:p-6 bg-[var(--card-bg)] rounded-[1.5rem] shadow-sm border border-[var(--border-color)] mt-4 lg:mt-0">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-accent-blue">Pilihan Jawaban</h3>
            <p className="text-xs text-gray-500 font-medium">Pilih satu kanji untuk mengisi kotak aktif</p>
          </div>
          {activeWordId && (
            <span className="text-[11px] font-bold text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {gameState.selectedDirection === 'across' ? 'Mendatar' : 'Menurun'}
            </span>
          )}
        </div>

        {activeWord && (
          <div className="hidden lg:block mb-4 p-3 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-accent-blue text-[10px] uppercase tracking-wider">
                {gameState.selectedDirection === 'across' ? 'Mendatar' : 'Menurun'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">({activeWord.text.length} kotak)</span>
            </div>
            <div className="font-bold text-foreground text-sm leading-snug">
              {activeWord.clue}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {kanjiChoices.map(char => (
            <button
              key={char}
              type="button"
              onClick={() => inputChar(char)}
              disabled={gameState.isCompleted || isSelectedCellCorrect}
              className="h-14 sm:h-16 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--background)] text-2xl font-japanese font-bold text-foreground hover:border-accent-blue hover:text-accent-blue hover:bg-accent-blue/5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
              aria-label={`Pilih kanji ${char}`}
            >
              {char}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleTTS = (wordObj, e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;

    // Use the kanji word if available, fallback to hiragana
    const textToSpeak = wordObj.word || wordObj.text;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ja-JP';
    
    const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP');
    if (jaVoice) utterance.voice = jaVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const acrossWords = gameState.grid.words.filter(w => w.direction === 'across');
  const downWords = gameState.grid.words.filter(w => w.direction === 'down');

  const renderClue = (word) => {
    const isActive = word.id === activeWordId;
    const isCompleted = word.isCompleted;
    const cellNum = gameState.grid.cells[word.startRow][word.startCol].number;
    
    const hasKanji = /[\u4e00-\u9faf]/.test(word.word || "");

    return (
      <div 
        key={word.id}
        ref={el => clueRefs.current[word.id] = el}
        onClick={() => selectCell(word.startRow, word.startCol)}
        className={twMerge(clsx(
          "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm",
          isActive ? "bg-accent-blue/10" : "hover:bg-[var(--background)]",
          isCompleted ? "opacity-60" : ""
        ))}
      >
        <div className="font-bold min-w-[24px] text-gray-500">{cellNum}.</div>
        <div className={clsx("flex-1", isCompleted && "line-through font-medium")}>
          <div className="text-foreground font-bold">{word.clue}</div>
          <div className="flex items-center gap-2 mt-1">
            {gameState.mode !== 'kanji' && hasKanji && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info(
                    <div>
                      <div className="font-bold text-lg">{word.word}</div>
                      <div className="text-[10px] opacity-80 uppercase tracking-widest mt-1">
                        JLPT N{word.level || gameState.level}
                      </div>
                    </div>,
                    { icon: "🧧" }
                  );
                }}
                className="text-accent-blue font-bold bg-accent-blue/10 px-1.5 py-0.5 rounded text-[10px] cursor-help"
              >
                {word.word}
              </span>
            )}
            <span className="text-gray-400 text-[10px]">({word.text.length} kotak)</span>
          </div>
        </div>
        {hasKanji && (
          <button 
            onClick={(e) => handleTTS(word, e)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Dengarkan pengucapan Kanji"
          >
            <Volume2 size={16} />
          </button>
        )}
        {isCompleted && <span className="text-green-500 font-bold">✓</span>}
      </div>
    );
  };

  return (
    <div className="hidden lg:flex flex-col md:flex-row gap-4 w-full p-3 sm:p-4 bg-[var(--card-bg)] rounded-[1.5rem] shadow-sm border border-[var(--border-color)] mt-4 lg:mt-0">
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-3 text-accent-blue border-b border-[var(--border-color)] pb-2">Across (Mendatar)</h3>
        <div className="space-y-1 max-h-[200px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
          {acrossWords.map(renderClue)}
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-3 text-accent-blue border-b border-[var(--border-color)] pb-2">Down (Menurun)</h3>
        <div className="space-y-1 max-h-[200px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
          {downWords.map(renderClue)}
        </div>
      </div>
    </div>
  );
};
