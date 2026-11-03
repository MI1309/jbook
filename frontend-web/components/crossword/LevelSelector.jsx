import React, { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '../../stores/gameStore';
import { BookOpen, Keyboard, MousePointerClick, Play, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

export const LevelSelector = () => {
  const { gameState, startGame } = useGameStore();
  const [selectedMode, setSelectedMode] = useState('kanji');
  const [selectedLevel, setSelectedLevel] = useState('5');
  const [isLoading, setIsLoading] = useState(false);

  const modes = [
    { id: 'kanji', name: 'Full Kanji', desc: 'Kata kanji dari level terpilih. Latih membaca & mengenali kanji.' },
    { id: 'hiragana', name: 'Hiragana Only', desc: 'Kata hiragana murni. Cocok untuk pemula yang baru belajar kana.' }
  ];
  const levels = [
    { value: '5', label: 'N5' },
    { value: '4', label: 'N4' },
    { value: '3', label: 'N3' },
    { value: null, label: 'Semua' }
  ];

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startGame(selectedLevel, selectedMode);
    } finally {
      setIsLoading(false);
    }
  };

  if (gameState.grid) return null;

  return (
    <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-left shadow-xl sm:p-7">
      <div className="mb-6 text-center sm:text-left">
        <p className="text-xs font-bold uppercase text-accent-green">漢字 · 語彙</p>
        <h2 className="mt-1 text-2xl font-japanese font-black text-[var(--foreground)] sm:text-3xl">Siapkan teka-teki</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Pilih level dan cara bermain sebelum mulai.</p>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
        <div>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-foreground">Level JLPT</legend>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Pilih level JLPT">
              {levels.map(level => (
                <button
                  key={level.label}
                  type="button"
                  aria-pressed={selectedLevel === level.value}
                  onClick={() => setSelectedLevel(level.value)}
                  className={clsx(
                    'min-h-10 rounded-lg border px-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue',
                    selectedLevel === level.value
                      ? 'border-accent-blue bg-accent-blue text-white'
                      : 'border-[var(--border-color)] text-foreground hover:border-accent-blue'
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-bold text-foreground">Mode permainan</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {modes.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={selectedMode === mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={clsx(
                    'flex min-h-24 flex-col rounded-xl border-2 p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green',
                    selectedMode === mode.id
                      ? 'border-accent-green bg-accent-green/10 shadow-sm'
                      : 'border-[var(--border-color)] hover:border-accent-green/50'
                  )}
                >
                  <span className={clsx('text-sm font-bold', selectedMode === mode.id ? 'text-accent-green' : 'text-foreground')}>
                    {mode.name}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{mode.desc}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-green py-3 text-base font-bold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? (
              <span className="animate-pulse text-sm">Menyiapkan permainan...</span>
            ) : (
              <>
                <Play aria-hidden="true" fill="currentColor" size={18} />
                Mulai Teka-Teki
              </>
            )}
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto] lg:grid-cols-1 xl:grid-cols-[1fr_auto]">
          <section aria-labelledby="how-to-play-title">
            <h3 id="how-to-play-title" className="mb-3 text-sm font-bold text-foreground">Cara Main</h3>
            <ol className="space-y-3">
              {[
                { icon: BookOpen, text: 'Pilih level dan mode permainan.' },
                { icon: MousePointerClick, text: 'Pilih kotak awal kata di grid.' },
                { icon: Keyboard, text: 'Ketik jawaban, lalu tekan Enter untuk pindah kata.' },
                { icon: Trophy, text: 'Selesaikan semua kata untuk mengumpulkan poin.' }
              ].map(({ icon: Icon, text }, index) => (
                <li key={text} className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  <span><span className="mr-1 font-bold text-foreground">{index + 1}.</span>{text}</span>
                </li>
              ))}
            </ol>
          </section>

          <div aria-hidden="true" className="hidden items-center justify-center rounded-xl border border-[var(--border-color)] bg-background/70 p-3 sm:flex">
            <div className="grid grid-cols-4 gap-1">
              {['', '日', '', '', '', '本', '語', '', '', '', '', '', '', '', '', ''].map((character, index) => (
                <span
                  key={index}
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold',
                    character
                      ? 'border-accent-green/40 bg-accent-green/10 text-accent-green'
                      : 'border-[var(--border-color)] bg-[var(--card-bg)] text-transparent'
                  )}
                >
                  {character || '·'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
