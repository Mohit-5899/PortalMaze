import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppScreen, Level } from './types';
import { DEMO_LEVEL } from './constants';
import { generateRandomLevel } from './utils/mazeGenerator';
import Game from './components/Game';
import Editor from './components/Editor';
import { Play, PenTool, LayoutGrid, Clock, Trophy, Map, Shuffle } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [levels, setLevels] = useState<Level[]>([DEMO_LEVEL]);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [gameMode, setGameMode] = useState<'no-break' | 'wall-break'>('no-break');
  
  // Results
  const [lastResult, setLastResult] = useState<{steps: number, time: number} | null>(null);

  const startLevel = (level: Level, mode: 'no-break' | 'wall-break') => {
    setActiveLevel(level);
    setGameMode(mode);
    setScreen('game');
    setLastResult(null);
  };

  const generateAndStart = () => {
     const randomLevel = generateRandomLevel(Math.floor(Math.random() * 3) + 1); // 1-3 breaks
     setLevels(prev => [...prev, randomLevel]);
     startLevel(randomLevel, 'no-break');
  };

  const handleGameWin = (score: {steps: number, time: number}) => {
    setLastResult(score);
    // Don't change screen immediately, maybe show a modal within Game, 
    // but for simplicity, we switch to a result summary screen or back to menu?
    // Let's reuse the level select but show a modal on top?
    // Actually, simple state change to a 'won' overlay in Game component works, but here I'll switch to Menu with a success message.
    // Let's keep it simple: Go back to level select and show alert? No, that's bad UX.
    // Let's add a result view state or just handle it in the Level Select.
  };

  const handleEditorSave = (newLevel: Level) => {
    setLevels(prev => [...prev, newLevel]);
    setScreen('menu');
  };

  // -- Render Helpers --

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="space-y-4">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 drop-shadow-2xl">
          PortalMaze
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto">
          Navigate the grid. Master the portals. Break the walls.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
        <button 
          onClick={() => setScreen('level-select')}
          className="group flex-1 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-6 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 flex flex-col items-center gap-3"
        >
          <Play className="w-10 h-10 mb-2 group-hover:text-blue-200" />
          <span className="text-xl font-bold">Play</span>
          <span className="text-xs text-blue-200 uppercase tracking-widest">Select Level</span>
        </button>

        <button 
          onClick={() => setScreen('editor')}
          className="group flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 p-6 rounded-xl shadow-lg border border-slate-700 transition-all transform hover:scale-105 flex flex-col items-center gap-3"
        >
          <PenTool className="w-10 h-10 mb-2 text-slate-500 group-hover:text-white" />
          <span className="text-xl font-bold">Create</span>
          <span className="text-xs text-slate-500 group-hover:text-slate-300 uppercase tracking-widest">Map Editor</span>
        </button>
      </div>

      <div className="text-slate-600 text-sm mt-12">
        v1.1.0 &bull; Built with React & Tailwind
      </div>
    </div>
  );

  const renderLevelSelect = () => (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setScreen('menu')} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeftIcon /> Back to Menu
        </button>
        
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
           <h2 className="text-4xl font-bold text-white">Select Sector</h2>
           <button 
             onClick={generateAndStart}
             className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors"
           >
             <Shuffle className="w-4 h-4" /> Generate Random
           </button>
        </div>

        {/* Results Banner */}
        {lastResult && activeLevel && (
           <div className="mb-8 bg-gradient-to-r from-emerald-900/50 to-slate-900 border border-emerald-500/30 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
             <div>
               <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><Trophy className="w-5 h-5"/> Level Complete!</h3>
               <p className="text-slate-300">You completed <span className="text-white font-semibold">{activeLevel.name}</span> in <span className="text-white">{gameMode === 'wall-break' ? 'Breaker' : 'Standard'} Mode</span>.</p>
             </div>
             <div className="flex gap-6 text-center">
                <div>
                  <div className="text-xs text-slate-400 uppercase">Your Steps</div>
                  <div className="text-2xl font-mono text-white">{lastResult.steps}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase">Optimal</div>
                  <div className="text-2xl font-mono text-emerald-400">
                    {gameMode === 'wall-break' ? activeLevel.optimalStepsWithBreak : activeLevel.optimalStepsNoBreak}
                  </div>
                </div>
             </div>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map(level => (
            <div key={level.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all group shadow-lg">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{level.name}</h3>
                  <Map className="w-5 h-5 text-slate-600" />
                </div>
                
                <div className="space-y-3 mb-6">
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Standard Best</span>
                      <span className="font-mono text-slate-200">{level.optimalStepsNoBreak ?? 'N/A'} steps</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Breaker Best (K={level.maxBreaks})</span>
                      <span className="font-mono text-slate-200">{level.optimalStepsWithBreak ?? 'N/A'} steps</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    disabled={level.optimalStepsNoBreak === null}
                    onClick={() => startLevel(level, 'no-break')}
                    className="bg-slate-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    Standard
                  </button>
                  <button 
                    disabled={level.optimalStepsWithBreak === null}
                    onClick={() => startLevel(level, 'wall-break')}
                    className="bg-slate-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    Breaker
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans selection:bg-blue-500/30">
      {screen === 'menu' && renderMenu()}
      {screen === 'level-select' && renderLevelSelect()}
      {screen === 'editor' && <Editor onSave={handleEditorSave} onCancel={() => setScreen('menu')} />}
      {screen === 'game' && activeLevel && (
        <Game 
          level={activeLevel} 
          mode={gameMode} 
          onExit={() => setScreen('level-select')} 
          onWin={(res) => {
             setScreen('level-select');
             handleGameWin(res);
          }} 
        />
      )}
    </div>
  );
};

// Simple Icon Component for reuse
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

export default App;