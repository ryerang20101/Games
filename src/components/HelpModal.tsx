/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Shield, Swords, Info, AlertTriangle, MousePointer } from 'lucide-react';
import { UNIT_CONFIGS, UNIT_CATEGORIES } from '../data/units';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-red-500" />
            <h2 className="font-title text-xl font-bold tracking-wide">
              전쟁 시뮬레이터 가이드 & 병과 상성
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 scrollbar-thin">
          {/* Section 1: 진영 및 전투 규칙 */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-400" />
              진영 배치 및 전장 규칙
            </h3>
            <ul className="space-y-1.5 text-zinc-300 leading-relaxed">
              <li>
                • <b className="text-red-400">빨간색 진영 (플레이어 1P)</b>: 화면 좌측 영역입니다. 캠페인/샌드박스에서는 아군 배치 구역이며, PVP 모드에서는 1P 배치를 진행합니다.
              </li>
              <li>
                • <b className="text-blue-400">파란색 진영 (AI CPU / 2P)</b>: 화면 우측 영역입니다. 컴퓨터 적군 또는 PVP 2P 플레이어가 병력을 배치합니다.
              </li>
              <li>
                • <b className="text-amber-400">가운데 전투 구간 (중립 무인지대)</b>: 양군이 진격하여 격돌하는 완충지대로, 어떠한 유닛도 배치할 수 없습니다.
              </li>
              <li>
                • <b className="text-purple-400">2인 PVP 모드</b>: 하단 도크의 진영 전환 탭을 통해 1P 레드와 2P 블루 진영을 번갈아 가며 배치할 수 있습니다.
              </li>
            </ul>
          </div>

          {/* Section 2: 핵심 병과 상성 & 신규 병과 */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-amber-400" />
              핵심 병과 상성 및 신규 병과 특성
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-red-400">투창병 (신규) ➔ 중근거리 화력</span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  창을 투척하여 강력한 물리 피해를 입힙니다. 궁수보다 저렴하며, 적이 접근해도 뒤로 물러서지 않고 단창으로 직접 맞서 싸웁니다.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-orange-400">자폭병 (신규) ➔ 광역 폭발 테러</span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  매우 빠른 기동 속도(195)로 적진으로 질주하여 접촉 시 220의 막대한 범위 폭발 피해를 일으키고 산화합니다.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-purple-400">암살자 (신규) ➔ 은신 & 암습</span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  첫 공격을 가하기 전까지 적군이 존재를 감지하지 못합니다. 빠른 속도로 배후에 침투하여 3.5배의 치명적인 암습 일격을 가합니다.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-red-400">기마병 ➔ 궁수 / 보병</span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  돌격 시 속도가 크게 증가하며 첫 공격 시 2.5배 치명타와 강력한 넉백으로 적 후방을 제압합니다.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-red-400">장창병 ➔ 기마병 (카운터)</span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  돌격해오는 기마병을 맞받아쳐 돌격을 무력화하고 2.5배의 치명 반격 피해를 입힙니다.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-red-400">방패병 ➔ 원거리 투사체</span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  거대한 타워 쉴드로 정면 화살 및 투창을 70% 확률로 튕겨내며 방어합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 전체 병과 도감 */}
          <div>
            <h3 className="font-bold text-sm text-zinc-100 mb-2">전체 병과 도감 (총 12종)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {UNIT_CATEGORIES.map((cat) => {
                const u = UNIT_CONFIGS[cat];
                return (
                  <div key={cat} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-zinc-100">{u.nameKo}</span>
                      <span className="text-amber-400 font-semibold">{u.cost} G</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      HP: {u.maxHp} | 공: {u.damage} | 속도: {u.speed}
                    </div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                      {u.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: 조작법 요약 */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-2">
              <MousePointer className="w-4 h-4 text-blue-400" />
              조작 방법
            </h3>
            <ul className="space-y-1 text-zinc-300">
              <li>• <b>마우스 좌클릭 / 드래그</b>: 하단 도크에서 유닛 선택 후 활성화된 진영(레드/블루)에 배치</li>
              <li>• <b>마우스 우클릭</b>: 배치된 유닛 삭제 (해당 진영 골드 100% 즉시 환불)</li>
              <li>• <b>숫자키 1~9, 0, -, =</b>: 병과 단축키 선택</li>
              <li>• <b>마우스 휠</b>: 전장 줌 인 / 줌 아웃</li>
              <li>• <b>WASD / 방향키 / 우클릭 드래그</b>: 전장 시야 이동</li>
              <li>• <b>스페이스바</b>: 전투 시작 / 일시정지</li>
              <li>• <b>유닛 클릭</b>: 유닛의 실시간 체력, 처치 수, 입힌 피해량 확인</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
