import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Lightbulb, LogOut, ShieldAlert, X } from 'lucide-react';

export const GameControls = () => {
  const { gameState, useHint, resetGame } = useGameStore();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!gameState.grid) return null;

  const handleExit = () => {
    resetGame();
    setShowExitConfirm(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-4">
      <button
        onClick={useHint}
        disabled={gameState.isCompleted || gameState.score <= 0}
        className="flex items-center gap-2 px-4 py-2 bg-accent-green/10 hover:bg-accent-green/20 text-accent-green border border-accent-green/20 rounded-full font-medium transition-colors disabled:opacity-50"
      >
        <Lightbulb size={18} />
        <span>Hint (-10 pt)</span>
      </button>

      <button
        onClick={() => setShowExitConfirm(true)}
        className="flex items-center gap-2 px-6 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 rounded-full font-medium transition-colors"
      >
        <LogOut size={18} />
        <span>Keluar</span>
      </button>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-[var(--card-bg)] shadow-2xl shadow-slate-950/30">
            <div className="flex items-start justify-between bg-gradient-to-br from-rose-500 to-orange-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">Keluar permainan</p>
                  <h2 className="text-lg font-black">Yakin ingin keluar?</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-full p-1 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Tutup dialog keluar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
                Progres TTS ini akan dihapus dan kamu kembali ke menu utama.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
                >
                  Tetap bermain
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-600"
                >
                  Ya, keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
