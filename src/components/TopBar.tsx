/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Swords,
  RotateCcw,
  Volume2,
  VolumeX,
  Map as MapIcon,
  Play,
  Pause,
  FastForward,
  HelpCircle,
  Home,
  Users,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface TopBarProps {
  mapName: string;
  gameMode: 'campaign' | 'sandbox' | 'pvp';
  currentStageId?: number;
  playerGold: number;
  blueGold?: number;
  maxBudget: number;
  activePlacingFaction?: 'red' | 'blue';
  redUnitCount: number;
  blueUnitCount: number;
  isBattleStarted: boolean;
  timeScale: number;
  isPaused: boolean;
  onStartBattle: () => void;
  onResetBattle: () => void;
  onChangeTimeScale: (speed: number) => void;
  onTogglePause: () => void;
  onOpenMapSelector: () => void;
  onOpenHelp: () => void;
  onReturnToTitle: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mapName,
  gameMode,
  currentStageId,
  playerGold,
  blueGold = 0,
  maxBudget,
  activePlacingFaction = 'red',
  redUnitCount,
  blueUnitCount,
  isBattleStarted,
  timeScale,
  isPaused,
  onStartBattle,
  onResetBattle,
  onChangeTimeScale,
  onTogglePause,
  onOpenMapSelector,
  onOpenHelp,
  onReturnToTitle,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const getModeBadge = () => {
    if (gameMode === 'campaign') {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800/60">
          캠페인 제{currentStageId}장
        </span>
      );
    } else if (gameMode === 'pvp') {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60 flex items-center gap-1">
          <Users className="w-3 h-3 text-purple-400" />
          <span>2인 PVP 대전</span>
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
          자유 전투
        </span>
      );
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 shadow-xl flex items-center justify-between text-sm select-none">
      {/* Left: Home, Mode, and Map Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReturnToTitle}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          title="타이틀 화면으로"
        >
          <Home className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-title font-bold text-base tracking-wider text-zinc-100 hidden sm:inline">
            전쟁 시뮬레이터
          </span>
          {getModeBadge()}
        </div>

        <button
          onClick={onOpenMapSelector}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <MapIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span>{mapName}</span>
        </button>
      </div>

      {/* Center: Gold & Army Count */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Gold Display: Single player vs PVP dual player gold */}
        {gameMode === 'pvp' ? (
          <div className="flex items-center gap-2">
            {/* 1P Red Gold */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
                activePlacingFaction === 'red' && !isBattleStarted
                  ? 'bg-red-950/70 border-red-500 shadow-md ring-1 ring-red-500/50'
                  : 'bg-zinc-950/80 border-zinc-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-red-300 font-bold -mb-0.5">1P 레드</span>
                <span className="font-bold text-amber-300 tabular-nums text-xs">
                  {maxBudget === Infinity ? '무제한' : `${playerGold.toLocaleString()} G`}
                </span>
              </div>
            </div>

            {/* 2P Blue Gold */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
                activePlacingFaction === 'blue' && !isBattleStarted
                  ? 'bg-blue-950/70 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-zinc-950/80 border-zinc-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-blue-300 font-bold -mb-0.5">2P 블루</span>
                <span className="font-bold text-amber-300 tabular-nums text-xs">
                  {maxBudget === Infinity ? '무제한' : `${blueGold.toLocaleString()} G`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950/80 border border-amber-500/30">
            <span className="text-amber-400 text-base">🪙</span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-zinc-400 font-medium -mb-0.5">보유 골드</span>
              <span className="font-bold text-amber-300 tabular-nums text-sm">
                {maxBudget === Infinity ? '무제한' : `${playerGold.toLocaleString()} G`}
              </span>
            </div>
          </div>
        )}

        {/* Faction Troops Clash Bar */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-950/80 border border-zinc-700">
          <div className="flex items-center gap-1 text-red-400 font-bold tabular-nums">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>{redUnitCount}</span>
          </div>
          <span className="text-zinc-600 font-bold text-xs">VS</span>
          <div className="flex items-center gap-1 text-blue-400 font-bold tabular-nums">
            <span>{blueUnitCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
        </div>
      </div>

      {/* Right: Battle Control & Simulation Speed & Audio */}
      <div className="flex items-center gap-2">
        {/* Speed Controls during battle */}
        {isBattleStarted && (
          <div className="flex items-center bg-zinc-950/80 border border-zinc-700 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={onTogglePause}
              className={`p-1.5 rounded transition-colors ${
                isPaused ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title={isPaused ? '재개' : '일시정지'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeTimeScale(spd)}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  timeScale === spd && !isPaused
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        )}

        {/* Start / Reset Battle Button */}
        {!isBattleStarted ? (
          <button
            onClick={onStartBattle}
            disabled={redUnitCount === 0 && blueUnitCount === 0}
            className={`px-4 py-1.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg transition-all cursor-pointer ${
              redUnitCount > 0 && (gameMode !== 'pvp' || blueUnitCount > 0)
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-900/50 scale-100 hover:scale-105 active:scale-95'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>전투 시작! [Space]</span>
          </button>
        ) : (
          <button
            onClick={onResetBattle}
            className="px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>재배치</span>
          </button>
        )}

        {/* Audio Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-200" />}
        </button>

        {/* Help button */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="게임 도움말"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
