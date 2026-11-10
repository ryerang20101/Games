/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Faction, GameMode, UnitInstance } from '../types/game';
import { UNIT_CONFIGS } from '../data/units';
import { Trophy, Skull, RotateCcw, ArrowRight, ShieldCheck, Swords } from 'lucide-react';

interface GameOverModalProps {
  winner: Faction | null;
  durationSeconds: number;
  redKills: number;
  blueKills: number;
  redSurvivingCount: number;
  blueSurvivingCount: number;
  redTotalDamage: number;
  blueTotalDamage: number;
  mvpUnit: UnitInstance | null;
  hasNextStage: boolean;
  gameMode: GameMode;
  onNextStage: () => void;
  onRetry: () => void;
  onRedeploy: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  durationSeconds,
  redKills,
  blueKills,
  redSurvivingCount,
  blueSurvivingCount,
  redTotalDamage,
  blueTotalDamage,
  mvpUnit,
  hasNextStage,
  gameMode,
  onNextStage,
  onRetry,
  onRedeploy,
}) => {
  const isPvp = gameMode === 'pvp';
  const isRedVictory = winner === 'red';
  const isBlueVictory = winner === 'blue';
  const isDraw = winner === null;

  useEffect(() => {
    if (winner !== null) {
      // Fire confetti celebration for winner
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: isRedVictory ? ['#ef4444', '#facc15', '#f87171'] : ['#3b82f6', '#60a5fa', '#93c5fd'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [winner, isRedVictory]);

  // Dynamic titles and subtitles
  let resultTitle = '';
  let resultSubtitle = '';

  if (isPvp) {
    if (isRedVictory) {
      resultTitle = '1P (레드) 승리!';
      resultSubtitle = '1P 레드 군단이 뛰어난 전술로 2P 블루 군단을 격파하고 승리를 쟁취했습니다!';
    } else if (isBlueVictory) {
      resultTitle = '2P (블루) 승리!';
      resultSubtitle = '2P 블루 군단이 뛰어난 전술로 1P 레드 군단을 격파하고 승리를 쟁취했습니다!';
    } else {
      resultTitle = '무승부 (DRAW)';
      resultSubtitle = '양 진영의 전 병력이 장렬히 맞서 무승부로 끝났습니다.';
    }
  } else {
    if (isRedVictory) {
      resultTitle = '전투 승리! (VICTORY)';
      resultSubtitle = '플레이어(레드) 군단이 적군(블루)을 완전히 섬멸하였습니다!';
    } else if (isBlueVictory) {
      resultTitle = '전투 패배 (DEFEAT)';
      resultSubtitle = '적군(블루 AI)의 전술에 아군 병력이 모두 궤멸되었습니다.';
    } else {
      resultTitle = '무승부 (DRAW)';
      resultSubtitle = '양 진영의 전 병력이 장렬히 전사하였습니다.';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl text-center overflow-hidden">
        {/* Glow Accent Top Banner */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full blur-3xl opacity-35 ${
            isRedVictory ? 'bg-red-500' : isDraw ? 'bg-amber-500' : 'bg-blue-600'
          }`}
        />

        {/* Icon & Title */}
        <div className="relative mb-4">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-xl mb-3 ${
              isRedVictory
                ? 'bg-gradient-to-br from-amber-500 to-red-600 text-white shadow-red-900/40'
                : isBlueVictory
                ? 'bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-blue-900/40'
                : 'bg-zinc-700 text-zinc-300'
            }`}
          >
            {winner !== null ? (
              <Trophy className="w-8 h-8" />
            ) : (
              <Swords className="w-8 h-8" />
            )}
          </div>

          <h2
            className={`font-title text-3xl font-extrabold tracking-wide ${
              isRedVictory ? 'text-red-400' : isBlueVictory ? 'text-blue-400' : 'text-amber-400'
            }`}
          >
            {resultTitle}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            {resultSubtitle}
          </p>
        </div>

        {/* MVP Unit Card */}
        {mvpUnit && (
          <div className="relative mb-4 p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow ${
                  mvpUnit.faction === 'red' ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                MVP
              </div>
              <div>
                <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  ★ 전투 최우수 병과 (MVP)
                </div>
                <div className="font-bold text-sm text-zinc-100">
                  {UNIT_CONFIGS[mvpUnit.type].nameKo} ({isPvp ? (mvpUnit.faction === 'red' ? '1P 레드' : '2P 블루') : (mvpUnit.faction === 'red' ? '아군 레드' : '적군 블루')})
                </div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-zinc-400">
                처치: <b className="text-zinc-100">{mvpUnit.kills} 킬</b>
              </div>
              <div className="text-zinc-400">
                피해량: <b className="text-amber-300">{mvpUnit.damageDealt.toLocaleString()}</b>
              </div>
            </div>
          </div>
        )}

        {/* Battle Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
          <div className="p-3 bg-zinc-950/50 border border-red-900/30 rounded-xl text-left">
            <div className="text-red-400 font-bold mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {isPvp ? '1P 플레이어 (레드)' : '플레이어 (레드)'}
            </div>
            <div className="flex justify-between text-zinc-300 py-0.5">
              <span>생존 병력:</span>
              <b className="text-zinc-100">{redSurvivingCount}기</b>
            </div>
            <div className="flex justify-between text-zinc-300 py-0.5">
              <span>적 처치 수:</span>
              <b className="text-zinc-100">{redKills}기</b>
            </div>
            <div className="flex justify-between text-zinc-300 py-0.5">
              <span>총 누적 피해:</span>
              <b className="text-red-300">{redTotalDamage.toLocaleString()}</b>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/50 border border-blue-900/30 rounded-xl text-left">
            <div className="text-blue-400 font-bold mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {isPvp ? '2P 플레이어 (블루)' : 'AI CPU (블루)'}
            </div>
            <div className="flex justify-between text-zinc-300 py-0.5">
              <span>생존 병력:</span>
              <b className="text-zinc-100">{blueSurvivingCount}기</b>
            </div>
            <div className="flex justify-between text-zinc-300 py-0.5">
              <span>적 처치 수:</span>
              <b className="text-zinc-100">{blueKills}기</b>
            </div>
            <div className="flex justify-between text-zinc-300 py-0.5">
              <span>총 누적 피해:</span>
              <b className="text-blue-300">{blueTotalDamage.toLocaleString()}</b>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500 mb-6">
          전투 소요 시간: <b className="text-zinc-300">{durationSeconds.toFixed(1)}초</b>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          {isRedVictory && hasNextStage && gameMode === 'campaign' ? (
            <button
              onClick={onNextStage}
              className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
            >
              <span>다음 스테이지로 진격!</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : null}

          <button
            onClick={onRedeploy}
            className="px-5 py-2.5 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>진형 재배치</span>
          </button>

          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400" />
            <span>재도전</span>
          </button>
        </div>
      </div>
    </div>
  );
};
