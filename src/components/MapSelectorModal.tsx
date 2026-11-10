/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MAP_LIST, MAPS } from '../data/maps';
import { CAMPAIGN_STAGES } from '../data/campaign';
import { X, Map as MapIcon, Swords, Award, Shield, Check } from 'lucide-react';

import { GameMode } from '../types/game';

interface MapSelectorModalProps {
  currentMapId: string;
  currentStageId: number;
  gameMode: GameMode;
  initialTab?: GameMode;
  onSelectCampaignStage: (stageId: number) => void;
  onSelectSandboxMap: (mapId: string, aiPreset: string, budget: number) => void;
  onSelectPvpMap: (mapId: string, budget: number) => void;
  onClose: () => void;
}

export const MapSelectorModal: React.FC<MapSelectorModalProps> = ({
  currentMapId,
  currentStageId,
  gameMode,
  initialTab,
  onSelectCampaignStage,
  onSelectSandboxMap,
  onSelectPvpMap,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GameMode>(initialTab || gameMode);
  const [sandboxMapId, setSandboxMapId] = useState(currentMapId);
  const [sandboxAiPreset, setSandboxAiPreset] = useState('balanced');
  const [sandboxBudget, setSandboxBudget] = useState(3000);

  // PVP State
  const [pvpMapId, setPvpMapId] = useState(currentMapId);
  const [pvpBudget, setPvpBudget] = useState(2500);

  const handleStartSandbox = () => {
    onSelectSandboxMap(sandboxMapId, sandboxAiPreset, sandboxBudget);
    onClose();
  };

  const handleStartPvp = () => {
    onSelectPvpMap(pvpMapId, pvpBudget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-red-500" />
            <h2 className="font-title text-xl font-bold tracking-wide">전장 및 모드 선택</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: 3 tabs */}
        <div className="flex gap-2 my-4">
          <button
            onClick={() => setActiveTab('campaign')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'campaign'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>캠페인 모드</span>
          </button>
          <button
            onClick={() => setActiveTab('pvp')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pvp'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-950/50'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
            }`}
          >
            <Swords className="w-4 h-4 text-amber-300" />
            <span>2인 PVP 대전</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>자유 샌드박스</span>
          </button>
        </div>

        {/* Tab 1: Campaign Stages */}
        {activeTab === 'campaign' && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {CAMPAIGN_STAGES.map((stg) => {
              const stageMap = MAPS[stg.mapId];
              const isCurrent = currentStageId === stg.id && gameMode === 'campaign';

              return (
                <div
                  key={stg.id}
                  onClick={() => {
                    onSelectCampaignStage(stg.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-red-950/60 border-red-500 ring-1 ring-red-500/50'
                      : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                        STAGE {stg.id}
                      </span>
                      <span className="font-bold text-sm text-zinc-100">{stg.title}</span>
                      <span className="text-xs text-zinc-400">({stageMap?.nameKo})</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-1">
                      {stg.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span>배치 예산: <b className="text-amber-400">{stg.playerBudget} G</b></span>
                      <span>적군 규모: <b className="text-blue-400">{stg.cpuUnits.length}기</b></span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <button className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white transition-colors">
                      {isCurrent ? '진행 중' : '출격'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: PVP Mode */}
        {activeTab === 'pvp' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin text-xs">
            {/* Mode Guide Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-zinc-950/60 to-blue-950/60 border border-purple-800/40">
              <div className="flex items-center gap-2 mb-1">
                <Swords className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-zinc-100 text-sm">2인 핫시트(순서 교대) PVP 대전 규칙</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                1P(좌측 레드)와 2P(우측 블루)가 각각 동일한 골드 예산 내에서 자유롭게 군단을 편성하고, 진형 배치가 끝나면 양군이 자동 교전하여 승자를 가립니다.
              </p>
            </div>

            {/* Map Selection */}
            <div>
              <label className="block text-zinc-400 font-bold mb-2">1. 결전지 맵 선택</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {MAP_LIST.map((m) => {
                  const isSelected = pvpMapId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPvpMapId(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-500'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-zinc-100 mb-0.5">{m.nameKo}</div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget Limit Selection */}
            <div>
              <label className="block text-zinc-400 font-bold mb-2">
                2. 진영별 골드 예산 제한 (1P, 2P 각자 동일하게 부여)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: 1500, label: '1,500 G', desc: '소규모 정예전' },
                  { value: 2500, label: '2,500 G (표준)', desc: '균형 잡힌 표준전' },
                  { value: 4000, label: '4,000 G (대군)', desc: '대규모 전술전' },
                  { value: 6000, label: '6,000 G (총력전)', desc: '최대 규모 대전' },
                  { value: Infinity, label: '무제한 (샌드박스)', desc: '예산 무제한 대결' },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={() => setPvpBudget(b.value)}
                    className={`py-2 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      pvpBudget === b.value
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{b.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                onClick={handleStartPvp}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white shadow-xl shadow-purple-950/50 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Swords className="w-4 h-4 text-amber-300" />
                <span>2인 PVP 대전 전장 입장</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Custom Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin text-xs">
            {/* Map Selection */}
            <div>
              <label className="block text-zinc-400 font-bold mb-2">1. 격전지 맵 선택</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {MAP_LIST.map((m) => {
                  const isSelected = sandboxMapId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSandboxMapId(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/60 border-red-500 ring-1 ring-red-500'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-zinc-100 mb-0.5">{m.nameKo}</div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Preset Selection */}
            <div>
              <label className="block text-zinc-400 font-bold mb-2">2. 적군 AI 군단 편성</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'balanced', label: '균형 군단', desc: '보병, 궁병, 기병 조화' },
                  { id: 'cavalry', label: '기마 돌격대', desc: '강력한 정예 기마병 위주' },
                  { id: 'ranged', label: '원거리 포격대', desc: '궁병과 투석기 집중' },
                  { id: 'shield', label: '철벽 방진대', desc: '방패병과 장창병 방어진' },
                  { id: 'giant', label: '거인 & 마법 군단', desc: '거인과 화염 마법사' },
                  { id: 'random', label: '무작위 혼성군', desc: '완전 무작위 편성' },
                ].map((preset) => {
                  const isSelected = sandboxAiPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSandboxAiPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/70 border-blue-500 text-white'
                          : 'bg-zinc-950/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{preset.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget Selection */}
            <div>
              <label className="block text-zinc-400 font-bold mb-2">3. 플레이어 배치 예산</label>
              <div className="flex gap-2">
                {[
                  { value: 1500, label: '1,500 G' },
                  { value: 3000, label: '3,000 G (표준)' },
                  { value: 5000, label: '5,000 G (대군)' },
                  { value: Infinity, label: '무제한 (샌드박스)' },
                ].map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setSandboxBudget(b.value)}
                    className={`flex-1 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      sandboxBudget === b.value
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                onClick={handleStartSandbox}
                className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>자유 전장으로 이동</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
