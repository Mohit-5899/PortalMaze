import React, { useState, useEffect } from 'react';
import { Level, Grid, CellType, PortalColor, Cell } from '../types';
import { PORTAL_COLORS, PORTAL_TEXT_COLORS, GRID_SIZE, generateId } from '../constants';
import { solveMaze } from '../utils/pathfinding';
import { generateRandomLevel } from '../utils/mazeGenerator';
import { Save, AlertTriangle, ArrowLeft, Trash2, Eraser, Play, Square, Trophy, DoorOpen, Shuffle } from 'lucide-react';

interface EditorProps {
  onSave: (level: Level) => void;
  onCancel: () => void;
}

type Tool = CellType | 'erase';

const Editor: React.FC<EditorProps> = ({ onSave, onCancel }) => {
  const [gridSize, setGridSize] = useState(GRID_SIZE);
  const [grid, setGrid] = useState<Grid>(() => {
    // Init empty
    const g: Grid = [];
    for(let y=0; y<GRID_SIZE; y++){
      const r: Cell[] = [];
      for(let x=0; x<GRID_SIZE; x++) r.push({x,y, type: 'empty', id: generateId()});
      g.push(r);
    }
    return g;
  });
  
  const [levelName, setLevelName] = useState("New Level");
  const [maxBreaks, setMaxBreaks] = useState(1);
  const [selectedTool, setSelectedTool] = useState<Tool>('wall');
  const [selectedColor, setSelectedColor] = useState<PortalColor>('blue');
  
  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationStats, setValidationStats] = useState<{std: number, brk: number} | null>(null);

  const handleCellClick = (x: number, y: number) => {
    const newGrid = [...grid];
    const cell = { ...newGrid[y][x] }; // Copy

    if (selectedTool === 'erase') {
      cell.type = 'empty';
      delete cell.portalColor;
    } else {
      // Logic to prevent multiple starts/goals?
      if (selectedTool === 'start') {
        // Clear other starts
        newGrid.forEach(row => row.forEach(c => { if(c.type === 'start') c.type = 'empty'; }));
      }
      if (selectedTool === 'goal') {
        newGrid.forEach(row => row.forEach(c => { if(c.type === 'goal') c.type = 'empty'; }));
      }
      
      cell.type = selectedTool;
      if (selectedTool === 'portal') {
        cell.portalColor = selectedColor;
      } else {
        delete cell.portalColor;
      }
    }
    newGrid[y][x] = cell;
    setGrid(newGrid);
    setValidationStats(null); // Reset validation on edit
    setValidationError(null);
  };

  const generateRandom = () => {
    try {
      const level = generateRandomLevel(maxBreaks);
      setGrid(level.grid);
      setValidationError(null);
    } catch(e) {
      setValidationError("Failed to generate random map. Try again.");
    }
  };

  const validateAndSave = () => {
    // 1. Check Start/Goal existence
    let start, goal;
    let portals: Record<string, number> = {};
    
    grid.forEach(r => r.forEach(c => {
      if(c.type === 'start') start = c;
      if(c.type === 'goal') goal = c;
      if(c.type === 'portal' && c.portalColor) {
        portals[c.portalColor] = (portals[c.portalColor] || 0) + 1;
      }
    }));

    if (!start) { setValidationError("Missing START point."); return; }
    if (!goal) { setValidationError("Missing GOAL point."); return; }

    // 2. Check Portals (must come in pairs or more)
    for(const [col, count] of Object.entries(portals)) {
      if (count < 2) { setValidationError(`${col.toUpperCase()} portal has no pair.`); return; }
    }

    // 3. Solve for Solvability
    const noBreakSol = solveMaze(grid, 0);
    const breakSol = solveMaze(grid, maxBreaks);

    if (!noBreakSol && !breakSol) {
      setValidationError("Level is impossible to complete in either mode.");
      return;
    }

    // Success
    const newLevel: Level = {
      id: generateId(),
      name: levelName || "Untitled",
      grid,
      maxBreaks,
      optimalStepsNoBreak: noBreakSol ? noBreakSol.steps : null,
      optimalStepsWithBreak: breakSol ? breakSol.steps : null,
      createdAt: Date.now()
    };
    
    onSave(newLevel);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 p-4">
      
      <div className="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-slate-400 hover:text-white"><ArrowLeft /></button>
          <h1 className="text-xl font-bold">Map Editor</h1>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={generateRandom}
             className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded font-semibold transition"
          >
             <Shuffle className="w-4 h-4" /> Randomize
          </button>
          <button 
            onClick={validateAndSave} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold transition"
          >
            <Save className="w-4 h-4" /> Save & Publish
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full flex-grow">
        
        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-6 bg-slate-800 p-6 rounded-lg shadow-xl h-fit">
          
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-1">Level Name</label>
            <input 
              type="text" 
              value={levelName} 
              onChange={e => setLevelName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-1">Max Wall Breaks (K)</label>
            <input 
              type="number" 
              min={0}
              max={10}
              value={maxBreaks} 
              onChange={e => setMaxBreaks(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-bold text-slate-300 mb-3">Tools</h3>
            <div className="grid grid-cols-3 gap-2">
               <button onClick={() => setSelectedTool('start')} className={`p-3 rounded flex flex-col items-center gap-1 ${selectedTool === 'start' ? 'bg-emerald-900/50 border border-emerald-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
                 <Play className="w-5 h-5 text-emerald-500" /> <span className="text-xs">Start</span>
               </button>
               <button onClick={() => setSelectedTool('goal')} className={`p-3 rounded flex flex-col items-center gap-1 ${selectedTool === 'goal' ? 'bg-yellow-900/50 border border-yellow-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
                 <Trophy className="w-5 h-5 text-yellow-500" /> <span className="text-xs">Goal</span>
               </button>
               <button onClick={() => setSelectedTool('wall')} className={`p-3 rounded flex flex-col items-center gap-1 ${selectedTool === 'wall' ? 'bg-slate-900 border border-slate-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                 <Square className="w-5 h-5 fill-slate-400 text-slate-400" /> <span className="text-xs">Wall</span>
               </button>
               <button onClick={() => setSelectedTool('portal')} className={`p-3 rounded flex flex-col items-center gap-1 ${selectedTool === 'portal' ? 'bg-blue-900/50 border border-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
                 <DoorOpen className="w-5 h-5 text-blue-400" /> <span className="text-xs">Portal</span>
               </button>
               <button onClick={() => setSelectedTool('erase')} className={`p-3 rounded flex flex-col items-center gap-1 ${selectedTool === 'erase' ? 'bg-red-900/50 border border-red-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
                 <Eraser className="w-5 h-5 text-red-400" /> <span className="text-xs">Erase</span>
               </button>
            </div>
          </div>

          {selectedTool === 'portal' && (
             <div className="border-t border-slate-700 pt-4">
               <h3 className="text-sm font-bold text-slate-300 mb-3">Portal Color</h3>
               <div className="flex gap-3">
                 {(Object.keys(PORTAL_COLORS) as PortalColor[]).map(color => (
                   <button 
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full ${PORTAL_COLORS[color]} ${selectedColor === color ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                   />
                 ))}
               </div>
             </div>
          )}

          {validationError && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded flex items-start gap-2 text-red-200 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Grid Canvas */}
        <div className="flex-grow flex items-center justify-center bg-slate-950 rounded-lg shadow-inner overflow-auto p-4 border border-slate-800">
           <div 
             className="grid gap-1 bg-slate-900 p-1 rounded"
             style={{ 
               gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
             }}
           >
             {grid.map((row, y) => row.map((cell, x) => (
                <div 
                  key={cell.id}
                  onClick={() => handleCellClick(x, y)}
                  className={`
                    w-12 h-12 border border-slate-800/50 rounded cursor-pointer transition-colors relative flex items-center justify-center
                    ${cell.type === 'wall' ? 'bg-slate-700' : 'hover:bg-slate-800'}
                    ${cell.type === 'start' ? 'bg-emerald-900/30 border-emerald-500/50' : ''}
                    ${cell.type === 'goal' ? 'bg-yellow-900/30 border-yellow-500/50' : ''}
                    ${cell.type === 'portal' ? `${PORTAL_COLORS[cell.portalColor || 'blue']} bg-opacity-20` : ''}
                  `}
                >
                  {cell.type === 'start' && <Play className="w-4 h-4 text-emerald-500" />}
                  {cell.type === 'goal' && <Trophy className="w-4 h-4 text-yellow-500" />}
                  {cell.type === 'portal' && <DoorOpen className={`w-4 h-4 ${PORTAL_TEXT_COLORS[cell.portalColor || 'blue']}`} />}
                </div>
             )))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Editor;