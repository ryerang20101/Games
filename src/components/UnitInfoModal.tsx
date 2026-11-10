/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UnitInstance } from '../types/game';
import { UNIT_CONFIGS } from '../data/units';
import { X, ShieldAlert, Award, Skull, Activity } from 'lucide-react';

interface UnitInfoModalProps {
  unit: UnitInstance | null;
  onClose: () => void;
}

export const UnitInfoModal: React.FC<UnitInfoModalProps> = ({ unit, onClose }) => {
  if (!unit) return null;

  const config = UNIT_CONFIGS[unit.type];
  const isRed = unit.faction === 'red';
  const hpRatio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));

  const getStateText = (state: string) => {
    switch (state) {
      case 'idle':
        return '대기 중';
      case 'moving':
        return '이동 중';
      case 'charging':
        return '⚡ 전력 돌격 중!';
      case 'attacking':
        return '⚔️ 근접 교전 중';
      case 'shooting':
        return '🏹 사격 중';
      case 'casting':
        return '✨ 주문 시전 중';
      case 'dead':
        return '전사함';
      default:
        return state;
    }
  };

  return (
    <div className="fixed top-18 right-6 z-30 w-72 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-none text-xs text-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${isRed ? 'bg-red-500' : 'bg-blue-500'}`}
          />
          <span className="font-bold text-sm text-zinc-100">{config.nameKo}</span>
          <span className="text-[10px] text-zinc-400">({config.name})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Faction and Role Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
            isRed
              ? 'bg-red-950/60 text-red-300 border-red-800/60'
              : 'bg-blue-950/60 text-blue-300 border-blue-800/60'
          }`}
        >
          {isRed ? '🔴 플레이어 군단' : '🔵 AI (CPU) 군단'}
        </span>
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
          {config.role}
        </span>
      </div>

      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] font-semibold mb-1">
          <span className="text-zinc-400">생명력 (HP)</span>
          <span className="tabular-nums font-bold text-zinc-200">
            {Math.max(0, Math.round(unit.hp))} / {unit.maxHp}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
          <div
            className={`h-full transition-all duration-200 ${
              isRed ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${hpRatio * 100}%` }}
          />
        </div>
      </div>

      {/* Live Combat Performance */}
      <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Skull className="w-4 h-4 text-red-400" />
          <div>
            <div className="text-[10px] text-zinc-400">처치 수 (Kills)</div>
            <div className="font-bold text-sm text-zinc-100 tabular-nums">{unit.kills} 킬</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-zinc-400">입힌 피해</div>
            <div className="font-bold text-sm text-zinc-100 tabular-nums">
              {unit.damageDealt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* State & Spec */}
      <div className="space-y-1.5 text-[11px] text-zinc-300 border-t border-zinc-800/80 pt-2">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-zinc-500" /> 현재 상태
          </span>
          <span className="font-bold text-zinc-200">{getStateText(unit.state)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">공격력</span>
          <span className="font-semibold text-zinc-200">{config.damage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">방어율 (피해 감소)</span>
          <span className="font-semibold text-zinc-200">{Math.round(config.armor * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">사거리 / 속도</span>
          <span className="font-semibold text-zinc-200">
            {config.attackRange} px / {config.speed}
          </span>
        </div>
      </div>
    </div>
  );
};
