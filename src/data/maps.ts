/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../types/game';

export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 1000;

// Zone Boundaries
export const ZONE_BOUNDS = {
  // Red (Player) Zone
  red: {
    minX: 60,
    maxX: 660,
    minY: 60,
    maxY: 940,
  },
  // Middle Combat Zone (No placement allowed!)
  neutral: {
    minX: 660,
    maxX: 1340,
    minY: 60,
    maxY: 940,
  },
  // Blue (CPU AI) Zone
  blue: {
    minX: 1340,
    maxX: 1940,
    minY: 60,
    maxY: 940,
  },
};

export const MAPS: Record<string, MapDefinition> = {
  emerald_plains: {
    id: 'emerald_plains',
    name: 'Emerald Plains',
    nameKo: '푸른 초원 평원',
    description: '탁 트인 넓은 잔디 평원. 기마병의 우회 돌격과 대규모 보병 전열 충돌에 이상적인 전장입니다.',
    bgColor: '#1c3822',
    borderColor: '#2e5b38',
    groundPattern: 'grass',
    obstacles: [
      { x: 1000, y: 220, width: 70, height: 70, type: 'rock', isPassable: false },
      { x: 1000, y: 780, width: 70, height: 70, type: 'rock', isPassable: false },
      { x: 780, y: 500, width: 40, height: 40, type: 'tree', isPassable: false },
      { x: 1220, y: 500, width: 40, height: 40, type: 'tree', isPassable: false },
    ],
    decorations: [
      { x: 300, y: 200, type: 'flower', size: 16 },
      { x: 500, y: 800, type: 'flower', size: 20 },
      { x: 1500, y: 250, type: 'flower', size: 18 },
      { x: 1700, y: 750, type: 'flower', size: 16 },
      { x: 950, y: 480, type: 'ruins', size: 28 },
      { x: 1050, y: 520, type: 'ruins', size: 24 },
    ],
  },
  crimson_canyon: {
    id: 'crimson_canyon',
    name: 'Crimson Canyon',
    nameKo: '붉은 사막 협곡',
    description: '위아래가 가파른 절벽으로 막힌 좁은 사막 협곡. 중앙 병목 구간에서의 진형 유지와 포격이 승패를 가릅니다.',
    bgColor: '#3d2516',
    borderColor: '#613b23',
    groundPattern: 'desert',
    obstacles: [
      // Top canyon wall
      { x: 1000, y: 110, width: 1880, height: 100, type: 'rock', isPassable: false },
      // Bottom canyon wall
      { x: 1000, y: 890, width: 1880, height: 100, type: 'rock', isPassable: false },
      // Central pillars
      { x: 880, y: 380, width: 90, height: 90, type: 'rock', isPassable: false },
      { x: 1120, y: 620, width: 90, height: 90, type: 'rock', isPassable: false },
    ],
    decorations: [
      { x: 450, y: 300, type: 'cactus', size: 22 },
      { x: 1550, y: 700, type: 'cactus', size: 24 },
      { x: 1000, y: 500, type: 'bones', size: 30 },
    ],
  },
  stone_bridge: {
    id: 'stone_bridge',
    name: 'Stone Bridge Clash',
    nameKo: '강줄기 돌다리 공방전',
    description: '중앙의 깊은 강줄기를 가로지르는 3개의 석조 다리. 다리를 건너려는 자와 방패로 막아서는 자의 처절한 격전지입니다.',
    bgColor: '#162b32',
    borderColor: '#244550',
    groundPattern: 'bridge',
    obstacles: [
      // Water body splitting the field vertically at center x=1000
      // Top water barrier (y: 60 to 220)
      { x: 1000, y: 130, width: 140, height: 160, type: 'water', isPassable: false },
      // Bridge 1 (top): y=270, h=120, passable!
      { x: 1000, y: 270, width: 160, height: 120, type: 'bridge', isPassable: true },
      // Mid-high water barrier (y: 330 to 440)
      { x: 1000, y: 395, width: 140, height: 130, type: 'water', isPassable: false },
      // Bridge 2 (center main bridge): y=500, h=160, passable!
      { x: 1000, y: 500, width: 180, height: 160, type: 'bridge', isPassable: true },
      // Mid-low water barrier (y: 580 to 670)
      { x: 1000, y: 645, width: 140, height: 130, type: 'water', isPassable: false },
      // Bridge 3 (bottom): y=750, h=120, passable!
      { x: 1000, y: 750, width: 160, height: 120, type: 'bridge', isPassable: true },
      // Bottom water barrier (y: 810 to 940)
      { x: 1000, y: 875, width: 140, height: 150, type: 'water', isPassable: false },
    ],
    decorations: [
      { x: 920, y: 270, type: 'pillar', size: 14 },
      { x: 1080, y: 270, type: 'pillar', size: 14 },
      { x: 910, y: 500, type: 'pillar', size: 18 },
      { x: 1090, y: 500, type: 'pillar', size: 18 },
      { x: 920, y: 750, type: 'pillar', size: 14 },
      { x: 1080, y: 750, type: 'pillar', size: 14 },
    ],
  },
  frost_tundra: {
    id: 'frost_tundra',
    name: 'Frost Peak Tundra',
    nameKo: '혹한의 설원 요새',
    description: '눈보라가 몰아치는 얼어붙은 전장. 눈 덮인 빙판 바위와 전나무 숲 사이에서 펼쳐지는 백병전입니다.',
    bgColor: '#1a2430',
    borderColor: '#2f435a',
    groundPattern: 'snow',
    obstacles: [
      { x: 750, y: 300, width: 100, height: 100, type: 'rock', isPassable: false },
      { x: 1250, y: 700, width: 100, height: 100, type: 'rock', isPassable: false },
      { x: 1000, y: 500, width: 120, height: 80, type: 'rock', isPassable: false },
      { x: 900, y: 780, width: 50, height: 50, type: 'tree', isPassable: false },
      { x: 1100, y: 220, width: 50, height: 50, type: 'tree', isPassable: false },
    ],
    decorations: [
      { x: 400, y: 200, type: 'ice_patch', size: 60 },
      { x: 1600, y: 800, type: 'ice_patch', size: 60 },
      { x: 1000, y: 350, type: 'snow_drift', size: 40 },
      { x: 1000, y: 650, type: 'snow_drift', size: 40 },
    ],
  },
  volcano_rift: {
    id: 'volcano_rift',
    name: 'Inferno Rift',
    nameKo: '화산의 균열',
    description: '시뻘건 용암이 솟구치는 검은 암석 지대. 불길이 치솟는 균열을 피해 적진을 돌파해야 합니다.',
    bgColor: '#241313',
    borderColor: '#4d2020',
    groundPattern: 'volcano',
    obstacles: [
      // Central impassable fiery craters
      { x: 1000, y: 300, width: 130, height: 130, type: 'lava', isPassable: false },
      { x: 1000, y: 700, width: 130, height: 130, type: 'lava', isPassable: false },
      { x: 820, y: 500, width: 60, height: 60, type: 'rock', isPassable: false },
      { x: 1180, y: 500, width: 60, height: 60, type: 'rock', isPassable: false },
    ],
    decorations: [
      { x: 600, y: 400, type: 'vent', size: 24 },
      { x: 1400, y: 600, type: 'vent', size: 24 },
      { x: 1000, y: 500, type: 'embers', size: 50 },
    ],
  },
};

export const MAP_LIST = Object.values(MAPS);

export function isInsideZone(x: number, y: number, faction: 'red' | 'blue'): boolean {
  const zone = ZONE_BOUNDS[faction];
  return x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY;
}

export function isInsideNeutralZone(x: number, y: number): boolean {
  const zone = ZONE_BOUNDS.neutral;
  return x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY;
}
