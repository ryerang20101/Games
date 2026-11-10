/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DamageNumber,
  Faction,
  GroundDecal,
  MapDefinition,
  Particle,
  Projectile,
  UnitInstance,
} from '../types/game';
import { UNIT_CONFIGS } from '../data/units';
import { sound } from '../audio/soundEngine';

export class BattleSimulation {
  public units: UnitInstance[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  public groundDecals: GroundDecal[] = [];
  public map: MapDefinition;
  public isRunning: boolean = false;
  public timeScale: number = 1;
  public totalElapsedTime: number = 0;
  public screenShake: number = 0;

  // Track initial counts and stats
  public initialRedCount: number = 0;
  public initialBlueCount: number = 0;
  public totalRedDamage: number = 0;
  public totalBlueDamage: number = 0;
  public redKills: number = 0;
  public blueKills: number = 0;
  public isOver: boolean = false;
  public winner: Faction | null = null;

  constructor(map: MapDefinition) {
    this.map = map;
  }

  public setMap(map: MapDefinition) {
    this.map = map;
    this.groundDecals = [];
    this.projectiles = [];
    this.particles = [];
    this.damageNumbers = [];
  }

  public resetStats() {
    this.totalElapsedTime = 0;
    this.totalRedDamage = 0;
    this.totalBlueDamage = 0;
    this.redKills = 0;
    this.blueKills = 0;
    this.isOver = false;
    this.winner = null;
    this.screenShake = 0;
    this.projectiles = [];
    this.particles = [];
    this.damageNumbers = [];
    this.groundDecals = [];
  }

  public startBattle() {
    this.isRunning = true;
    this.resetStats();
    this.initialRedCount = this.units.filter((u) => u.faction === 'red').length;
    this.initialBlueCount = this.units.filter((u) => u.faction === 'blue').length;

    // Initialize unit-specific initial states
    for (const unit of this.units) {
      if (unit.type === 'assassin') {
        unit.isStealthed = true;
      }
      if (unit.type === 'bomber') {
        unit.hasExploded = false;
      }
    }

    sound.playBattleStart();
  }

  public pauseBattle() {
    this.isRunning = false;
  }

  public resumeBattle() {
    this.isRunning = true;
  }

  public update(dt: number) {
    if (!this.isRunning) return;

    // Apply timeScale and clamp delta time
    const scaledDt = Math.min(dt * this.timeScale, 0.1);
    this.totalElapsedTime += scaledDt;

    // Decay screenshake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - scaledDt * 30);
    }

    // 1. Update Unit States & Actions
    this.updateUnits(scaledDt);

    // 2. Update Projectiles
    this.updateProjectiles(scaledDt);

    // 3. Update Particles
    this.updateParticles(scaledDt);

    // 4. Update Damage Numbers
    this.updateDamageNumbers(scaledDt);

    // 5. Check Battle Outcome
    this.checkOutcome();
  }

  private updateUnits(dt: number) {
    const aliveUnits = this.units.filter((u) => u.state !== 'dead');

    for (let i = 0; i < aliveUnits.length; i++) {
      const unit = aliveUnits[i];
      const config = UNIT_CONFIGS[unit.type];

      // Decrease cooldown timer
      if (unit.cooldownTimer > 0) {
        unit.cooldownTimer -= dt;
      }
      if (unit.attackAnimProgress !== undefined && unit.attackAnimProgress > 0) {
        unit.attackAnimProgress = Math.max(0, unit.attackAnimProgress - dt * 3.5);
      }

      // Find or maintain target
      let target: UnitInstance | null = null;
      if (unit.targetId) {
        target = aliveUnits.find((u) => u.id === unit.targetId) || null;
      }

      // If Priest (Healer), prioritize wounded allies
      if (unit.type === 'priest') {
        if (!target || target.hp >= target.maxHp || target.faction !== unit.faction) {
          let lowestHpRatio = 0.95;
          let bestAlly: UnitInstance | null = null;
          for (const ally of aliveUnits) {
            if (ally.faction === unit.faction && ally.id !== unit.id && ally.state !== 'dead') {
              const ratio = ally.hp / ally.maxHp;
              if (ratio < lowestHpRatio) {
                lowestHpRatio = ratio;
                bestAlly = ally;
              }
            }
          }
          target = bestAlly;
          unit.targetId = target ? target.id : null;
        }
      } else {
        // Combat units seek the NEAREST visible enemy (ignoring stealthed assassins)
        const isTargetInvalid = !target || target.state === 'dead' || target.faction === unit.faction || target.isStealthed;

        let nearestDistSq = Infinity;
        let closestEnemy: UnitInstance | null = null;

        for (const enemy of aliveUnits) {
          if (enemy.faction !== unit.faction && enemy.state !== 'dead') {
            // Cannot spot or target a stealthed assassin until revealed
            if (enemy.isStealthed) continue;

            const dx = enemy.x - unit.x;
            const dy = enemy.y - unit.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < nearestDistSq) {
              nearestDistSq = distSq;
              closestEnemy = enemy;
            }
          }
        }

        // Always target the nearest enemy, or switch if a much closer enemy appears
        if (isTargetInvalid || !target) {
          target = closestEnemy;
          unit.targetId = target ? target.id : null;
        } else if (closestEnemy && closestEnemy.id !== target.id) {
          const currentTargetDistSq = (target.x - unit.x) ** 2 + (target.y - unit.y) ** 2;
          // Switch to closest enemy if significantly closer (prevents rigid tunnel vision)
          if (nearestDistSq < currentTargetDistSq * 0.55) {
            target = closestEnemy;
            unit.targetId = target.id;
          }
        }
      }

      // Bomber Detonation check: when reaching detonation range of target or any nearby enemy
      if (unit.type === 'bomber' && !unit.hasExploded) {
        if (target) {
          const d = Math.hypot(target.x - unit.x, target.y - unit.y);
          if (d <= config.attackRange + 10) {
            this.executeBomberDetonation(unit);
            continue;
          }
        }
      }

      // Movement and tactical behavior
      if (target) {
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        unit.targetAngle = Math.atan2(dy, dx);
        // Smooth rotation
        unit.angle += (unit.targetAngle - unit.angle) * Math.min(dt * 8, 1);

        // Flocking separation from other friendly/enemy units to avoid single-point stacking
        let sepX = 0;
        let sepY = 0;
        for (let j = 0; j < aliveUnits.length; j++) {
          if (i === j) continue;
          const other = aliveUnits[j];
          const ox = unit.x - other.x;
          const oy = unit.y - other.y;
          const odist = Math.hypot(ox, oy);
          const minSeparation = config.size + UNIT_CONFIGS[other.type].size + 4;
          if (odist > 0 && odist < minSeparation) {
            const push = (minSeparation - odist) / minSeparation;
            sepX += (ox / odist) * push * 65;
            sepY += (oy / odist) * push * 65;
          }
        }

        // Avoid impassable terrain obstacles (e.g. rocks, water)
        for (const obs of this.map.obstacles) {
          if (!obs.isPassable) {
            const nearestX = Math.max(obs.x - obs.width / 2, Math.min(unit.x, obs.x + obs.width / 2));
            const nearestY = Math.max(obs.y - obs.height / 2, Math.min(unit.y, obs.y + obs.height / 2));
            const obsDx = unit.x - nearestX;
            const obsDy = unit.y - nearestY;
            const obsDist = Math.hypot(obsDx, obsDy);
            const clearDist = config.size + 12;
            if (obsDist < clearDist) {
              const pushMag = (clearDist - obsDist) / clearDist;
              const pushAngle = Math.atan2(obsDy, obsDx);
              sepX += Math.cos(pushAngle) * pushMag * 140;
              sepY += Math.sin(pushAngle) * pushMag * 140;
            }
          }
        }

        const isMelee = config.role === '근접' || config.role === '기동' || config.role === '방어' || config.role === '암살';
        const inAttackRange = dist <= config.attackRange;

        // Specific Unit Behaviors
        if (unit.type === 'cavalry') {
          // Cavalry Charge Logic
          if (dist > 180) {
            unit.isCharging = true;
          }
        }

        if (unit.type === 'archer') {
          // Archer Kiting: If enemy gets dangerously close (< 85px), backpedal!
          if (dist < 85 && target.faction !== unit.faction) {
            unit.vx = -dirX * config.speed * 0.75 + sepX;
            unit.vy = -dirY * config.speed * 0.75 + sepY;
            unit.state = 'moving';
          } else if (dist <= config.attackRange) {
            // In range: stop and fire
            unit.vx = sepX * 0.2;
            unit.vy = sepY * 0.2;
            unit.state = 'shooting';
          } else {
            // Move into range
            unit.vx = dirX * config.speed + sepX;
            unit.vy = dirY * config.speed + sepY;
            unit.state = 'moving';
          }
        } else if (unit.type === 'javelin') {
          // Javelin Thrower: Range 270px, DOES NOT kite backwards (fights with spear up close)
          if (dist <= 35) {
            unit.vx = sepX * 0.3;
            unit.vy = sepY * 0.3;
            unit.state = 'attacking';
          } else if (dist <= config.attackRange) {
            unit.vx = sepX * 0.2;
            unit.vy = sepY * 0.2;
            unit.state = 'shooting';
          } else {
            unit.vx = dirX * config.speed + sepX;
            unit.vy = dirY * config.speed + sepY;
            unit.state = 'moving';
          }
        } else if (unit.type === 'catapult') {
          // Catapult: stationary firing
          if (dist <= config.attackRange && dist >= 160) {
            unit.vx = 0;
            unit.vy = 0;
            unit.state = 'shooting';
          } else {
            unit.vx = dirX * config.speed + sepX * 0.3;
            unit.vy = dirY * config.speed + sepY * 0.3;
            unit.state = 'moving';
          }
        } else if (unit.type === 'mage' || unit.type === 'priest') {
          if (dist <= config.attackRange) {
            unit.vx = sepX * 0.2;
            unit.vy = sepY * 0.2;
            unit.state = 'casting';
          } else {
            unit.vx = dirX * config.speed + sepX;
            unit.vy = dirY * config.speed + sepY;
            unit.state = 'moving';
          }
        } else {
          // Melee units (Infantry, Cavalry, Spearman, Shieldbearer, Giant, Assassin, Bomber)
          if (inAttackRange) {
            unit.vx = sepX * 0.3;
            unit.vy = sepY * 0.3;
            unit.state = 'attacking';
          } else {
            const currentSpeed = unit.isCharging ? config.speed * 1.6 : config.speed;
            unit.vx = dirX * currentSpeed + sepX;
            unit.vy = dirY * currentSpeed + sepY;
            unit.state = unit.isCharging ? 'charging' : 'moving';
          }
        }

        // Apply movement position
        unit.x += unit.vx * dt;
        unit.y += unit.vy * dt;

        // Keep inside map bounds
        unit.x = Math.max(config.size + 10, Math.min(1990 - config.size, unit.x));
        unit.y = Math.max(config.size + 10, Math.min(990 - config.size, unit.y));

        // Attack Execution when Cooldown is 0
        if (unit.cooldownTimer <= 0) {
          if (unit.type === 'priest' && target && target.faction === unit.faction) {
            // Heal target ally
            if (dist <= config.attackRange) {
              const healAmt = 45;
              target.hp = Math.min(target.maxHp, target.hp + healAmt);
              unit.cooldownTimer = config.attackInterval;
              unit.attackAnimProgress = 1;
              sound.playHeal();
              this.spawnParticle(target.x, target.y, 'heal', 8);
              this.spawnDamageNumber(target.x, target.y - 20, `+${healAmt}`, '#34d399', false, true);
            }
          } else if (target && target.faction !== unit.faction) {
            if (unit.type === 'archer' && inAttackRange) {
              this.fireArrow(unit, target);
              unit.cooldownTimer = config.attackInterval;
              unit.attackAnimProgress = 1;
            } else if (unit.type === 'javelin') {
              if (dist <= 35) {
                this.executeMeleeAttack(unit, target);
              } else if (dist <= config.attackRange) {
                this.fireJavelin(unit, target);
              }
              unit.cooldownTimer = config.attackInterval;
              unit.attackAnimProgress = 1;
            } else if (unit.type === 'catapult' && inAttackRange && dist >= 160) {
              this.fireCatapultBoulder(unit, target);
              unit.cooldownTimer = config.attackInterval;
              unit.attackAnimProgress = 1;
            } else if (unit.type === 'mage' && inAttackRange) {
              this.fireMageFireball(unit, target);
              unit.cooldownTimer = config.attackInterval;
              unit.attackAnimProgress = 1;
            } else if (unit.type === 'bomber' && inAttackRange) {
              this.executeBomberDetonation(unit);
            } else if (isMelee && inAttackRange) {
              this.executeMeleeAttack(unit, target);
              unit.cooldownTimer = config.attackInterval;
              unit.attackAnimProgress = 1;
            }
          }
        }
      } else {
        // No target: stand idle or advance towards opponent's side
        unit.state = 'idle';
        const forwardDir = unit.faction === 'red' ? 1 : -1;
        unit.x += forwardDir * config.speed * 0.4 * dt;
        unit.angle = unit.faction === 'red' ? 0 : Math.PI;
      }
    }
  }

  // Melee Attack Resolution
  private executeMeleeAttack(attacker: UnitInstance, target: UnitInstance) {
    const attackerConfig = UNIT_CONFIGS[attacker.type];
    const targetConfig = UNIT_CONFIGS[target.type];

    let damage = attackerConfig.damage;
    let isCrit = false;

    // Assassin Stealth Backstab Bonus
    if (attacker.type === 'assassin') {
      if (attacker.isStealthed) {
        attacker.isStealthed = false;
        damage = Math.round(damage * 3.5); // massive burst critical
        isCrit = true;
        sound.playAssassinStrike();
        this.spawnParticle(attacker.x, attacker.y, 'shadow', 14);
        this.spawnDamageNumber(target.x, target.y - 25, `기습 암살! -${damage}`, '#c084fc', true);
      } else {
        sound.playMeleeHit(false);
      }
    }
    // Cavalry Charge Bonus
    else if (attacker.type === 'cavalry' && attacker.isCharging) {
      attacker.isCharging = false;
      // Check if target is a Spearman!
      if (target.type === 'spearman') {
        // Counter-spear: Spearman inflicts huge counter damage on cavalry!
        const counterDmg = Math.round(targetConfig.damage * 2.2);
        attacker.hp -= counterDmg;
        sound.playMeleeHit(true);
        this.spawnDamageNumber(attacker.x, attacker.y - 20, `기병 저지! -${counterDmg}`, '#f87171', true);
        this.spawnParticle(attacker.x, attacker.y, 'spark', 10);
      } else {
        // Charge impact
        damage = Math.round(damage * 2.5);
        isCrit = true;
        sound.playCavalryCharge();
        // Knockback target
        const kbDir = Math.atan2(target.y - attacker.y, target.x - attacker.x);
        target.x += Math.cos(kbDir) * 65;
        target.y += Math.sin(kbDir) * 65;
        this.screenShake = Math.max(this.screenShake, 4);
      }
    } else {
      sound.playMeleeHit(attacker.type === 'giant');
    }

    // Shieldbearer block chance
    if (target.type === 'shield' && Math.random() < 0.35) {
      damage = Math.round(damage * 0.4);
      this.spawnDamageNumber(target.x, target.y - 18, '방패 방어!', '#60a5fa', false);
      this.spawnParticle(target.x, target.y, 'spark', 6);
    } else {
      // General armor damage reduction
      damage = Math.max(5, Math.round(damage * (1 - targetConfig.armor)));
    }

    // Apply damage
    target.hp -= damage;
    attacker.damageDealt += damage;
    if (attacker.faction === 'red') this.totalRedDamage += damage;
    else this.totalBlueDamage += damage;

    this.spawnDamageNumber(target.x, target.y - 15, `-${damage}`, isCrit ? '#facc15' : '#ffffff', isCrit);
    this.spawnParticle(target.x, target.y, 'blood', isCrit ? 10 : 5);

    // Giant cleave attack: also hits nearby enemies in 45px radius
    if (attacker.type === 'giant') {
      this.screenShake = Math.max(this.screenShake, 5);
      const cleaveRadius = 55;
      for (const foe of this.units) {
        if (foe.faction !== attacker.faction && foe.id !== target.id && foe.state !== 'dead') {
          const dist = Math.hypot(foe.x - attacker.x, foe.y - attacker.y);
          if (dist < cleaveRadius) {
            const cleaveDmg = Math.round(damage * 0.65);
            foe.hp -= cleaveDmg;
            attacker.damageDealt += cleaveDmg;
            this.spawnDamageNumber(foe.x, foe.y - 15, `-${cleaveDmg}`, '#facc15');
            this.spawnParticle(foe.x, foe.y, 'blood', 4);
            if (foe.hp <= 0) {
              foe.state = 'dead';
              attacker.kills++;
              this.onUnitKilled(foe, attacker);
            }
          }
        }
      }
    }

    if (target.hp <= 0) {
      target.state = 'dead';
      attacker.kills++;
      this.onUnitKilled(target, attacker);
    }
  }

  // Unit Death Handler
  private onUnitKilled(victim: UnitInstance, killer: UnitInstance) {
    if (victim.faction === 'red') {
      this.blueKills++;
    } else {
      this.redKills++;
    }

    this.spawnParticle(victim.x, victim.y, 'blood', 16);
    // Add blood decal on ground
    if (this.groundDecals.length < 80) {
      this.groundDecals.push({
        x: victim.x,
        y: victim.y,
        angle: Math.random() * Math.PI * 2,
        size: 16 + Math.random() * 12,
        type: 'blood',
        alpha: 0.85,
      });
    }
  }

  // Bomber Detonation Execution
  private executeBomberDetonation(unit: UnitInstance) {
    if (unit.hasExploded) return;
    unit.hasExploded = true;
    unit.state = 'dead';
    unit.hp = 0;

    sound.playExplosion();
    this.screenShake = Math.max(this.screenShake, 14);

    const aoeRadius = 85;
    const damage = UNIT_CONFIGS.bomber.damage;

    // Detonation VFX
    this.spawnParticle(unit.x, unit.y, 'fire', 28);
    this.spawnParticle(unit.x, unit.y, 'smoke', 20);
    this.spawnParticle(unit.x, unit.y, 'dust', 16);

    if (this.groundDecals.length < 80) {
      this.groundDecals.push({
        x: unit.x,
        y: unit.y,
        angle: Math.random() * Math.PI * 2,
        size: 38,
        type: 'crater',
        alpha: 0.95,
      });
    }

    // AoE blast damage to all enemies in radius
    for (const foe of this.units) {
      if (foe.faction !== unit.faction && foe.state !== 'dead') {
        const d = Math.hypot(foe.x - unit.x, foe.y - unit.y);
        if (d <= aoeRadius) {
          const falloff = 1 - (d / aoeRadius) * 0.45;
          const actualDmg = Math.round(damage * falloff);

          foe.hp -= actualDmg;
          unit.damageDealt += actualDmg;
          if (unit.faction === 'red') this.totalRedDamage += actualDmg;
          else this.totalBlueDamage += actualDmg;

          // Strong knockback away from detonation epicenter
          const angle = Math.atan2(foe.y - unit.y, foe.x - unit.x);
          const kb = (1 - d / aoeRadius) * 60;
          foe.x += Math.cos(angle) * kb;
          foe.y += Math.sin(angle) * kb;

          this.spawnDamageNumber(foe.x, foe.y - 15, `자폭! -${actualDmg}`, '#f97316', true);
          this.spawnParticle(foe.x, foe.y, 'blood', 6);

          if (foe.hp <= 0) {
            foe.state = 'dead';
            unit.kills++;
            this.onUnitKilled(foe, unit);
          }
        }
      }
    }
  }

  // Ranged: Fire Javelin
  private fireJavelin(unit: UnitInstance, target: UnitInstance) {
    const config = UNIT_CONFIGS[unit.type];
    sound.playJavelinThrow();

    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 460;
    const travelTime = dist / speed;

    this.projectiles.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'javelin',
      faction: unit.faction,
      sourceId: unit.id,
      startX: unit.x,
      startY: unit.y,
      currentX: unit.x,
      currentY: unit.y,
      targetX: target.x + (Math.random() - 0.5) * 12,
      targetY: target.y + (Math.random() - 0.5) * 12,
      currentZ: 0,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      vz: 110,
      gravity: 260,
      damage: config.damage,
      aoeRadius: 0,
      speed,
      life: 0,
      maxLife: travelTime,
      color: unit.faction === 'red' ? '#ef4444' : '#3b82f6',
    });
  }

  // Ranged: Fire Arrow
  private fireArrow(unit: UnitInstance, target: UnitInstance) {
    const config = UNIT_CONFIGS[unit.type];
    sound.playBowShot();

    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 480;
    const travelTime = dist / speed;

    this.projectiles.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'arrow',
      faction: unit.faction,
      sourceId: unit.id,
      startX: unit.x,
      startY: unit.y,
      currentX: unit.x,
      currentY: unit.y,
      targetX: target.x + (Math.random() - 0.5) * 16, // slight dispersion
      targetY: target.y + (Math.random() - 0.5) * 16,
      currentZ: 0,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      vz: 160, // upward arc
      gravity: 320,
      damage: config.damage,
      aoeRadius: 0,
      speed,
      life: 0,
      maxLife: travelTime,
      color: unit.faction === 'red' ? '#ef4444' : '#3b82f6',
    });
  }

  // Ranged: Fire Catapult Boulder
  private fireCatapultBoulder(unit: UnitInstance, target: UnitInstance) {
    const config = UNIT_CONFIGS[unit.type];
    sound.playBowShot(); // launch twang

    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 260;
    const travelTime = dist / speed;

    this.projectiles.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'boulder',
      faction: unit.faction,
      sourceId: unit.id,
      startX: unit.x,
      startY: unit.y,
      currentX: unit.x,
      currentY: unit.y,
      targetX: target.x + (Math.random() - 0.5) * 30,
      targetY: target.y + (Math.random() - 0.5) * 30,
      currentZ: 0,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      vz: 260,
      gravity: 360,
      damage: config.damage,
      aoeRadius: 85,
      speed,
      life: 0,
      maxLife: travelTime,
      color: '#f97316',
    });
  }

  // Magic: Fireball
  private fireMageFireball(unit: UnitInstance, target: UnitInstance) {
    const config = UNIT_CONFIGS[unit.type];
    sound.playMagic();

    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 360;
    const travelTime = dist / speed;

    this.projectiles.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'fireball',
      faction: unit.faction,
      sourceId: unit.id,
      startX: unit.x,
      startY: unit.y,
      currentX: unit.x,
      currentY: unit.y,
      targetX: target.x,
      targetY: target.y,
      currentZ: 0,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      vz: 110,
      gravity: 140,
      damage: config.damage,
      aoeRadius: 65,
      speed,
      life: 0,
      maxLife: travelTime,
      color: '#fb923c',
    });
  }

  // Projectile Updates
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;
      const progress = Math.min(1, p.life / p.maxLife);

      p.currentX = p.startX + (p.targetX - p.startX) * progress;
      p.currentY = p.startY + (p.targetY - p.startY) * progress;
      // Parabolic flight arc
      p.currentZ = Math.sin(progress * Math.PI) * (p.type === 'boulder' ? 120 : p.type === 'arrow' ? 70 : 45);

      // Trailing smoke / fire particles
      if (p.type === 'boulder' || p.type === 'fireball') {
        if (Math.random() < 0.6) {
          this.particles.push({
            x: p.currentX,
            y: p.currentY - p.currentZ * 0.6,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: 4 + Math.random() * 4,
            color: p.type === 'fireball' ? '#f97316' : '#78716c',
            alpha: 0.8,
            decay: 2.5,
            type: p.type === 'fireball' ? 'fire' : 'smoke',
          });
        }
      }

      // Detonation / Landing
      if (progress >= 1) {
        this.resolveProjectileImpact(p);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private resolveProjectileImpact(p: Projectile) {
    const sourceUnit = this.units.find((u) => u.id === p.sourceId);

    if (p.type === 'arrow' || p.type === 'javelin') {
      sound.playArrowHit();
      // Single target hit or miss
      let hitUnit: UnitInstance | null = null;
      let closestDist = p.type === 'javelin' ? 32 : 26;

      for (const u of this.units) {
        if (u.faction !== p.faction && u.state !== 'dead') {
          const d = Math.hypot(u.x - p.targetX, u.y - p.targetY);
          if (d < closestDist) {
            closestDist = d;
            hitUnit = u;
          }
        }
      }

      if (hitUnit) {
        // Shieldbearer frontal deflection (70% for arrows, 50% for heavy javelins)
        const deflectChance = p.type === 'javelin' ? 0.5 : 0.7;
        if (hitUnit.type === 'shield' && Math.random() < deflectChance) {
          const msg = p.type === 'javelin' ? '투창 방어!' : '화살 튕겨냄!';
          this.spawnDamageNumber(hitUnit.x, hitUnit.y - 20, msg, '#60a5fa', false);
          this.spawnParticle(hitUnit.x, hitUnit.y, 'spark', 5);
          return;
        }

        const actualDamage = Math.max(5, Math.round(p.damage * (1 - UNIT_CONFIGS[hitUnit.type].armor)));
        hitUnit.hp -= actualDamage;
        if (sourceUnit) sourceUnit.damageDealt += actualDamage;
        if (p.faction === 'red') this.totalRedDamage += actualDamage;
        else this.totalBlueDamage += actualDamage;

        this.spawnDamageNumber(hitUnit.x, hitUnit.y - 15, `-${actualDamage}`, p.type === 'javelin' ? '#fde047' : '#ffffff', p.type === 'javelin');
        this.spawnParticle(hitUnit.x, hitUnit.y, 'blood', p.type === 'javelin' ? 8 : 6);

        if (hitUnit.hp <= 0) {
          hitUnit.state = 'dead';
          if (sourceUnit) sourceUnit.kills++;
          this.onUnitKilled(hitUnit, sourceUnit || hitUnit);
        }
      } else {
        // Stuck in ground decal
        this.spawnParticle(p.targetX, p.targetY, 'dust', 3);
      }
    } else if (p.type === 'boulder' || p.type === 'fireball') {
      sound.playExplosion();
      this.screenShake = Math.max(this.screenShake, p.type === 'boulder' ? 12 : 7);

      // AoE explosion particles
      this.spawnParticle(p.targetX, p.targetY, 'fire', 24);
      this.spawnParticle(p.targetX, p.targetY, 'smoke', 18);
      this.spawnParticle(p.targetX, p.targetY, 'dust', 12);

      // Crater decal on ground
      if (this.groundDecals.length < 80) {
        this.groundDecals.push({
          x: p.targetX,
          y: p.targetY,
          angle: Math.random() * Math.PI * 2,
          size: p.type === 'boulder' ? 36 : 28,
          type: 'crater',
          alpha: 0.9,
        });
      }

      // AoE Damage to all units in blast radius
      for (const u of this.units) {
        if (u.faction !== p.faction && u.state !== 'dead') {
          const d = Math.hypot(u.x - p.targetX, u.y - p.targetY);
          if (d <= p.aoeRadius) {
            const falloff = 1 - (d / p.aoeRadius) * 0.5; // closer to center = more damage
            const aoeDmg = Math.round(p.damage * falloff);

            u.hp -= aoeDmg;
            if (sourceUnit) sourceUnit.damageDealt += aoeDmg;
            if (p.faction === 'red') this.totalRedDamage += aoeDmg;
            else this.totalBlueDamage += aoeDmg;

            // Knockback away from explosion epicenter
            const angle = Math.atan2(u.y - p.targetY, u.x - p.targetX);
            const kbDist = (1 - d / p.aoeRadius) * (p.type === 'boulder' ? 60 : 35);
            u.x += Math.cos(angle) * kbDist;
            u.y += Math.sin(angle) * kbDist;

            this.spawnDamageNumber(u.x, u.y - 15, `-${aoeDmg}`, '#f97316', true);
            this.spawnParticle(u.x, u.y, 'blood', 6);

            if (u.hp <= 0) {
              u.state = 'dead';
              if (sourceUnit) sourceUnit.kills++;
              this.onUnitKilled(u, sourceUnit || u);
            }
          }
        }
      }
    }
  }

  // Particle updates
  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.alpha -= part.decay * dt;
      if (part.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public spawnParticle(x: number, y: number, type: Particle['type'], count: number = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 80;
      let color = '#ef4444';
      let decay = 2.0;

      if (type === 'blood') {
        color = Math.random() > 0.4 ? '#dc2626' : '#991b1b';
        decay = 1.6;
      } else if (type === 'spark') {
        color = '#fde047';
        decay = 3.5;
      } else if (type === 'smoke') {
        color = '#64748b';
        decay = 1.2;
      } else if (type === 'fire') {
        color = Math.random() > 0.5 ? '#f97316' : '#eab308';
        decay = 2.4;
      } else if (type === 'dust') {
        color = '#d6d3d1';
        decay = 1.8;
      } else if (type === 'heal') {
        color = '#34d399';
        decay = 1.4;
      } else if (type === 'shadow') {
        color = '#a855f7';
        decay = 2.2;
      }

      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color,
        alpha: 1,
        decay,
        type,
      });
    }
  }

  // Damage number updates
  private updateDamageNumbers(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life += dt;
      dn.y += dn.vy * dt;
      dn.alpha = 1 - dn.life / dn.maxLife;
      if (dn.life >= dn.maxLife) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public spawnDamageNumber(
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff',
    isCritical: boolean = false,
    isHeal: boolean = false
  ) {
    if (this.damageNumbers.length > 50) return; // avoid clutter
    this.damageNumbers.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.85,
      vy: -35,
      isCritical,
      isHeal,
    });
  }

  // Check victory / defeat
  private checkOutcome() {
    if (this.isOver) return;

    const aliveRed = this.units.filter((u) => u.faction === 'red' && u.state !== 'dead').length;
    const aliveBlue = this.units.filter((u) => u.faction === 'blue' && u.state !== 'dead').length;

    if (aliveRed === 0 && aliveBlue === 0) {
      // Draw
      this.isOver = true;
      this.isRunning = false;
      this.winner = null;
      sound.playDefeat();
    } else if (aliveRed === 0) {
      // CPU Wins (Defeat)
      this.isOver = true;
      this.isRunning = false;
      this.winner = 'blue';
      sound.playDefeat();
    } else if (aliveBlue === 0) {
      // Player Wins (Victory)
      this.isOver = true;
      this.isRunning = false;
      this.winner = 'red';
      sound.playVictory();
    }
  }

  // Calculate MVP Unit
  public getMVPUnit(): UnitInstance | null {
    if (this.units.length === 0) return null;
    let mvp: UnitInstance | null = null;
    let bestScore = -1;

    for (const u of this.units) {
      const score = u.kills * 100 + u.damageDealt;
      if (score > bestScore) {
        bestScore = score;
        mvp = u;
      }
    }
    return mvp;
  }
}
