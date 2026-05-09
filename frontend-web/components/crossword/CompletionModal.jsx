import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Trophy, RotateCcw, X } from 'lucide-react';

export const CompletionModal = () => {
  const { gameState, resetGame } = useGameStore();

  if (!gameState.isCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="bg-gradient-to-br from-red-500 to-orange-600 p-8 text-center text-white relative">
          <button 
            onClick={resetGame}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
          
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Trophy size={40} className="text-yellow-300" />
          </div>
          <h2 className="text-3xl font-black mb-1">Luar Biasa!</h2>
          <p className="text-red-100">Kamu berhasil menyelesaikan teka-teki N{gameState.level}.</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
              <div className="text-sm text-gray-500 font-medium mb-1">Skor Akhir</div>
              <div className="text-3xl font-black text-red-600 dark:text-red-400">{gameState.score}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
              <div className="text-sm text-gray-500 font-medium mb-1">Kata Diselesaikan</div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400">{gameState.completedWordIds.length}</div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 py-4 rounded-xl font-bold text-lg transition-transform active:scale-95"
          >
            <RotateCcw size={20} />
            Main Lagi
          </button>
        </div>

      </div>
    </div>
  );
};
