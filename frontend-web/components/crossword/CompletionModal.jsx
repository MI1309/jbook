import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '../../stores/gameStore';
import { useAuth } from '../../context/AuthContext';
import AppMessage from '../common/AppMessage';
import { ArrowRight, Trophy, RotateCcw, X } from 'lucide-react';

export const CompletionModal = () => {
  const { gameState, resetGame } = useGameStore();
  const { user, claimTtsPoints } = useAuth();
  const submittedSessionRef = useRef(null);
  const [pointsStatus, setPointsStatus] = useState('idle');

  useEffect(() => {
    if (!gameState.isCompleted || !user || !gameState.ttsSessionId) return;
    if (submittedSessionRef.current === gameState.ttsSessionId) return;

    submittedSessionRef.current = gameState.ttsSessionId;
    claimTtsPoints(gameState.ttsSessionId, gameState.score)
      .then(() => setPointsStatus('saved'))
      .catch(() => setPointsStatus('failed'));
  }, [gameState.isCompleted, gameState.ttsSessionId, gameState.score, user, claimTtsPoints]);

  if (!gameState.isCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="bg-gradient-to-br from-red-500 to-orange-600 p-8 text-center text-white relative">
          <button 
            onClick={resetGame}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            aria-label="Tutup hasil TTS"
          >
            <X size={24} />
          </button>
          
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Trophy size={40} className="text-yellow-300" />
          </div>
          <h2 className="text-3xl font-black mb-1">Luar Biasa!</h2>
          <p className="text-red-100">Kamu berhasil menyelesaikan teka-teki kata.</p>
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

          {user && (
            <AppMessage variant={pointsStatus === 'failed' ? 'warning' : 'info'} className="mb-5 text-left">
              {(pointsStatus === 'idle' || pointsStatus === 'saving') && 'Menyimpan poin...'}
              {pointsStatus === 'saved' && `+${gameState.score} poin ditambahkan ke akunmu.`}
              {pointsStatus === 'failed' && (
                <button
                  type="button"
                  onClick={() => {
                    setPointsStatus('saving');
                    claimTtsPoints(gameState.ttsSessionId, gameState.score)
                      .then(() => setPointsStatus('saved'))
                      .catch(() => setPointsStatus('failed'));
                  }}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Gagal menyimpan poin. Ketuk untuk mencoba lagi.
                </button>
              )}
            </AppMessage>
          )}

          {!user && (
            <AppMessage variant="info" className="mb-5 text-left">
              Ingin menyimpan poin?{' '}
              <Link href="/login" className="font-bold text-blue-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                Masuk
              </Link>
              {' atau '}
              <Link href="/register" className="font-bold text-blue-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                daftar
              </Link>
              .
            </AppMessage>
          )}

          <button
            onClick={resetGame}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 font-bold text-white transition-transform hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue active:scale-[0.99] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <RotateCcw aria-hidden="true" size={18} />
            Main Lagi / Ganti Level
          </button>

          {user ? (
            <Link
              href="/dashboard"
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-foreground transition hover:border-accent-blue hover:text-accent-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              Lihat Poin Saya <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-foreground transition hover:border-accent-blue hover:text-accent-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              Masuk untuk Simpan Progres <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};
