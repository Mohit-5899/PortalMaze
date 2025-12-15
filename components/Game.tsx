import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Level, Cell, PortalColor } from '../types';
import { PORTAL_COLORS, PORTAL_TEXT_COLORS } from '../constants';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ShieldAlert, DoorOpen, Footprints, Trophy, RotateCcw, Play } from 'lucide-react';

interface GameProps {
  level: Level;
  mode: 'no-break' | 'wall-break';
  onExit: () => void;
  onWin: (score: { steps: number; time: number }) => void;
}

const Game: React.FC<GameProps> = ({ level, mode, onExit, onWin }) => {
  // Deep copy grid to handle wall breaking state locally
  const [grid, setGrid] = useState<Cell[][]>(() => 
    level.grid.map(row => row.map(cell => ({ ...cell })))
  );

  const [gameState, setGameState] = useState<GameState>(() => {
    // Find Start
    let startPos = { x: 0, y: 0 };
    level.grid.forEach(row => row.forEach(cell => {
      if (cell.type === 'start') startPos = { x: cell.x, y: cell.y };
    }));

    return {
      currentLevel: level,
      playerPos: startPos,
      movesTaken: 0,
      uniqueCellsVisited: new Set([`${startPos.x},${startPos.y}`]),
      wallsBroken: 0,
      mode: mode,
      status: 'playing',
      startTime: Date.now(),
      endTime: null,
    };
  });

  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Focus on mount for key events
  useEffect(() => {
    gameContainerRef.current?.focus();
  }, []);

  const handleWin = useCallback(() => {
    const endTime = Date.now();
    const duration = (endTime - gameState.startTime) / 1000;
    setGameState(prev => ({
      ...prev,
      status: 'won',
      endTime
    }));
    // Small delay to show player on goal
    setTimeout(() => {
      onWin({ steps: gameState.movesTaken, time: duration });
    }, 500);
  }, [gameState.startTime, gameState.movesTaken, onWin]);

  const attemptMove = useCallback((dx: number, dy: number, isBreakAttempt: boolean) => {
    if (gameState.status !== 'playing') return;

    const { x, y } = gameState.playerPos;
    const nx = x + dx;
    const ny = y + dy;

    // Bounds check
    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) return;

    const targetCell = grid[ny][nx];
    const isWall = targetCell.type === 'wall';

    // Wall Logic
    if (isWall) {
      if (!isBreakAttempt) return; // Cannot pass wall without shift
      if (mode === 'no-break') return; // Cannot break in this mode
      if (gameState.wallsBroken >= level.maxBreaks) return; // No breaks left

      // Break the wall
      const newGrid = [...grid];
      newGrid[ny][nx] = { ...targetCell, type: 'empty' }; // Permanent change for this session
      setGrid(newGrid);

      // Move into the broken wall
      setGameState(prev => {
        const newSet = new Set(prev.uniqueCellsVisited);
        newSet.add(`${nx},${ny}`);
        return {
          ...prev,
          playerPos: { x: nx, y: ny },
          movesTaken: prev.movesTaken + 1,
          uniqueCellsVisited: newSet,
          wallsBroken: prev.wallsBroken + 1
        };
      });
      return;
    }

    // Normal Move (Empty, Start, Goal, Portal)
    setGameState(prev => {
      const newSet = new Set(prev.uniqueCellsVisited);
      newSet.add(`${nx},${ny}`);
      const newState = {
        ...prev,
        playerPos: { x: nx, y: ny },
        movesTaken: prev.movesTaken + 1,
        uniqueCellsVisited: newSet,
      };
      
      return newState;
    });

    // Check Win on move complete (if we landed on goal)
    if (targetCell.type === 'goal') {
      // We need to wait for the state update to trigger handleWin, or call it directly.
      // Calling logic after state update in useEffect is safer, but direct call works here if we pass correct data.
      // We'll use a useEffect to watch position for Goal.
    }

  }, [gameState, grid, level.maxBreaks, mode]);

  const attemptTeleport = useCallback(() => {
    if (gameState.status !== 'playing') return;
    const { x, y } = gameState.playerPos;
    const currentCell = grid[y][x];

    if (currentCell.type === 'portal' && currentCell.portalColor) {
      // Find partner
      let partner: Cell | null = null;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const cell = grid[r][c];
          if (cell.type === 'portal' && cell.portalColor === currentCell.portalColor) {
            if (cell.x !== x || cell.y !== y) {
              partner = cell;
              break;
            }
          }
        }
        if (partner) break;
      }

      if (partner) {
        setGameState(prev => {
          const newSet = new Set(prev.uniqueCellsVisited);
          newSet.add(`${partner!.x},${partner!.y}`);
          return {
            ...prev,
            playerPos: { x: partner!.x, y: partner!.y },
            movesTaken: prev.movesTaken + 1, // Teleport costs a move action
            uniqueCellsVisited: newSet
          };
        });
      }
    }
  }, [grid, gameState]);

  // Check for goal reached
  useEffect(() => {
    const { x, y } = gameState.playerPos;
    if (grid[y][x].type === 'goal' && gameState.status === 'playing') {
      handleWin();
    }
  }, [gameState.playerPos, grid, gameState.status, handleWin]);

  // Input Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.status !== 'playing') return;

      const isShift = e.shiftKey;
      
      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          attemptMove(0, -1, isShift);
          break;
        case 's':
        case 'ArrowDown':
          attemptMove(0, 1, isShift);
          break;
        case 'a':
        case 'ArrowLeft':
          attemptMove(-1, 0, isShift);
          break;
        case 'd':
        case 'ArrowRight':
          attemptMove(1, 0, isShift);
          break;
        case 'Enter':
          attemptTeleport();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attemptMove, attemptTeleport, gameState.status]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-sans text-slate-100">
      
      {/* Header Stats */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-slate-700 rounded-full transition-colors" title="Back to Menu">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">{level.name}</h2>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
              <span className={`px-2 py-0.5 rounded ${mode === 'wall-break' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                {mode === 'wall-break' ? 'Breaker Mode' : 'Standard Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-1 text-slate-400 text-sm">
               <Footprints className="w-4 h-4" /> Steps
             </div>
             <span className="text-2xl font-mono font-bold text-white">{gameState.movesTaken}</span>
           </div>
           
           {mode === 'wall-break' && (
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <ShieldAlert className="w-4 h-4" /> Breaks
                </div>
                <span className={`text-2xl font-mono font-bold ${gameState.wallsBroken >= level.maxBreaks ? 'text-red-400' : 'text-emerald-400'}`}>
                  {level.maxBreaks - gameState.wallsBroken}
                </span>
             </div>
           )}
        </div>
      </div>

      {/* Grid Area */}
      <div 
        ref={gameContainerRef}
        className="relative bg-slate-950 p-4 rounded-lg shadow-2xl border-2 border-slate-800 outline-none"
        tabIndex={0}
      >
        <div 
          className="grid gap-1"
          style={{ 
            gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
            width: 'fit-content'
          }}
        >
          {grid.map((row, y) => (
            row.map((cell, x) => {
              const isPlayer = gameState.playerPos.x === x && gameState.playerPos.y === y;
              
              // Styles
              let cellClass = "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded transition-all duration-200 relative ";
              
              if (cell.type === 'wall') cellClass += "bg-slate-700 border border-slate-600 shadow-inner";
              else if (cell.type === 'empty') cellClass += "bg-slate-900/50 border border-slate-800/50";
              else if (cell.type === 'start') cellClass += "bg-emerald-900/30 border border-emerald-700/50";
              else if (cell.type === 'goal') cellClass += "bg-yellow-900/30 border border-yellow-700/50";
              else if (cell.type === 'portal' && cell.portalColor) {
                cellClass += ` ${PORTAL_COLORS[cell.portalColor]} bg-opacity-20 border-2 border-opacity-50`;
              }

              return (
                <div key={cell.id} className={cellClass}>
                  {/* Icons */}
                  {cell.type === 'start' && <Play className="w-5 h-5 text-emerald-500 opacity-50" />}
                  {cell.type === 'goal' && <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />}
                  {cell.type === 'portal' && (
                    <DoorOpen className={`w-6 h-6 ${PORTAL_TEXT_COLORS[cell.portalColor || 'blue']}`} />
                  )}
                  {cell.type === 'wall' && (
                     <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzQxNTUiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjNDc1NTY5Ii8+PC9zdmc+')] opacity-20"></div>
                  )}

                  {/* Player Avatar */}
                  {isPlayer && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-3/4 h-3/4 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)] border-2 border-white animate-bounce-slight flex items-center justify-center">
                         <div className="w-1/2 h-1/2 bg-cyan-900 rounded-full opacity-50"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Controls / Help */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400 text-sm max-w-2xl w-full">
        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
           <div className="flex gap-1">
             <span className="bg-slate-700 px-2 py-1 rounded text-white font-mono">W</span>
             <span className="bg-slate-700 px-2 py-1 rounded text-white font-mono">A</span>
             <span className="bg-slate-700 px-2 py-1 rounded text-white font-mono">S</span>
             <span className="bg-slate-700 px-2 py-1 rounded text-white font-mono">D</span>
           </div>
           <span>Move</span>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
           <span className="bg-slate-700 px-2 py-1 rounded text-white font-mono w-fit">ENTER</span>
           <span>Teleport (Stand on Portal)</span>
        </div>

        {mode === 'wall-break' && (
          <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700 md:col-span-2">
             <div className="flex items-center gap-1">
               <span className="bg-slate-700 px-2 py-1 rounded text-white font-mono text-xs">SHIFT</span>
               <span>+</span>
               <div className="flex gap-1">
                  <span className="bg-slate-700 px-1.5 py-1 rounded text-white font-mono text-xs">WASD</span>
               </div>
             </div>
             <span className="text-purple-300">Break Wall (Costs 1 Break)</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default Game;