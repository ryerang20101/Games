/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Faction = 'red' | 'blue';

export type GameMode = 'campaign' | 'sandbox' | 'pvp';

export type UnitCategory =
  | 'infantry'
  | 'cavalry'
  | 'archer'
  | 'spearman'
  | 'shield'
  | 'catapult'
  | 'mage'
  | 'priest'
  | 'giant'
  | 'javelin'
  | 'bomber'
  | 'assassin';

export type UnitState =
  | 'idle'
  | 'moving'
  | 'charging'
  | 'attacking'
  | 'shooting'
  | 'casting'
  | 'fleeing'
  | 'dead';

export interface UnitConfig {
  type: UnitCategory;
  name: string;
  nameKo: string;
  cost: number;
  maxHp: number;
  damage: number;
  armor: number; // damage reduction %
  speed: number;
  attackRange: number;
  attackInterval: number; // in seconds
  size: number; // radius in pixels
  description: string;
  role: '근접' | '기동' | '원거리' | '방어' | '공성' | '마법' | '지원' | '암살';
  icon: string;
}

export interface UnitInstance {
  id: string;
  type: UnitCategory;
  faction: Faction;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // rotation in radians
  targetAngle: number;
  hp: number;
  maxHp: number;
  state: UnitState;
  targetId: string | null;
  lastAttackTime: number;
  cooldownTimer: number;
  
  // Specific ability states
  chargeTimer?: number;
  isCharging?: boolean;
  attackAnimProgress?: number; // 0 to 1 for weapon swing
  shieldBlockCooldown?: number;
  lastDamageTakenTime?: number;
  kills: number;
  damageDealt: number;

  // Assassin stealth & Bomber state
  isStealthed?: boolean;
  hasExploded?: boolean;
  
  // Movement flocking
  separationX: number;
  separationY: number;
}

export interface Projectile {
  id: string;
  type: 'arrow' | 'boulder' | 'fireball' | 'heal_beam' | 'javelin';
  faction: Faction;
  sourceId: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  currentZ: number; // height arc
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  damage: number;
  aoeRadius: number;
  speed: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'blood' | 'spark' | 'smoke' | 'fire' | 'dust' | 'heal' | 'wood' | 'shadow';
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  vy: number;
  isCritical?: boolean;
  isHeal?: boolean;
}

export interface GroundDecal {
  x: number;
  y: number;
  angle: number;
  size: number;
  type: 'blood' | 'crater' | 'scorched';
  alpha: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rock' | 'water' | 'wall' | 'tree' | 'lava' | 'bridge';
  isPassable?: boolean;
}

export interface MapDefinition {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  bgColor: string;
  borderColor: string;
  groundPattern: 'grass' | 'desert' | 'bridge' | 'snow' | 'volcano';
  obstacles: Obstacle[];
  decorations?: Array<{ x: number; y: number; type: string; size: number }>;
}

export interface CampaignStage {
  id: number;
  title: string;
  description: string;
  mapId: string;
  playerBudget: number;
  cpuUnits: Array<{ type: UnitCategory; x: number; y: number }>;
  recommendedTip: string;
}

export interface BattleStats {
  winner: Faction | null;
  durationSeconds: number;
  redKills: number;
  blueKills: number;
  redInitialCount: number;
  blueInitialCount: number;
  redSurvivingCount: number;
  blueSurvivingCount: number;
  redTotalDamage: number;
  blueTotalDamage: number;
  mvpUnit: {
    type: UnitCategory;
    faction: Faction;
    kills: number;
    damageDealt: number;
  } | null;
}
