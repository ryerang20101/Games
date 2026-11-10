/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BattleSimulation } from './game/simulation';
import { BattlefieldCanvas } from './components/BattlefieldCanvas';
import { TopBar } from './components/TopBar';
import { UnitDock } from './components/UnitDock';
import { UnitInfoModal } from './components/UnitInfoModal';
import { GameOverModal } from './components/GameOverModal';
import { MapSelectorModal } from './components/MapSelectorModal';
import { HelpModal } from './components/HelpModal';
import { TitleScreen } from './components/TitleScreen';
import { Faction, GameMode, UnitCategory, UnitInstance } from './types/game';
import { MAPS } from './data/maps';
import { CAMPAIGN_STAGES } from './data/campaign';
import { UNIT_CATEGORIES, UNIT_CONFIGS } from './data/units';
import { sound } from './audio/soundEngine';

export default function App() {
  // Game Screen State
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('campaign');
  const [currentStageId, setCurrentStageId] = useState(1);
  const [currentMapId, setCurrentMapId] = useState('emerald_plains');

  // Simulation Instance
  const currentMap = useMemo(() => MAPS[currentMapId] || MAPS.emerald_plains, [currentMapId]);
  const simRef = useRef<BattleSimulation>(new BattleSimulation(currentMap));
  const sim = simRef.current;

  // Campaign / Sandbox Economy & Deployment
  const [maxBudget, setMaxBudget] = useState(1200);
  const [playerGold, setPlayerGold] = useState(1200);

  // PVP Mode Economy & State
  const [activePvpFaction, setActivePvpFaction] = useState<Faction>('red');
  const [pvpBudget, setPvpBudget] = useState(2500);
  const [redGold, setRedGold] = useState(2500);
  const [blueGold, setBlueGold] = useState(2500);

  const [activeUnitType, setActiveUnitType] = useState<UnitCategory | null>('infantry');
  const [selectedUnit, setSelectedUnit] = useState<UnitInstance | null>(null);

  // Battle State
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);

  // Unit count trackers
  const [redUnitCount, setRedUnitCount] = useState(0);
  const [blueUnitCount, setBlueUnitCount] = useState(0);

  // Outcome modal state
  const [showGameOver, setShowGameOver] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    winner: Faction | null;
    duration: number;
    redKills: number;
    blueKills: number;
    redSurviving: number;
    blueSurviving: number;
    redDamage: number;
    blueDamage: number;
    mvp: UnitInstance | null;
  } | null>(null);

  // Modals
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [mapSelectorTab, setMapSelectorTab] = useState<GameMode>('campaign');
  const [showHelp, setShowHelp] = useState(false);

  // Update unit count indicators
  const refreshUnitCounts = () => {
    const red = sim.units.filter((u) => u.faction === 'red' && u.state !== 'dead').length;
    const blue = sim.units.filter((u) => u.faction === 'blue' && u.state !== 'dead').length;
    setRedUnitCount(red);
    setBlueUnitCount(blue);
  };

  // Load Campaign Stage
  const loadStage = (stageId: number) => {
    const stage = CAMPAIGN_STAGES.find((s) => s.id === stageId) || CAMPAIGN_STAGES[0];
    setCurrentStageId(stage.id);
    setCurrentMapId(stage.mapId);
    setMaxBudget(stage.playerBudget);
    setPlayerGold(stage.playerBudget);
    setIsBattleStarted(false);
    setIsPaused(false);
    setShowGameOver(false);
    setSelectedUnit(null);

    // Re-initialize map in simulation
    const map = MAPS[stage.mapId] || MAPS.emerald_plains;
    sim.setMap(map);
    sim.units = [];
    sim.resetStats();

    // Spawn CPU Blue units as defined in stage
    for (const cpuU of stage.cpuUnits) {
      const config = UNIT_CONFIGS[cpuU.type];
      sim.units.push({
        id: 'blue_' + Math.random().toString(36).substring(2, 9),
        type: cpuU.type,
        faction: 'blue',
        x: cpuU.x,
        y: cpuU.y,
        vx: 0,
        vy: 0,
        angle: Math.PI,
        targetAngle: Math.PI,
        hp: config.maxHp,
        maxHp: config.maxHp,
        state: 'idle',
        targetId: null,
        lastAttackTime: 0,
        cooldownTimer: Math.random() * 0.4,
        kills: 0,
        damageDealt: 0,
        separationX: 0,
        separationY: 0,
      });
    }

    refreshUnitCounts();
  };

  // Load Sandbox Game
  const loadSandbox = (mapId: string, aiPreset: string, budget: number) => {
    setGameMode('sandbox');
    setCurrentMapId(mapId);
    setMaxBudget(budget);
    setPlayerGold(budget);
    setIsBattleStarted(false);
    setIsPaused(false);
    setShowGameOver(false);
    setSelectedUnit(null);

    const map = MAPS[mapId] || MAPS.emerald_plains;
    sim.setMap(map);
    sim.units = [];
    sim.resetStats();

    // Spawn CPU Blue units according to chosen preset
    spawnSandboxEnemyArmy(aiPreset);
    refreshUnitCounts();
  };

  // Load PVP Game
  const loadPvp = (mapId: string, budget: number) => {
    setGameMode('pvp');
    setCurrentMapId(mapId);
    setPvpBudget(budget);
    setMaxBudget(budget);
    setRedGold(budget);
    setBlueGold(budget);
    setActivePvpFaction('red');
    setIsBattleStarted(false);
    setIsPaused(false);
    setShowGameOver(false);
    setSelectedUnit(null);

    const map = MAPS[mapId] || MAPS.emerald_plains;
    sim.setMap(map);
    sim.units = [];
    sim.resetStats();
    refreshUnitCounts();
  };

  // Generate CPU Blue Army for Sandbox
  const spawnSandboxEnemyArmy = (preset: string) => {
    const spawnX = (offset: number) => 1500 + offset;
    const addBlue = (type: UnitCategory, x: number, y: number) => {
      const config = UNIT_CONFIGS[type];
      sim.units.push({
        id: 'blue_' + Math.random().toString(36).substring(2, 9),
        type,
        faction: 'blue',
        x,
        y,
        vx: 0,
        vy: 0,
        angle: Math.PI,
        targetAngle: Math.PI,
        hp: config.maxHp,
        maxHp: config.maxHp,
        state: 'idle',
        targetId: null,
        lastAttackTime: 0,
        cooldownTimer: Math.random() * 0.4,
        kills: 0,
        damageDealt: 0,
        separationX: 0,
        separationY: 0,
      });
    };

    if (preset === 'cavalry') {
      // All Cavalry rush
      for (let y = 200; y <= 800; y += 70) {
        addBlue('cavalry', spawnX(0), y);
        addBlue('cavalry', spawnX(80), y + 35);
      }
    } else if (preset === 'ranged') {
      // Heavy artillery, archers, and javelin throwers
      for (let y = 300; y <= 700; y += 80) {
        addBlue('shield', spawnX(0), y);
        addBlue('javelin', spawnX(80), y);
        addBlue('archer', spawnX(160), y);
      }
      addBlue('catapult', spawnX(280), 380);
      addBlue('catapult', spawnX(280), 620);
    } else if (preset === 'shield') {
      // Phalanx iron wall
      for (let y = 250; y <= 750; y += 60) {
        addBlue('shield', spawnX(0), y);
        addBlue('spearman', spawnX(60), y);
      }
      addBlue('priest', spawnX(160), 450);
      addBlue('priest', spawnX(160), 550);
    } else if (preset === 'giant') {
      // Giants & fire mages
      addBlue('giant', spawnX(0), 380);
      addBlue('giant', spawnX(0), 620);
      addBlue('shield', spawnX(50), 500);
      addBlue('mage', spawnX(140), 420);
      addBlue('mage', spawnX(140), 580);
      addBlue('priest', spawnX(200), 500);
    } else if (preset === 'random') {
      // Random army with new units
      const types = UNIT_CATEGORIES;
      for (let i = 0; i < 22; i++) {
        const randType = types[Math.floor(Math.random() * types.length)];
        const rx = 1450 + Math.random() * 380;
        const ry = 180 + Math.random() * 640;
        addBlue(randType, rx, ry);
      }
    } else {
      // Balanced standard army with new units
      for (let y = 320; y <= 680; y += 70) {
        addBlue('shield', spawnX(0), y);
        addBlue('infantry', spawnX(60), y);
        addBlue('javelin', spawnX(120), y);
        addBlue('archer', spawnX(180), y);
      }
      addBlue('cavalry', spawnX(40), 220);
      addBlue('cavalry', spawnX(40), 780);
      addBlue('bomber', spawnX(10), 500);
      addBlue('assassin', spawnX(50), 450);
      addBlue('catapult', spawnX(240), 500);
      addBlue('priest', spawnX(200), 440);
    }
  };

  // Start campaign from Title
  const handleStartCampaign = () => {
    setGameMode('campaign');
    setInGame(true);
    loadStage(1);
  };

  // Start sandbox from Title
  const handleStartSandbox = () => {
    setGameMode('sandbox');
    setInGame(true);
    loadSandbox('emerald_plains', 'balanced', 3000);
  };

  // Start PVP from Title
  const handleStartPvp = () => {
    setGameMode('pvp');
    setInGame(true);
    loadPvp('emerald_plains', 2500);
  };

  // Active placing faction for the current turn
  const activePlacingFaction: Faction = gameMode === 'pvp' ? activePvpFaction : 'red';
  const currentPlacingGold =
    gameMode === 'pvp'
      ? activePvpFaction === 'red'
        ? redGold
        : blueGold
      : playerGold;

  // Gold Management
  const handleDeductGold = (cost: number): boolean => {
    if (gameMode === 'pvp') {
      if (pvpBudget === Infinity) return true;
      if (activePvpFaction === 'red') {
        if (redGold >= cost) {
          setRedGold((prev) => prev - cost);
          return true;
        }
        return false;
      } else {
        if (blueGold >= cost) {
          setBlueGold((prev) => prev - cost);
          return true;
        }
        return false;
      }
    }

    if (maxBudget === Infinity) return true;
    if (playerGold >= cost) {
      setPlayerGold((prev) => prev - cost);
      return true;
    }
    return false;
  };

  const handleRefundGold = (cost: number) => {
    if (gameMode === 'pvp') {
      if (pvpBudget === Infinity) return;
      if (activePvpFaction === 'red') {
        setRedGold((prev) => Math.min(pvpBudget, prev + cost));
      } else {
        setBlueGold((prev) => Math.min(pvpBudget, prev + cost));
      }
      return;
    }

    if (maxBudget === Infinity) return;
    setPlayerGold((prev) => Math.min(maxBudget, prev + cost));
  };

  // Clear Units for active placing faction
  const handleClearUnits = () => {
    if (isBattleStarted) return;
    let refundTotal = 0;
    const targetFaction: Faction = activePlacingFaction;
    const remainingUnits: UnitInstance[] = [];

    for (const u of sim.units) {
      if (u.faction === targetFaction) {
        refundTotal += UNIT_CONFIGS[u.type].cost;
      } else {
        remainingUnits.push(u);
      }
    }

    sim.units = remainingUnits;

    if (gameMode === 'pvp') {
      if (pvpBudget !== Infinity) {
        if (targetFaction === 'red') {
          setRedGold((prev) => Math.min(pvpBudget, prev + refundTotal));
        } else {
          setBlueGold((prev) => Math.min(pvpBudget, prev + refundTotal));
        }
      }
    } else {
      if (maxBudget !== Infinity) {
        setPlayerGold((prev) => Math.min(maxBudget, prev + refundTotal));
      }
    }

    sound.playRemove();
    setSelectedUnit(null);
    refreshUnitCounts();
  };

  // Auto Formations for Current Active Faction
  const handleAutoFormation = (formationType: 'line' | 'wedge' | 'wings') => {
    handleClearUnits();

    const isBlue = activePlacingFaction === 'blue';
    const baseAngle = isBlue ? Math.PI : 0;
    const currentBudget = gameMode === 'pvp' ? (isBlue ? blueGold : redGold) : playerGold;
    let availableBudget = currentBudget;

    const addUnit = (type: UnitCategory, x: number, y: number) => {
      const config = UNIT_CONFIGS[type];
      const maxLimit = gameMode === 'pvp' ? pvpBudget : maxBudget;
      if (maxLimit !== Infinity && availableBudget < config.cost) return;

      if (maxLimit !== Infinity) {
        availableBudget -= config.cost;
        if (gameMode === 'pvp') {
          if (isBlue) setBlueGold((prev) => prev - config.cost);
          else setRedGold((prev) => prev - config.cost);
        } else {
          setPlayerGold((prev) => prev - config.cost);
        }
      }

      // Flip coordinates for blue side if needed
      const actualX = isBlue ? 2000 - x : x;

      sim.units.push({
        id: (isBlue ? 'blue_' : 'red_') + Math.random().toString(36).substring(2, 9),
        type,
        faction: activePlacingFaction,
        x: actualX,
        y,
        vx: 0,
        vy: 0,
        angle: baseAngle,
        targetAngle: baseAngle,
        hp: config.maxHp,
        maxHp: config.maxHp,
        state: 'idle',
        targetId: null,
        lastAttackTime: 0,
        cooldownTimer: Math.random() * 0.4,
        kills: 0,
        damageDealt: 0,
        separationX: 0,
        separationY: 0,
      });
    };

    if (formationType === 'line') {
      // Standard Battle Line with Javelin & Bombers
      for (let y = 300; y <= 700; y += 75) {
        addUnit('shield', 520, y);
        addUnit('infantry', 450, y);
        addUnit('javelin', 390, y);
        addUnit('archer', 330, y);
      }
      addUnit('cavalry', 480, 200);
      addUnit('cavalry', 480, 800);
      addUnit('assassin', 530, 240);
      addUnit('bomber', 540, 500);
      addUnit('catapult', 220, 500);
    } else if (formationType === 'wedge') {
      // V-shaped Wedge Charge
      const centerY = 500;
      addUnit('giant', 560, centerY);
      addUnit('cavalry', 510, centerY - 60);
      addUnit('cavalry', 510, centerY + 60);
      addUnit('bomber', 540, centerY - 25);
      addUnit('bomber', 540, centerY + 25);
      addUnit('infantry', 450, centerY - 120);
      addUnit('infantry', 450, centerY + 120);
      addUnit('javelin', 420, centerY - 60);
      addUnit('javelin', 420, centerY + 60);
      addUnit('archer', 360, centerY - 60);
      addUnit('archer', 360, centerY + 60);
      addUnit('assassin', 490, centerY - 150);
      addUnit('spearman', 400, centerY - 180);
      addUnit('spearman', 400, centerY + 180);
      addUnit('priest', 300, centerY);
    } else if (formationType === 'wings') {
      // Crescent Enveloping Wings
      for (let y = 220; y <= 780; y += 80) {
        const offset = Math.abs(y - 500) * 0.4;
        addUnit('shield', 520 - offset, y);
        addUnit('javelin', 460 - offset, y);
        addUnit('archer', 400 - offset, y);
      }
      addUnit('cavalry', 580, 180);
      addUnit('cavalry', 580, 820);
      addUnit('assassin', 550, 190);
      addUnit('assassin', 550, 810);
      addUnit('catapult', 240, 500);
    }

    sound.playPlacement();
    refreshUnitCounts();
  };

  // Random Deploy for Active Faction
  const handleRandomDeploy = () => {
    handleClearUnits();
    const candidateTypes: UnitCategory[] = UNIT_CATEGORIES;
    const isBlue = activePlacingFaction === 'blue';
    const baseAngle = isBlue ? Math.PI : 0;
    const maxLimit = gameMode === 'pvp' ? pvpBudget : maxBudget;

    let budgetLeft =
      maxLimit === Infinity
        ? 2500
        : gameMode === 'pvp'
        ? (isBlue ? blueGold : redGold)
        : playerGold;
    let placedCount = 0;

    while (budgetLeft > 80 && placedCount < 30) {
      const type = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];
      const cost = UNIT_CONFIGS[type].cost;
      if (cost <= budgetLeft) {
        let rx = 120 + Math.random() * 450;
        if (isBlue) {
          rx = 1430 + Math.random() * 450;
        }
        const ry = 140 + Math.random() * 720;
        const config = UNIT_CONFIGS[type];

        sim.units.push({
          id: (isBlue ? 'blue_' : 'red_') + Math.random().toString(36).substring(2, 9),
          type,
          faction: activePlacingFaction,
          x: rx,
          y: ry,
          vx: 0,
          vy: 0,
          angle: baseAngle,
          targetAngle: baseAngle,
          hp: config.maxHp,
          maxHp: config.maxHp,
          state: 'idle',
          targetId: null,
          lastAttackTime: 0,
          cooldownTimer: Math.random() * 0.4,
          kills: 0,
          damageDealt: 0,
          separationX: 0,
          separationY: 0,
        });

        budgetLeft -= cost;
        placedCount++;
      } else {
        break;
      }
    }

    if (maxLimit !== Infinity) {
      if (gameMode === 'pvp') {
        if (isBlue) setBlueGold(budgetLeft);
        else setRedGold(budgetLeft);
      } else {
        setPlayerGold(budgetLeft);
      }
    }

    sound.playPlacement();
    refreshUnitCounts();
  };

  // Start Battle Simulation
  const handleStartBattle = () => {
    if (gameMode === 'pvp') {
      if (redUnitCount === 0 || blueUnitCount === 0) return;
    } else {
      if (redUnitCount === 0) return;
    }
    setIsBattleStarted(true);
    setIsPaused(false);
    setTimeScale(1);
    sim.timeScale = 1;
    sim.startBattle();
  };

  // Reset Battle / Redeploy
  const handleResetBattle = () => {
    setIsBattleStarted(false);
    setIsPaused(false);
    setShowGameOver(false);

    if (gameMode === 'campaign') {
      loadStage(currentStageId);
    } else if (gameMode === 'sandbox') {
      loadSandbox(currentMapId, 'balanced', maxBudget);
    } else {
      loadPvp(currentMapId, pvpBudget);
    }
  };

  // Speed and Pause controls
  const handleChangeTimeScale = (speed: number) => {
    setTimeScale(speed);
    sim.timeScale = speed;
    if (isPaused) {
      setIsPaused(false);
      sim.resumeBattle();
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      sim.resumeBattle();
    } else {
      setIsPaused(true);
      sim.pauseBattle();
    }
  };

  // Periodic Outcome & Unit Count Check
  useEffect(() => {
    if (!isBattleStarted) return;

    const interval = setInterval(() => {
      refreshUnitCounts();

      // Check if simulation concluded
      if (sim.isOver && !showGameOver) {
        setShowGameOver(true);
        const aliveRed = sim.units.filter((u) => u.faction === 'red' && u.state !== 'dead').length;
        const aliveBlue = sim.units.filter((u) => u.faction === 'blue' && u.state !== 'dead').length;

        setBattleResult({
          winner: sim.winner,
          duration: sim.totalElapsedTime,
          redKills: sim.redKills,
          blueKills: sim.blueKills,
          redSurviving: aliveRed,
          blueSurviving: aliveBlue,
          redDamage: sim.totalRedDamage,
          blueDamage: sim.totalBlueDamage,
          mvp: sim.getMVPUnit(),
        });
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isBattleStarted, showGameOver]);

  // Hotkeys for numbers 1 to 9, 0, -, = (unit selection), Tab (faction toggle in PVP) & Spacebar (start battle)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const canStart = gameMode === 'pvp' ? redUnitCount > 0 && blueUnitCount > 0 : redUnitCount > 0;
        if (!isBattleStarted && canStart) {
          handleStartBattle();
        } else if (isBattleStarted) {
          handleTogglePause();
        }
      }

      if (e.key === 'Tab' && gameMode === 'pvp' && !isBattleStarted) {
        e.preventDefault();
        setActivePvpFaction((prev) => (prev === 'red' ? 'blue' : 'red'));
      }

      if (e.key === 'Escape') {
        if (showGameOver) setShowGameOver(false);
        if (showMapSelector) setShowMapSelector(false);
        if (showHelp) setShowHelp(false);
        if (selectedUnit) setSelectedUnit(null);
      }

      // Unit Hotkeys:
      // '1'..'9' -> 0..8
      // '0' -> 9 (bomber)
      // '-' -> 10 (assassin)
      // '=' -> 11 (giant)
      let unitIdx = -1;
      if (e.key >= '1' && e.key <= '9') {
        unitIdx = parseInt(e.key, 10) - 1;
      } else if (e.key === '0') {
        unitIdx = 9;
      } else if (e.key === '-') {
        unitIdx = 10;
      } else if (e.key === '=') {
        unitIdx = 11;
      }

      if (unitIdx >= 0 && unitIdx < UNIT_CATEGORIES.length) {
        setActiveUnitType(UNIT_CATEGORIES[unitIdx]);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isBattleStarted, redUnitCount, blueUnitCount, isPaused, showGameOver, showMapSelector, showHelp, selectedUnit, gameMode]);

  // If in Title Screen
  if (!inGame) {
    return (
      <TitleScreen
        onStartCampaign={handleStartCampaign}
        onStartSandbox={handleStartSandbox}
        onStartPvp={handleStartPvp}
        onOpenHelp={() => setShowHelp(true)}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 select-none">
      {/* Top Header Navigation */}
      <TopBar
        mapName={currentMap.nameKo}
        gameMode={gameMode}
        currentStageId={currentStageId}
        playerGold={gameMode === 'pvp' ? redGold : playerGold}
        maxBudget={gameMode === 'pvp' ? pvpBudget : maxBudget}
        blueGold={gameMode === 'pvp' ? blueGold : undefined}
        activePlacingFaction={activePlacingFaction}
        redUnitCount={redUnitCount}
        blueUnitCount={blueUnitCount}
        isBattleStarted={isBattleStarted}
        timeScale={timeScale}
        isPaused={isPaused}
        onStartBattle={handleStartBattle}
        onResetBattle={handleResetBattle}
        onChangeTimeScale={handleChangeTimeScale}
        onTogglePause={handleTogglePause}
        onOpenMapSelector={() => {
          setMapSelectorTab(gameMode);
          setShowMapSelector(true);
        }}
        onOpenHelp={() => setShowHelp(true)}
        onReturnToTitle={() => {
          setIsBattleStarted(false);
          setInGame(false);
        }}
      />

      {/* Main 2D Battlefield Canvas */}
      <BattlefieldCanvas
        simulation={sim}
        activeUnitType={activeUnitType}
        playerGold={currentPlacingGold}
        activePlacingFaction={activePlacingFaction}
        onDeductGold={handleDeductGold}
        onRefundGold={handleRefundGold}
        onSelectUnit={setSelectedUnit}
        selectedUnit={selectedUnit}
        isBattleStarted={isBattleStarted}
        onUnitCountChange={refreshUnitCounts}
      />

      {/* Bottom Unit Dock */}
      <UnitDock
        activeUnitType={activeUnitType}
        onSelectUnitType={setActiveUnitType}
        playerGold={currentPlacingGold}
        gameMode={gameMode}
        activePlacingFaction={activePlacingFaction}
        onSwitchPlacingFaction={setActivePvpFaction}
        isBattleStarted={isBattleStarted}
        onClearUnits={handleClearUnits}
        onAutoFormation={handleAutoFormation}
        onRandomDeploy={handleRandomDeploy}
      />

      {/* Unit Inspector Modal */}
      <UnitInfoModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} />

      {/* Game Over / Victory Modal */}
      {showGameOver && battleResult && (
        <GameOverModal
          winner={battleResult.winner}
          durationSeconds={battleResult.duration}
          redKills={battleResult.redKills}
          blueKills={battleResult.blueKills}
          redSurvivingCount={battleResult.redSurviving}
          blueSurvivingCount={battleResult.blueSurviving}
          redTotalDamage={battleResult.redDamage}
          blueTotalDamage={battleResult.blueDamage}
          mvpUnit={battleResult.mvp}
          hasNextStage={gameMode === 'campaign' && currentStageId < CAMPAIGN_STAGES.length}
          gameMode={gameMode}
          onNextStage={() => {
            setShowGameOver(false);
            loadStage(currentStageId + 1);
          }}
          onRetry={handleResetBattle}
          onRedeploy={() => {
            setShowGameOver(false);
            setIsBattleStarted(false);
            refreshUnitCounts();
          }}
        />
      )}

      {/* Map & Stage Selector Modal */}
      {showMapSelector && (
        <MapSelectorModal
          currentMapId={currentMapId}
          currentStageId={currentStageId}
          gameMode={gameMode}
          initialTab={mapSelectorTab}
          onSelectCampaignStage={(stgId) => {
            setGameMode('campaign');
            loadStage(stgId);
          }}
          onSelectSandboxMap={(mapId, preset, budget) => {
            loadSandbox(mapId, preset, budget);
          }}
          onSelectPvpMap={(mapId, budget) => {
            loadPvp(mapId, budget);
          }}
          onClose={() => setShowMapSelector(false)}
        />
      )}

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
