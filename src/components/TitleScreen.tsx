/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Swords, Award, Sparkles, Volume2, Shield } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface TitleScreenProps {
  onStartCampaign: () => void;
  onStartSandbox: () => void;
  onStartPvp: () => void;
  onOpenHelp: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartCampaign,
  onStartSandbox,
  onStartPvp,
  onOpenHelp,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sound.playBattleStart();
        onStartCampaign();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartCampaign]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 flex flex-col items-center justify-between p-8 select-none">
      {/* Background Graphic Grid with Atmospheric Warm/Cool Fog */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="relative z-10 flex items-center gap-2 pt-6">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
          2D 전술 전쟁 시뮬레이터 (BATTLE SIMULATOR 2D)
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl my-auto">
        {/* Inline SVG Crest */}
        <div className="w-24 h-24 mb-4 text-red-500 relative">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <polygon points="50,5 92,25 92,60 50,95 8,60 8,25" stroke="#ef4444" strokeWidth="3" fill="#18181b" />
            <polygon points="50,15 82,30 82,55 50,83 18,55 18,30" stroke="#facc15" strokeWidth="1.5" />
            {/* Crossed Swords */}
            <path d="M30 30 L70 70 M70 30 L30 70" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="50" r="10" fill="#facc15" />
            <circle cx="50" cy="50" r="5" fill="#991b1b" />
          </svg>
        </div>

        <h1 className="font-title text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-200 to-blue-500 tracking-wider drop-shadow-md">
          전쟁 시뮬레이터
        </h1>
        <p className="font-title text-lg sm:text-xl font-bold text-zinc-300 mt-2 tracking-widest">
          WAR SIMULATOR 2D
        </p>

        <p className="text-sm text-zinc-400 max-w-lg mt-4 leading-relaxed">
          다양한 지형의 양쪽 진영(플레이어 레드 vs AI 블루 / 2인 PVP)에서 보병, 기마병, 투창병, 자폭병, 암살자 등을 전략적으로 배치하여 맞붙는 대규모 전술 시뮬레이션
        </p>

        {/* Primary CTAs: 3 modes */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-xl">
          <button
            onClick={() => {
              sound.playBattleStart();
              onStartCampaign();
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-xl shadow-red-950/60 flex items-center justify-center gap-2 text-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>캠페인 모드 [Enter]</span>
          </button>

          <button
            onClick={() => {
              sound.playPlacement();
              onStartPvp();
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2 text-sm transition-all hover:scale-102 active:scale-98 cursor-pointer border border-purple-500/40"
          >
            <Swords className="w-4 h-4 text-amber-300" />
            <span>2인 PVP 대전 (신규)</span>
          </button>

          <button
            onClick={() => {
              sound.playPlacement();
              onStartSandbox();
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 shadow-xl flex items-center justify-center gap-2 text-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-zinc-400" />
            <span>자유 샌드박스</span>
          </button>
        </div>

        {/* How to play / Guide button */}
        <button
          onClick={onOpenHelp}
          className="mt-4 text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition-colors cursor-pointer"
        >
          게임 방법 및 병과 상성 가이드
        </button>
      </div>

      {/* Control Hint Line at Bottom */}
      <div className="relative z-10 text-center pb-4">
        <p className="text-xs text-zinc-500 font-mono tracking-wider">
          좌클릭 유닛 배치 · 우클릭 삭제 · 휠 줌/팬 · 스페이스바 전투 개시
        </p>
      </div>
    </div>
  );
};
