/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BattleSimulation } from '../game/simulation';
import { CanvasRenderer } from '../game/renderer';
import { UnitCategory, UnitInstance } from '../types/game';
import { UNIT_CONFIGS } from '../data/units';
import { ZONE_BOUNDS, WORLD_WIDTH, WORLD_HEIGHT } from '../data/maps';
import { sound } from '../audio/soundEngine';

interface BattlefieldCanvasProps {
  simulation: BattleSimulation;
  activeUnitType: UnitCategory | null;
  activePlacingFaction?: 'red' | 'blue';
  playerGold: number;
  onDeductGold: (amount: number) => boolean;
  onRefundGold: (amount: number) => void;
  onSelectUnit: (unit: UnitInstance | null) => void;
  selectedUnit: UnitInstance | null;
  isBattleStarted: boolean;
  onUnitCountChange: () => void;
}

export const BattlefieldCanvas: React.FC<BattlefieldCanvasProps> = ({
  simulation,
  activeUnitType,
  activePlacingFaction = 'red',
  playerGold,
  onDeductGold,
  onRefundGold,
  onSelectUnit,
  selectedUnit,
  isBattleStarted,
  onUnitCountChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Camera state
  const cameraRef = useRef({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, zoom: 0.65 });
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Mouse pan / drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isPaintingUnitsRef = useRef(false);
  const lastPlacedPosRef = useRef<{ x: number; y: number } | null>(null);

  // Fit view function
  const fitToView = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const zoomX = clientWidth / (WORLD_WIDTH + 80);
    const zoomY = clientHeight / (WORLD_HEIGHT + 80);
    const fitZoom = Math.min(zoomX, zoomY, 1.0);
    cameraRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      zoom: Math.max(0.4, fitZoom),
    };
  };

  // Screen to World coordinates
  const screenToWorld = (screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const cam = cameraRef.current;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const worldX = (screenX - rect.left - cx) / cam.zoom + cam.x;
    const worldY = (screenY - rect.top - cy) / cam.zoom + cam.y;
    return { x: worldX, y: worldY };
  };

  // Try placing a unit
  const tryPlaceUnit = (worldX: number, worldY: number) => {
    if (isBattleStarted || !activeUnitType) return;

    // Check if inside Active Faction Zone
    const targetZone = ZONE_BOUNDS[activePlacingFaction];
    if (worldX < targetZone.minX || worldX > targetZone.maxX || worldY < targetZone.minY || worldY > targetZone.maxY) {
      // Forbidden zone!
      return;
    }

    // Check if overlaps impassable obstacles
    const config = UNIT_CONFIGS[activeUnitType];
    for (const obs of simulation.map.obstacles) {
      if (!obs.isPassable) {
        if (
          worldX >= obs.x - obs.width / 2 - config.size &&
          worldX <= obs.x + obs.width / 2 + config.size &&
          worldY >= obs.y - obs.height / 2 - config.size &&
          worldY <= obs.y + obs.height / 2 + config.size
        ) {
          return;
        }
      }
    }

    // Check minimum distance from previous placed position to prevent spamming overlapping units
    if (lastPlacedPosRef.current) {
      const d = Math.hypot(worldX - lastPlacedPosRef.current.x, worldY - lastPlacedPosRef.current.y);
      if (d < config.size * 1.5) return;
    }

    // Check gold
    if (!onDeductGold(config.cost)) {
      return; // Not enough gold
    }

    // Spawn Unit
    const newUnit: UnitInstance = {
      id: `${activePlacingFaction}_` + Math.random().toString(36).substring(2, 9),
      type: activeUnitType,
      faction: activePlacingFaction,
      x: worldX,
      y: worldY,
      vx: 0,
      vy: 0,
      angle: activePlacingFaction === 'red' ? 0 : Math.PI,
      targetAngle: activePlacingFaction === 'red' ? 0 : Math.PI,
      hp: config.maxHp,
      maxHp: config.maxHp,
      state: 'idle',
      targetId: null,
      lastAttackTime: 0,
      cooldownTimer: Math.random() * 0.3,
      kills: 0,
      damageDealt: 0,
      separationX: 0,
      separationY: 0,
      isStealthed: activeUnitType === 'assassin',
      hasExploded: false,
    };

    simulation.units.push(newUnit);
    lastPlacedPosRef.current = { x: worldX, y: worldY };
    sound.playPlacement();
    onUnitCountChange();
  };

  // Delete unit under cursor (refund gold)
  const tryDeleteUnit = (worldX: number, worldY: number) => {
    if (isBattleStarted) return;
    // Find closest unit of active placing faction within click radius
    let foundIndex = -1;
    let minD = 30;

    for (let i = 0; i < simulation.units.length; i++) {
      const u = simulation.units[i];
      if (u.faction === activePlacingFaction) {
        const d = Math.hypot(u.x - worldX, u.y - worldY);
        if (d < minD) {
          minD = d;
          foundIndex = i;
        }
      }
    }

    if (foundIndex !== -1) {
      const removed = simulation.units.splice(foundIndex, 1)[0];
      const refundCost = UNIT_CONFIGS[removed.type].cost;
      onRefundGold(refundCost);
      sound.playRemove();
      onUnitCountChange();
      if (selectedUnit?.id === removed.id) {
        onSelectUnit(null);
      }
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    // Left click
    if (e.button === 0) {
      if (e.shiftKey || (!activeUnitType && !isBattleStarted)) {
        // Selection or inspection
        let clickedUnit: UnitInstance | null = null;
        for (const u of simulation.units) {
          if (u.state !== 'dead') {
            const d = Math.hypot(u.x - x, u.y - y);
            if (d < UNIT_CONFIGS[u.type].size + 10) {
              clickedUnit = u;
              break;
            }
          }
        }
        onSelectUnit(clickedUnit);
      } else if (!isBattleStarted && activeUnitType) {
        // Start placement or paint drag
        isPaintingUnitsRef.current = true;
        tryPlaceUnit(x, y);
      } else {
        // In battle: select clicked unit
        let clickedUnit: UnitInstance | null = null;
        for (const u of simulation.units) {
          if (u.state !== 'dead') {
            const d = Math.hypot(u.x - x, u.y - y);
            if (d < UNIT_CONFIGS[u.type].size + 12) {
              clickedUnit = u;
              break;
            }
          }
        }
        onSelectUnit(clickedUnit);
      }
    }
    // Right click
    else if (e.button === 2) {
      if (!isBattleStarted) {
        tryDeleteUnit(x, y);
      }
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
    // Middle click pan
    else if (e.button === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setHoverCoord({ x, y });

    // Handle Pan
    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / cameraRef.current.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / cameraRef.current.zoom;
      cameraRef.current.x -= dx;
      cameraRef.current.y -= dy;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }

    // Handle paint drag unit placement
    if (isPaintingUnitsRef.current && !isBattleStarted && activeUnitType) {
      tryPlaceUnit(x, y);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPaintingUnitsRef.current = false;
    lastPlacedPosRef.current = null;
  };

  // Zoom with wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    cameraRef.current.zoom = Math.max(0.35, Math.min(1.8, cameraRef.current.zoom * zoomFactor));
  };

  // Canvas render & animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new CanvasRenderer(ctx, simulation);
    fitToView();

    let lastTime = performance.now();
    let animationFrameId: number;

    const renderLoop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Update simulation if running
      simulation.update(dt);

      // Render canvas
      if (rendererRef.current && canvas) {
        rendererRef.current.render(
          canvas.width,
          canvas.height,
          cameraRef.current,
          hoverCoord,
          selectedUnit?.id || null,
          activeUnitType,
          activePlacingFaction
        );
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [simulation, activeUnitType, selectedUnit, hoverCoord, activePlacingFaction]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cam = cameraRef.current;
      const panSpeed = 40 / cam.zoom;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') cam.y -= panSpeed;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') cam.y += panSpeed;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') cam.x -= panSpeed;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') cam.x += panSpeed;
      if (e.key === 'f' || e.key === 'F') fitToView();
      if (e.key === '+') cam.zoom = Math.min(1.8, cam.zoom * 1.15);
      if (e.key === '-') cam.zoom = Math.max(0.35, cam.zoom * 0.85);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-zinc-950 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating View Controls (Bottom Left) */}
      <div className="absolute bottom-5 left-5 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 rounded-lg p-1.5 shadow-xl pointer-events-auto">
        <button
          onClick={() => {
            cameraRef.current.zoom = Math.min(1.8, cameraRef.current.zoom * 1.2);
          }}
          className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-base transition-colors"
          title="확대 (Zoom In)"
        >
          +
        </button>
        <button
          onClick={() => {
            cameraRef.current.zoom = Math.max(0.35, cameraRef.current.zoom * 0.83);
          }}
          className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-base transition-colors"
          title="축소 (Zoom Out)"
        >
          -
        </button>
        <button
          onClick={fitToView}
          className="px-2.5 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors"
          title="전장 맞춤 보기 (Fit)"
        >
          전체보기 [F]
        </button>
      </div>

      {/* Deployment Hint Badge (Top Left) */}
      {!isBattleStarted && (
        <div className={`absolute top-20 left-6 bg-zinc-900/95 border rounded-xl px-4 py-2.5 shadow-2xl pointer-events-none max-w-sm ${
          activePlacingFaction === 'red' ? 'border-red-500/50' : 'border-blue-500/50'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
              activePlacingFaction === 'red' ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            <span className={activePlacingFaction === 'red' ? 'text-red-400' : 'text-blue-400'}>
              {activePlacingFaction === 'red' ? '🔴 1P 레드 진영 배치 중' : '🔵 2P 블루 진영 배치 중'}
            </span>
          </div>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            • <b>좌클릭 / 드래그</b>: <span className={activePlacingFaction === 'red' ? 'text-red-400 font-semibold' : 'text-blue-400 font-semibold'}>
              {activePlacingFaction === 'red' ? '빨간색(1P) 진영' : '파란색(2P) 진영'}
            </span>에 선택한 유닛 배치<br />
            • <b>우클릭</b>: 배치된 유닛 삭제 (골드 100% 환불)<br />
            • <b>중앙 노란색 구역</b>: 전투 격돌 구간 (배치 불가)
          </p>
        </div>
      )}
    </div>
  );
};
