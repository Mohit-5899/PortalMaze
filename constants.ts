import { Level, Grid, Cell } from './types';
import { v4 as uuidv4 } from 'uuid'; // Assumption: We will simulate uuid or use a simple random string generator since no external packages

export const GRID_SIZE = 10; // Default size for new maps

export const PORTAL_COLORS: Record<string, string> = {
  blue: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]',
  red: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]',
  green: 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]',
  yellow: 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]',
};

export const PORTAL_TEXT_COLORS: Record<string, string> = {
  blue: 'text-blue-500',
  red: 'text-red-500',
  green: 'text-green-500',
  yellow: 'text-yellow-400',
};

// Simple ID generator
export const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyGrid = (rows: number, cols: number): Grid => {
  const grid: Grid = [];
  for (let y = 0; y < rows; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({ x, y, type: 'empty', id: generateId() });
    }
    grid.push(row);
  }
  return grid;
};

// Initial Demo Level
const demoGrid = createEmptyGrid(8, 8);
// Walls
[[1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [6, 1], [6, 2], [5, 1]].forEach(([y, x]) => {
  demoGrid[y][x].type = 'wall';
});
// Portals
demoGrid[3][1].type = 'portal'; demoGrid[3][1].portalColor = 'blue';
demoGrid[0][7].type = 'portal'; demoGrid[0][7].portalColor = 'blue';
demoGrid[6][2].type = 'portal'; demoGrid[6][2].portalColor = 'red';
demoGrid[4][6].type = 'portal'; demoGrid[4][6].portalColor = 'red';
// Start/Goal
demoGrid[0][0].type = 'start';
demoGrid[7][7].type = 'goal';

export const DEMO_LEVEL: Level = {
  id: 'demo-1',
  name: 'Tutorial Sector',
  grid: demoGrid,
  maxBreaks: 1,
  optimalStepsNoBreak: 24, // Pre-calculated or recalculated on load
  optimalStepsWithBreak: 12,
  createdAt: Date.now(),
};