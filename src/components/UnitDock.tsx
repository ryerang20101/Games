/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UnitCategory } from '../types/game';
import { UNIT_CATEGORIES, UNIT_CONFIGS } from '../data/units';
import {
  Sword,
  Shield,
  Target,
  Milestone,
  Bomb,
  Flame,
  HeartHandshake,
  Crown,
  ChevronDown,
  ChevronUp,
  Trash2,
  Shuffle,
  Grid,
  Zap,
} from 'lucide-react';

interface UnitDockProps {
  activeUnitType: UnitCategory | null;
  onSelectUnitType: (type: UnitCategory | null) => void;
  playerGold: number;
  isBattleStarted: boolean;
  gameMode: 'campaign' | 'sandbox' | 'pvp';
  activePlacingFaction: 'red' | 'blue';
  onSwitchPlacingFaction: (faction: 'red' | 'blue') => void;
  onClearUnits: () => void;
  onAutoFormation: (type: 'line' | 'wedge' | 'wings') => void;
  onRandomDeploy: () => void;
}

export const UnitDock: React.FC<UnitDockProps> = ({
  activeUnitType,
  onSelectUnitType,
  playerGold,
  isBattleStarted,
  gameMode,
  activePlacingFaction,
  onSwitchPlacingFaction,
  onClearUnits,
  onAutoFormation,
  onRandomDeploy,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFormationMenu, setShowFormationMenu] = useState(false);

  const getUnitIcon = (type: UnitCategory) => {
    switch (type) {
      case 'infantry':
        return <Sword className="w-5 h-5" />;
      case 'cavalry':
        return <span className="text-lg">🐎</span>;
      case 'archer':
        return <Target className="w-5 h-5 text-emerald-400" />;
      case 'javelin':
        return <span className="text-base">🎯</span>;
      case 'spearman':
        return <Milestone className="w-5 h-5 text-cyan-400" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'bomber':
        return <Flame className="w-5 h-5 text-orange-500 animate-pulse" />;
      case 'assassin':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'catapult':
        return <Bomb className="w-5 h-5 text-amber-500" />;
      case 'mage':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'priest':
        return <HeartHandshake className="w-5 h-5 text-emerald-300" />;
      case 'giant':
        return <Crown className="w-5 h-5 text-yellow-400" />;
    }
  };

  if (isBattleStarted) {
    // Hide unit dock during battle to maximize visible playfield
    return null;
  }

  const isRed = activePlacingFaction === 'red';

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 max-w-[min(1160px,96vw)] ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-zinc-900/95 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold px-4 py-1.5 rounded-full border border-zinc-700 shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>병력 배치 도크 열기</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>도크 접기</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-none">
        {/* PVP Faction Switcher Bar */}
        {gameMode === 'pvp' && (
          <div className="flex items-center gap-2 p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl mb-2.5">
            <span className="text-[11px] font-bold text-zinc-400 px-2">진영 선택:</span>
            <button
              onClick={() => onSwitchPlacingFaction('red')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isRed
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 ring-2 ring-red-400'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span>1P 레드 진영 배치 (좌측)</span>
            </button>
            <button
              onClick={() => onSwitchPlacingFaction('blue')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isRed
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/60 ring-2 ring-blue-400'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>2P 블루 진영 배치 (우측)</span>
            </button>
          </div>
        )}

        {/* Top Mini Toolbar: Quick Deployment & Formations */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className={`font-bold flex items-center gap-1.5 ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isRed ? 'bg-red-500' : 'bg-blue-500'}`} />
              {gameMode === 'pvp'
                ? isRed ? '1P 레드 군단 편성' : '2P 블루 군단 편성'
                : '플레이어 유닛 선택'}
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400 hidden sm:inline">
              {isRed
                ? '좌측 빨간 진영에 배치하세요'
                : '우측 파란 진영에 배치하세요'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Formations Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFormationMenu(!showFormationMenu)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer"
                title="진형 자동 배치"
              >
                <Grid className="w-3.5 h-3.5 text-zinc-300" />
                <span>진형 배치</span>
              </button>

              {showFormationMenu && (
                <div className="absolute right-0 bottom-full mb-2 bg-zinc-900 border border-zinc-700 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 w-36 z-50">
                  <button
                    onClick={() => {
                      onAutoFormation('line');
                      setShowFormationMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 rounded text-zinc-200 text-xs transition-colors"
                  >
                    일자진 (Line)
                  </button>
                  <button
                    onClick={() => {
                      onAutoFormation('wedge');
                      setShowFormationMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 rounded text-zinc-200 text-xs transition-colors"
                  >
                    쐐기진 (Wedge / V)
                  </button>
                  <button
                    onClick={() => {
                      onAutoFormation('wings');
                      setShowFormationMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 rounded text-zinc-200 text-xs transition-colors"
                  >
                    학익진 (Wings)
                  </button>
                </div>
              )}
            </div>

            {/* Random Deploy */}
            <button
              onClick={onRandomDeploy}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer"
              title="랜덤 유닛 균형 배치"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>랜덤 배치</span>
            </button>

            {/* Clear All */}
            <button
              onClick={onClearUnits}
              className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer"
              title="현재 진영 유닛 제거 및 전액 환불"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>진영 초기화</span>
            </button>
          </div>
        </div>

        {/* Unit Cards Row (12 Units) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {UNIT_CATEGORIES.map((type, idx) => {
            const config = UNIT_CONFIGS[type];
            const isSelected = activeUnitType === type;
            const canAfford = playerGold >= config.cost;

            return (
              <button
                key={type}
                onClick={() => onSelectUnitType(isSelected ? null : type)}
                disabled={!canAfford && !isSelected}
                className={`relative flex-shrink-0 w-23 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? isRed
                      ? 'bg-red-950/90 border-red-500 ring-2 ring-red-500/50 shadow-lg scale-105'
                      : 'bg-blue-950/90 border-blue-500 ring-2 ring-blue-500/50 shadow-lg scale-105'
                    : canAfford
                    ? 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800'
                    : 'bg-zinc-900/50 border-zinc-800 opacity-45 cursor-not-allowed'
                }`}
              >
                {/* Hotkey Badge */}
                <span className="absolute top-1 left-1.5 text-[10px] text-zinc-500 font-mono font-bold">
                  {idx + 1 <= 9 ? idx + 1 : idx === 9 ? '0' : ''}
                </span>

                {/* Role Badge */}
                <span className="absolute top-1 right-1 text-[8.5px] px-1 py-0.2 rounded bg-zinc-700/80 text-zinc-300">
                  {config.role}
                </span>

                {/* Unit Icon & Title */}
                <div className="flex flex-col items-center mt-3 mb-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? isRed
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-blue-600 text-white shadow-md'
                        : 'bg-zinc-700/80 text-zinc-200'
                    }`}
                  >
                    {getUnitIcon(type)}
                  </div>
                  <span className="text-xs font-bold text-zinc-100 mt-1 truncate max-w-full">
                    {config.nameKo}
                  </span>
                </div>

                {/* Cost */}
                <div className="text-[11px] text-center pt-1 border-t border-zinc-700/60 flex items-center justify-center gap-1 font-semibold">
                  <span className="text-amber-400">🪙 {config.cost}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Unit Description Bar */}
        {activeUnitType && (
          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300 px-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
                [{UNIT_CONFIGS[activeUnitType].nameKo}]
              </span>
              <span className="truncate max-w-lg">{UNIT_CONFIGS[activeUnitType].description}</span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-zinc-400 text-[11px]">
              <span>HP: <b className="text-zinc-200">{UNIT_CONFIGS[activeUnitType].maxHp}</b></span>
              <span>공격력: <b className="text-zinc-200">{UNIT_CONFIGS[activeUnitType].damage}</b></span>
              <span>사거리: <b className="text-zinc-200">{UNIT_CONFIGS[activeUnitType].attackRange}</b></span>
              <span>이속: <b className="text-zinc-200">{UNIT_CONFIGS[activeUnitType].speed}</b></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
