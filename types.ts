export type CellType = 'empty' | 'wall' | 'start' | 'goal' | 'portal';

export type PortalColor = 'blue' | 'red' | 'green' | 'yellow';

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  portalColor?: PortalColor; // Only if type === 'portal'
  id: string; // Unique ID for key props
}

export type Grid = Cell[][];

export interface Level {
  id: string;
  name: string;
  grid: Grid;
  maxBreaks: number; // K value
  optimalStepsNoBreak: number | null; // Null if impossible
  optimalStepsWithBreak: number | null; // Null if impossible
  createdAt: number;
}

export interface GameState {
  currentLevel: Level | null;
  playerPos: { x: number; y: number };
  movesTaken: number;
  uniqueCellsVisited: Set<string>; // Stored as "x,y" strings
  wallsBroken: number;
  mode: 'no-break' | 'wall-break';
  status: 'playing' | 'won' | 'gameover';
  startTime: number;
  endTime: number | null;
}

export type AppScreen = 'menu' | 'level-select' | 'game' | 'editor';

export interface PathNode {
  x: number;
  y: number;
  breaksUsed: number;
  steps: number;
  path: {x:number, y:number}[];
}