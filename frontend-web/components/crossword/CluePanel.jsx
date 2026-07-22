import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { clsx } from 'clsx';
import { Volume2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-toastify';

export const CluePanel = () => {
  const { gameState, selectCell } = useGameStore();
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

  // Auto-scroll to active clue
  useEffect(() => {
    if (activeWordId && clueRefs.current[activeWordId]) {
      clueRefs.current[activeWordId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeWordId]);

  if (!gameState.grid) return null;

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
    
    // Check if the word contains Kanji
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
            {hasKanji && (
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
    <div className="flex flex-col md:flex-row gap-4 w-full p-3 sm:p-4 bg-[var(--card-bg)] rounded-[1.5rem] shadow-sm border border-[var(--border-color)] mt-4 lg:mt-0">
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
