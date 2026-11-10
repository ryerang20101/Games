/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BattleSimulation } from './simulation';
import { UnitInstance } from '../types/game';
import { UNIT_CONFIGS } from '../data/units';
import { ZONE_BOUNDS, WORLD_WIDTH, WORLD_HEIGHT } from '../data/maps';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private sim: BattleSimulation;

  constructor(ctx: CanvasRenderingContext2D, sim: BattleSimulation) {
    this.ctx = ctx;
    this.sim = sim;
  }

  public render(
    viewportWidth: number,
    viewportHeight: number,
    camera: { x: number; y: number; zoom: number },
    hoverCoord: { x: number; y: number } | null,
    selectedUnitId: string | null,
    activePlacingType: string | null,
    activePlacingFaction: 'red' | 'blue' = 'red'
  ) {
    const ctx = this.ctx;
    ctx.save();

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Camera transform
    ctx.translate(viewportWidth / 2, viewportHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Screen Shake effect
    if (this.sim.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.sim.screenShake * 1.5;
      const shakeY = (Math.random() - 0.5) * this.sim.screenShake * 1.5;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Render Battlefield Terrain Background
    this.renderTerrain();

    // 2. Render Deployment Zones (Red Left, Blue Right, Middle Neutral)
    this.renderDeploymentZones(hoverCoord, activePlacingType, activePlacingFaction);

    // 3. Render Ground Decals (blood, craters)
    this.renderGroundDecals();

    // 4. Render Obstacles
    this.renderObstacles();

    // 5. Render Units (Dead first, then Alive sorted by Y for natural depth)
    this.renderUnits(selectedUnitId);

    // 6. Render Projectiles (with altitude shadows)
    this.renderProjectiles();

    // 7. Render Particles
    this.renderParticles();

    // 8. Render Damage Numbers
    this.renderDamageNumbers();

    // 9. Placement Ghost Preview when in Deployment Phase
    if (!this.sim.isRunning && hoverCoord && activePlacingType) {
      this.renderPlacementPreview(hoverCoord, activePlacingType, activePlacingFaction);
    }

    ctx.restore();
  }

  // Terrain Rendering
  private renderTerrain() {
    const ctx = this.ctx;
    const map = this.sim.map;

    // Base background
    ctx.fillStyle = map.bgColor;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Battlefield outer border
    ctx.strokeStyle = map.borderColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, WORLD_WIDTH - 10, WORLD_HEIGHT - 10);

    // Grid texture lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }

    // Map-specific decorative elements
    if (map.decorations) {
      for (const dec of map.decorations) {
        ctx.save();
        ctx.translate(dec.x, dec.y);

        if (dec.type === 'flower') {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(0, 0, dec.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, dec.size * 0.15, 0, Math.PI * 2);
          ctx.fill();
        } else if (dec.type === 'cactus') {
          ctx.fillStyle = '#2d5a27';
          ctx.fillRect(-dec.size * 0.2, -dec.size * 0.8, dec.size * 0.4, dec.size);
          ctx.fillRect(-dec.size * 0.5, -dec.size * 0.5, dec.size * 0.35, dec.size * 0.2);
          ctx.fillRect(dec.size * 0.15, -dec.size * 0.3, dec.size * 0.35, dec.size * 0.2);
        } else if (dec.type === 'ice_patch') {
          ctx.fillStyle = 'rgba(186, 230, 253, 0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 0, dec.size, dec.size * 0.6, 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (dec.type === 'vent') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, dec.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, 0, dec.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  // Deployment Zones (Red Left vs Blue Right, Middle Forbidden)
  private renderDeploymentZones(
    hoverCoord: { x: number; y: number } | null,
    activePlacingType: string | null,
    activePlacingFaction: 'red' | 'blue' = 'red'
  ) {
    const ctx = this.ctx;
    const isPlacing = !this.sim.isRunning;

    // --- 1. RED FACTION ZONE (Player 1P) ---
    const rz = ZONE_BOUNDS.red;
    ctx.save();
    const isRedPlacingActive = isPlacing && activePlacingFaction === 'red';
    ctx.fillStyle = isRedPlacingActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.04)';
    ctx.fillRect(rz.minX, rz.minY, rz.maxX - rz.minX, rz.maxY - rz.minY);

    // Glowing red border
    ctx.strokeStyle = isRedPlacingActive ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = isRedPlacingActive ? 4 : 2;
    ctx.setLineDash(isRedPlacingActive ? [14, 6] : [10, 10]);
    ctx.strokeRect(rz.minX, rz.minY, rz.maxX - rz.minX, rz.maxY - rz.minY);
    ctx.setLineDash([]);

    // Red Zone Header & Flag
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 20px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔴 1P 레드 진영 (RED ZONE)', rz.minX + 20, rz.minY + 35);
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(252, 165, 165, 0.85)';
    ctx.fillText(
      isRedPlacingActive
        ? '▶ [배치 활성화] 레드 진영 영역 내에 병력을 배치하세요.'
        : '※ 빨간색 진영 배치 구역입니다.',
      rz.minX + 20,
      rz.minY + 58
    );
    ctx.restore();

    // --- 2. MIDDLE COMBAT ZONE (Neutral - No Deployment Allowed) ---
    const nz = ZONE_BOUNDS.neutral;
    ctx.save();
    // Dark warning stripes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.fillRect(nz.minX, nz.minY, nz.maxX - nz.minX, nz.maxY - nz.minY);

    // Warning dashed divider lines
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.strokeRect(nz.minX, nz.minY, nz.maxX - nz.minX, nz.maxY - nz.minY);
    ctx.setLineDash([]);

    // Warning Banner in center
    ctx.fillStyle = 'rgba(234, 179, 8, 0.8)';
    ctx.font = 'bold 18px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ 전투 구간 (배치 불가 영역) ⚔️', (nz.minX + nz.maxX) / 2, nz.minY + 35);
    ctx.font = '13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
    ctx.fillText('양군이 격돌하는 무인지대입니다. 유닛을 설치할 수 없습니다.', (nz.minX + nz.maxX) / 2, nz.minY + 58);

    // Warning diagonal marks on top and bottom of middle zone
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.2)';
    ctx.lineWidth = 1.5;
    for (let x = nz.minX; x < nz.maxX; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, nz.minY);
      ctx.lineTo(x + 30, nz.minY + 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, nz.maxY);
      ctx.lineTo(x + 30, nz.maxY - 30);
      ctx.stroke();
    }
    ctx.restore();

    // --- 3. BLUE FACTION ZONE (AI CPU / 2P) ---
    const bz = ZONE_BOUNDS.blue;
    ctx.save();
    const isBluePlacingActive = isPlacing && activePlacingFaction === 'blue';
    ctx.fillStyle = isBluePlacingActive ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.04)';
    ctx.fillRect(bz.minX, bz.minY, bz.maxX - bz.minX, bz.maxY - bz.minY);

    // Glowing blue border
    ctx.strokeStyle = isBluePlacingActive ? 'rgba(59, 130, 246, 0.85)' : 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = isBluePlacingActive ? 4 : 2;
    ctx.setLineDash(isBluePlacingActive ? [14, 6] : [10, 10]);
    ctx.strokeRect(bz.minX, bz.minY, bz.maxX - bz.minX, bz.maxY - bz.minY);
    ctx.setLineDash([]);

    // Blue Zone Header & Flag
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 20px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🔵 2P 블루 진영 (BLUE ZONE)', bz.maxX - 20, bz.minY + 35);
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(147, 197, 253, 0.85)';
    ctx.fillText(
      isBluePlacingActive
        ? '▶ [배치 활성화] 블루 진영 영역 내에 병력을 배치하세요.'
        : '※ 파란색 진영 배치 구역입니다.',
      bz.maxX - 20,
      bz.minY + 58
    );
    ctx.restore();

    // Draw invalid placement indicator when hovering over invalid zone
    if (isPlacing && hoverCoord && activePlacingType) {
      let isInvalid = false;
      let invalidMsg = '';

      if (hoverCoord.x >= nz.minX && hoverCoord.x <= nz.maxX) {
        isInvalid = true;
        invalidMsg = '🚫 전투 구역 (설치 불가)';
      } else if (activePlacingFaction === 'red' && hoverCoord.x > rz.maxX) {
        isInvalid = true;
        invalidMsg = '🚫 2P 블루 진영 (설치 불가)';
      } else if (activePlacingFaction === 'blue' && hoverCoord.x < bz.minX) {
        isInvalid = true;
        invalidMsg = '🚫 1P 레드 진영 (설치 불가)';
      }

      if (isInvalid) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.arc(hoverCoord.x, hoverCoord.y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hoverCoord.x - 14, hoverCoord.y - 14);
        ctx.lineTo(hoverCoord.x + 14, hoverCoord.y + 14);
        ctx.moveTo(hoverCoord.x + 14, hoverCoord.y - 14);
        ctx.lineTo(hoverCoord.x - 14, hoverCoord.y + 14);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(invalidMsg, hoverCoord.x, hoverCoord.y - 42);
        ctx.restore();
      }
    }
  }

  // Render Obstacles (Rocks, water, bridges)
  private renderObstacles() {
    const ctx = this.ctx;
    for (const obs of this.sim.map.obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.type === 'rock') {
        // Rock shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, obs.height * 0.45, obs.width * 0.55, obs.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rock body
        ctx.fillStyle = '#57534e';
        ctx.beginPath();
        ctx.ellipse(0, 0, obs.width * 0.5, obs.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.ellipse(-obs.width * 0.15, -obs.height * 0.15, obs.width * 0.3, obs.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'water') {
        // River water
        ctx.fillStyle = '#0e7490';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

        // Water ripples
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-obs.width * 0.4, 0);
        ctx.lineTo(obs.width * 0.4, 0);
        ctx.stroke();
      } else if (obs.type === 'bridge') {
        // Stone Bridge surface
        ctx.fillStyle = '#71717a';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

        // Bridge side railings
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, 10);
        ctx.fillRect(-obs.width / 2, obs.height / 2 - 10, obs.width, 10);

        // Planks / stone seams
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 2;
        for (let bx = -obs.width / 2; bx <= obs.width / 2; bx += 20) {
          ctx.beginPath();
          ctx.moveTo(bx, -obs.height / 2 + 10);
          ctx.lineTo(bx, obs.height / 2 - 10);
          ctx.stroke();
        }
      } else if (obs.type === 'lava') {
        // Glowing lava crater
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(0, 0, obs.width * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, obs.width * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, obs.width * 0.18, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'tree') {
        // Pine tree shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 15, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Canopy
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(0, 0, obs.width * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(-4, -4, obs.width * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Ground Decals (Blood pools, explosion craters)
  private renderGroundDecals() {
    const ctx = this.ctx;
    for (const decal of this.sim.groundDecals) {
      ctx.save();
      ctx.translate(decal.x, decal.y);
      ctx.rotate(decal.angle);
      ctx.globalAlpha = decal.alpha;

      if (decal.type === 'blood') {
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.ellipse(0, 0, decal.size, decal.size * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (decal.type === 'crater') {
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(0, 0, decal.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Render Units
  private renderUnits(selectedUnitId: string | null) {
    const units = this.sim.units;

    // Render dead units first (lying on ground)
    for (const unit of units) {
      if (unit.state === 'dead') {
        this.renderDeadUnit(unit);
      }
    }

    // Sort alive units by Y coordinate for natural 2.5D visual overlap
    const aliveUnits = units.filter((u) => u.state !== 'dead').sort((a, b) => a.y - b.y);

    for (const unit of aliveUnits) {
      this.renderAliveUnit(unit, unit.id === selectedUnitId);
    }
  }

  // Render Dead Unit (Corpse)
  private renderDeadUnit(unit: UnitInstance) {
    const ctx = this.ctx;
    const config = UNIT_CONFIGS[unit.type];
    ctx.save();
    ctx.translate(unit.x, unit.y);
    ctx.rotate(unit.angle);
    ctx.globalAlpha = 0.5;

    // Fallen body shape
    ctx.fillStyle = unit.faction === 'red' ? '#991b1b' : '#1e3a8a';
    ctx.beginPath();
    ctx.ellipse(0, 0, config.size * 0.8, config.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fallen helmet/weapon
    ctx.fillStyle = '#71717a';
    ctx.fillRect(-config.size * 0.5, -3, config.size, 4);

    ctx.restore();
  }

  // Render Alive Unit (Detailed Procedural Characters)
  private renderAliveUnit(unit: UnitInstance, isSelected: boolean) {
    const ctx = this.ctx;
    const config = UNIT_CONFIGS[unit.type];
    const isRed = unit.faction === 'red';
    const primaryColor = isRed ? '#ef4444' : '#3b82f6';
    const darkColor = isRed ? '#991b1b' : '#1d4ed8';

    ctx.save();
    ctx.translate(unit.x, unit.y);

    // 1. Contact ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, config.size * 0.35, config.size * 0.85, config.size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Selection Ring
    if (isSelected) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, config.size + 10, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing arrow or indicator
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(0, -config.size - 18);
      ctx.lineTo(-6, -config.size - 26);
      ctx.lineTo(6, -config.size - 26);
      ctx.closePath();
      ctx.fill();
    }

    // Stealth Visual for Assassin
    if (unit.type === 'assassin' && unit.isStealthed) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, config.size * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Rotate to face direction
    ctx.rotate(unit.angle);

    // 4. Character Specific Models
    switch (unit.type) {
      case 'infantry':
        this.drawInfantry(ctx, config.size, primaryColor, darkColor, unit.attackAnimProgress || 0);
        break;
      case 'cavalry':
        this.drawCavalry(ctx, config.size, primaryColor, darkColor, unit.isCharging || false, unit.attackAnimProgress || 0);
        break;
      case 'archer':
        this.drawArcher(ctx, config.size, primaryColor, darkColor, unit.state === 'shooting');
        break;
      case 'spearman':
        this.drawSpearman(ctx, config.size, primaryColor, darkColor, unit.attackAnimProgress || 0);
        break;
      case 'shield':
        this.drawShieldbearer(ctx, config.size, primaryColor, darkColor);
        break;
      case 'catapult':
        this.drawCatapult(ctx, config.size, primaryColor, unit.state === 'shooting');
        break;
      case 'mage':
        this.drawMage(ctx, config.size, primaryColor, darkColor);
        break;
      case 'priest':
        this.drawPriest(ctx, config.size, primaryColor);
        break;
      case 'giant':
        this.drawGiant(ctx, config.size, primaryColor, darkColor, unit.attackAnimProgress || 0);
        break;
      case 'javelin':
        this.drawJavelin(ctx, config.size, primaryColor, darkColor, unit.attackAnimProgress || 0);
        break;
      case 'bomber':
        this.drawBomber(ctx, config.size, primaryColor, darkColor);
        break;
      case 'assassin':
        this.drawAssassin(ctx, config.size, primaryColor, darkColor, unit.isStealthed || false);
        break;
    }

    ctx.restore(); // Restore angle/translation

    // 5. Health Bar & Name Tag (Drawn unrotated above unit)
    this.renderHealthBar(unit, config.size, isRed);
  }

  // --- UNIT PROCEDURAL DRAWINGS ---

  // 보병 (Infantry / Swordsman)
  private drawInfantry(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string,
    attackProgress: number
  ) {
    // Body / Armor
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Helmet with crest
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Visor slit
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(size * 0.1, -size * 0.15, size * 0.25, size * 0.3);

    // Left hand round shield
    ctx.save();
    ctx.translate(size * 0.3, -size * 0.6);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Shield boss
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right hand Sword (Swings during attack)
    ctx.save();
    ctx.translate(size * 0.4, size * 0.4);
    const swingAngle = attackProgress * Math.PI * 0.8;
    ctx.rotate(swingAngle);
    // Blade
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, -2, size * 1.3, 4);
    // Crossguard
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, -6, 3, 12);
    ctx.restore();
  }

  // 기마병 (Cavalry / Knight on Horse)
  private drawCavalry(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string,
    isCharging: boolean,
    attackProgress: number
  ) {
    // Horse Body
    ctx.fillStyle = '#78350f'; // Chestnut horse coat
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.0, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horse Barding / Saddle Cloth (Faction Colored)
    ctx.fillStyle = color;
    ctx.fillRect(-size * 0.4, -size * 0.45, size * 0.8, size * 0.9);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-size * 0.4, -size * 0.45, size * 0.8, size * 0.9);

    // Horse Head
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(size * 0.8, 0, size * 0.45, size * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    // Mane
    ctx.fillStyle = '#451a03';
    ctx.fillRect(size * 0.4, -size * 0.15, size * 0.35, size * 0.3);

    // Knight on top (helmet + shoulders)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Plume on knight's helmet
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, 0, size * 0.25, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Long Lance / Spear pointing forward
    ctx.save();
    ctx.translate(size * 0.2, size * 0.35);
    const thrust = attackProgress * 12;
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0 + thrust, -2, size * 1.7, 4);
    // Steel tip
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(size * 1.7 + thrust, -5);
    ctx.lineTo(size * 2.1 + thrust, 0);
    ctx.lineTo(size * 1.7 + thrust, 5);
    ctx.closePath();
    ctx.fill();

    // Lance streamer / pennant
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size * 1.4 + thrust, -2);
    ctx.lineTo(size * 1.1 + thrust, -10);
    ctx.lineTo(size * 1.4 + thrust, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dust particles when charging
    if (isCharging) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-size * 1.2, (Math.random() - 0.5) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 궁수 (Archer with Recurve Bow)
  private drawArcher(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string,
    isShooting: boolean
  ) {
    // Archer Body with Hood
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Quiver on back with arrows
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-size * 0.6, -size * 0.3, size * 0.4, size * 0.6);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-size * 0.75, -size * 0.2, size * 0.2, 2);
    ctx.fillRect(-size * 0.75, 0, size * 0.2, 2);

    // Archer Face & Hood
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(size * 0.1, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Bow
    ctx.save();
    ctx.translate(size * 0.4, 0);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.8, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const pull = isShooting ? -size * 0.3 : 0;
    ctx.moveTo(Math.cos(-Math.PI * 0.38) * size * 0.8, Math.sin(-Math.PI * 0.38) * size * 0.8);
    ctx.lineTo(pull, 0);
    ctx.lineTo(Math.cos(Math.PI * 0.38) * size * 0.8, Math.sin(Math.PI * 0.38) * size * 0.8);
    ctx.stroke();

    // Nocked Arrow if shooting
    if (isShooting) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(pull, -1, size * 0.9, 2);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(size * 0.9 + pull, -3);
      ctx.lineTo(size * 1.1 + pull, 0);
      ctx.lineTo(size * 0.9 + pull, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  // 창병 (Spearman with Pike)
  private drawSpearman(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string,
    attackProgress: number
  ) {
    // Body Armor
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Conical Iron Helmet
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Long Pike
    ctx.save();
    ctx.translate(size * 0.2, 0);
    const thrust = attackProgress * 15;
    ctx.fillStyle = '#78350f'; // Wooden shaft
    ctx.fillRect(-size * 0.4 + thrust, -2, size * 2.2, 4);

    // Spearhead
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(size * 1.8 + thrust, -5);
    ctx.lineTo(size * 2.4 + thrust, 0);
    ctx.lineTo(size * 1.8 + thrust, 5);
    ctx.closePath();
    ctx.fill();

    // Faction Banner ribbon
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size * 1.6 + thrust, 2);
    ctx.lineTo(size * 1.2 + thrust, 9);
    ctx.lineTo(size * 1.5 + thrust, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 방패병 (Shieldbearer with Tower Shield)
  private drawShieldbearer(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string
  ) {
    // Heavy Armored Body
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Helmet
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Massive Tower Shield in front
    ctx.save();
    ctx.translate(size * 0.45, 0);
    // Shield plate
    ctx.fillStyle = color;
    ctx.fillRect(-size * 0.15, -size * 0.95, size * 0.3, size * 1.9);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size * 0.15, -size * 0.95, size * 0.3, size * 1.9);

    // Metal shield rim and gold crest
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-size * 0.05, -size * 0.2, size * 0.1, size * 0.4);
    ctx.restore();
  }

  // 투석기 (Catapult)
  private drawCatapult(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    isShooting: boolean
  ) {
    // Timber frame chassis
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-size * 0.7, -size * 0.6, size * 1.4, size * 1.2);

    // 4 Wheels
    ctx.fillStyle = '#292524';
    ctx.fillRect(-size * 0.8, -size * 0.75, size * 0.4, size * 0.2);
    ctx.fillRect(size * 0.4, -size * 0.75, size * 0.4, size * 0.2);
    ctx.fillRect(-size * 0.8, size * 0.55, size * 0.4, size * 0.2);
    ctx.fillRect(size * 0.4, size * 0.55, size * 0.4, size * 0.2);

    // Faction banner banner cloth on catapult
    ctx.fillStyle = color;
    ctx.fillRect(-size * 0.4, -size * 0.3, size * 0.8, size * 0.6);

    // Throwing Arm & Basket
    ctx.save();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-size * 0.5, -3, size * 1.3, 6);
    // Payload stone
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(size * 0.8, 0, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 마법사 (Fire Mage)
  private drawMage(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string
  ) {
    // Flowing Robes
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Wizard Pointy Hat
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Magic Staff
    ctx.save();
    ctx.translate(size * 0.4, size * 0.4);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, -2, size * 1.2, 4);

    // Floating Fireball Orb atop staff
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(size * 1.2, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(size * 1.2, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 사제 (Priest / Healer)
  private drawPriest(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string
  ) {
    // Holy White & Team Robes
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Golden Halo / Aura
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    // Holy Cross Staff
    ctx.save();
    ctx.translate(size * 0.35, size * 0.35);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, -2, size * 1.1, 4);
    ctx.fillRect(size * 0.8, -size * 0.3, 3, size * 0.6);
    ctx.restore();
  }

  // 거인 (Giant Berserker)
  private drawGiant(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string,
    attackProgress: number
  ) {
    // Massive muscular torso
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Spiked shoulder pauldrons
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.arc(0, -size * 0.6, size * 0.4, 0, Math.PI * 2);
    ctx.arc(0, size * 0.6, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Warpaint & beard
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(size * 0.3, 0, size * 0.4, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Giant Two-Handed Greataxe
    ctx.save();
    ctx.translate(size * 0.3, size * 0.4);
    const swingAngle = attackProgress * Math.PI;
    ctx.rotate(swingAngle);

    // Axe handle
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -3, size * 1.4, 6);

    // Axe head blade
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(size * 1.2, 0, size * 0.7, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.lineTo(size * 1.0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 투창병 (Javelin Thrower)
  private drawJavelin(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string,
    attackProgress: number
  ) {
    // Body / Tunic
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Leather chest harness
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, -size * 0.5);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.stroke();

    // Head with bronze skullcap
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Reserve javelins strapped on back
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-size * 0.7, -size * 0.6, 2, size * 1.2);
    ctx.fillRect(-size * 0.8, -size * 0.5, 2, size * 1.1);

    // Active Javelin in throwing hand
    ctx.save();
    ctx.translate(size * 0.2, size * 0.2);
    const thrust = attackProgress * 10;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-size * 0.5 + thrust, -1.8, size * 1.9, 3.6);
    // Steel tip
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(size * 1.4 + thrust, -4);
    ctx.lineTo(size * 1.9 + thrust, 0);
    ctx.lineTo(size * 1.4 + thrust, 4);
    ctx.closePath();
    ctx.fill();
    // Faction ribbon wrap
    ctx.fillStyle = color;
    ctx.fillRect(size * 1.0 + thrust, -2.5, 5, 5);
    ctx.restore();
  }

  // 자폭병 (Bomber / Sapper)
  private drawBomber(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string
  ) {
    // Fast sprint posture - slight forward lean
    // Faction colored runner body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Head with faction headband
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(size * 0.2, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(size * 0.05, -size * 0.3, 3, size * 0.6);

    // Glowing intense eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(size * 0.3, -2, 2.5, 2.5);
    ctx.fillRect(size * 0.3, 1, 2.5, 2.5);

    // Giant Gunpowder Bomb strapped to back
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-size * 0.45, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Steel bands around bomb
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size * 0.8, -size * 0.2, size * 0.7, size * 0.4);

    // Sizzling Fuse on top of bomb
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, -size * 0.6);
    ctx.quadraticCurveTo(-size * 0.5, -size * 0.9, -size * 0.35, -size * 1.0);
    ctx.stroke();

    // Burning Spark FX at fuse tip
    ctx.fillStyle = Math.random() > 0.4 ? '#f97316' : '#fde047';
    ctx.beginPath();
    ctx.arc(-size * 0.35, -size * 1.0, 3 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 암살자 (Assassin / Shadowblade)
  private drawAssassin(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string,
    darkColor: string,
    isStealthed: boolean
  ) {
    // Stealth Cloaked Body
    ctx.fillStyle = isStealthed ? '#3b0764' : '#18181b';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Faction trim on cloak
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Assassin Hood & Shadow Mask
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(size * 0.1, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Gleaming sharp eyes slit
    ctx.fillStyle = isStealthed ? '#c084fc' : '#f8fafc';
    ctx.fillRect(size * 0.25, -2.5, 2.5, 1.5);
    ctx.fillRect(size * 0.25, 1.5, 2.5, 1.5);

    // Left hand dagger
    ctx.save();
    ctx.translate(size * 0.25, -size * 0.5);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, -1.5, size * 0.9, 3);
    ctx.fillStyle = darkColor;
    ctx.fillRect(-2, -3, 3, 6);
    ctx.restore();

    // Right hand dagger
    ctx.save();
    ctx.translate(size * 0.25, size * 0.5);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, -1.5, size * 0.9, 3);
    ctx.fillStyle = darkColor;
    ctx.fillRect(-2, -3, 3, 6);
    ctx.restore();
  }

  // Render Health Bar & Role Badge
  private renderHealthBar(unit: UnitInstance, size: number, isRed: boolean) {
    const ctx = this.ctx;
    const barWidth = Math.max(34, size * 2.2);
    const barHeight = 6;
    const barX = unit.x - barWidth / 2;
    const barY = unit.y - size - 16;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Current HP fill
    const hpRatio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
    if (hpRatio < 0.25) {
      ctx.fillStyle = '#f87171'; // Critical red
    }
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // Shield Armor indicator if high armor
    const config = UNIT_CONFIGS[unit.type];
    if (config.armor >= 0.4) {
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(barX, barY + barHeight - 2, barWidth, 2);
    }
  }

  // Render Projectiles
  private renderProjectiles() {
    const ctx = this.ctx;
    for (const p of this.sim.projectiles) {
      ctx.save();

      // Shadow on ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(p.currentX, p.currentY, p.type === 'boulder' ? 12 : 5, p.type === 'boulder' ? 7 : 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Elevated Projectile Position (Y offset by currentZ)
      const renderY = p.currentY - p.currentZ;
      ctx.translate(p.currentX, renderY);

      if (p.type === 'arrow') {
        const angle = Math.atan2(p.vy, p.vx);
        ctx.rotate(angle);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -1.5, 24, 3);
        // Steel arrowhead
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(12, -3);
        ctx.lineTo(17, 0);
        ctx.lineTo(12, 3);
        ctx.fill();
        // Fletching feathers
        ctx.fillStyle = p.color;
        ctx.fillRect(-12, -3, 5, 6);
      } else if (p.type === 'javelin') {
        const angle = Math.atan2(p.vy, p.vx);
        ctx.rotate(angle);
        ctx.fillStyle = '#78350f'; // wood shaft
        ctx.fillRect(-16, -1.8, 32, 3.6);
        // Heavy steel point
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(16, -4);
        ctx.lineTo(24, 0);
        ctx.lineTo(16, 4);
        ctx.closePath();
        ctx.fill();
        // Faction wrap
        ctx.fillStyle = p.color;
        ctx.fillRect(-14, -2.5, 6, 5);
      } else if (p.type === 'boulder') {
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        // Fiery rim
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (p.type === 'fireball') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Render Particles
  private renderParticles() {
    const ctx = this.ctx;
    for (const part of this.sim.particles) {
      ctx.save();
      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Render Damage Numbers
  private renderDamageNumbers() {
    const ctx = this.ctx;
    for (const dn of this.sim.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = dn.alpha;
      ctx.font = dn.isCritical ? 'bold 18px "Noto Sans KR", sans-serif' : 'bold 14px "Noto Sans KR", sans-serif';
      ctx.fillStyle = dn.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(dn.text, dn.x, dn.y);
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }
  }

  // Ghost Placement Preview
  private renderPlacementPreview(
    hoverCoord: { x: number; y: number },
    unitType: string,
    activePlacingFaction: 'red' | 'blue' = 'red'
  ) {
    const targetZone = ZONE_BOUNDS[activePlacingFaction];
    const isValid =
      hoverCoord.x >= targetZone.minX &&
      hoverCoord.x <= targetZone.maxX &&
      hoverCoord.y >= targetZone.minY &&
      hoverCoord.y <= targetZone.maxY;
    const config = UNIT_CONFIGS[unitType as keyof typeof UNIT_CONFIGS];
    if (!config) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(hoverCoord.x, hoverCoord.y);
    ctx.globalAlpha = 0.65;

    const factionColor = activePlacingFaction === 'red' ? '#ef4444' : '#3b82f6';
    const factionFill =
      activePlacingFaction === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';

    // Radius circle
    ctx.fillStyle = isValid ? factionFill : 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, config.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isValid ? factionColor : '#dc2626';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Attack range preview circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, config.attackRange, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
