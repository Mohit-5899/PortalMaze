import { Grid, PortalColor, PathNode } from '../types';

// Direction vectors: Up, Right, Down, Left
const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

/**
 * Finds the coordinates of all portals grouped by color.
 */
const findPortals = (grid: Grid) => {
  const portals: Record<string, { x: number; y: number }[]> = {};
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell.type === 'portal' && cell.portalColor) {
        if (!portals[cell.portalColor]) portals[cell.portalColor] = [];
        portals[cell.portalColor].push({ x: cell.x, y: cell.y });
      }
    });
  });
  return portals;
};

/**
 * Finds Start and Goal positions.
 */
const findEndpoints = (grid: Grid) => {
  let start = null;
  let goal = null;
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell.type === 'start') start = { x: cell.x, y: cell.y };
      if (cell.type === 'goal') goal = { x: cell.x, y: cell.y };
    });
  });
  return { start, goal };
};

/**
 * BFS to find the shortest path.
 * State: [y][x][breaksUsed]
 * 
 * We treat "Step Count" as total actions/moves taken.
 * - Move to adjacent cell: 1 step.
 * - Teleport: 1 step (simulates "Press Enter").
 * - Break Wall: 1 step (move into the wall space).
 */
export const solveMaze = (
  grid: Grid,
  maxBreaksAllowed: number
): { steps: number; path: { x: number; y: number }[] } | null => {
  const { start, goal } = findEndpoints(grid);
  if (!start || !goal) return null;

  const portals = findPortals(grid);
  const rows = grid.length;
  const cols = grid[0].length;

  // Visited array: visited[y][x] = minBreaksUsedToReachHere
  // Since we want shortest steps, standard BFS works.
  // However, we can reach the same cell with DIFFERENT break counts.
  // We should only revisit a cell if we arrive there with FEWER breaks used than before,
  // or if we haven't visited it yet.
  // Actually, for BFS step counting: visited[y][x][breaks] is a boolean.
  
  const visited = new Set<string>();
  const queue: PathNode[] = [];

  queue.push({
    x: start.x,
    y: start.y,
    breaksUsed: 0,
    steps: 0,
    path: [{ x: start.x, y: start.y }]
  });
  visited.add(`${start.x},${start.y},0`);

  while (queue.length > 0) {
    // Sort slightly to prioritize exploring closer to goal? No, strictly BFS for optimal steps.
    const current = queue.shift()!;
    const { x, y, breaksUsed, steps, path } = current;

    // Check if reached goal
    if (x === goal.x && y === goal.y) {
      return { steps, path };
    }

    const currentCell = grid[y][x];

    // 1. Try Teleporting (if on portal)
    if (currentCell.type === 'portal' && currentCell.portalColor) {
      const pair = portals[currentCell.portalColor];
      if (pair && pair.length > 1) {
        // Find destinations (can be multiple, though typically pairs)
        pair.forEach((dest) => {
          if (dest.x === x && dest.y === y) return; // Don't teleport to self

          // Teleport action costs 1 step (Interaction)
          // We land on the other portal.
          const visitKey = `${dest.x},${dest.y},${breaksUsed}`;
          if (!visited.has(visitKey)) {
            visited.add(visitKey);
            queue.push({
              x: dest.x,
              y: dest.y,
              breaksUsed: breaksUsed,
              steps: steps + 1,
              path: [...path, { x: dest.x, y: dest.y }]
            });
          }
        });
      }
    }

    // 2. Try Moving / Breaking
    for (const dir of DIRECTIONS) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      // Bounds check
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        const neighbor = grid[ny][nx];
        const isWall = neighbor.type === 'wall';
        
        // Calculate new breaks count
        const newBreaks = isWall ? breaksUsed + 1 : breaksUsed;

        // Can we enter?
        if (newBreaks <= maxBreaksAllowed) {
          const visitKey = `${nx},${ny},${newBreaks}`;
          
          if (!visited.has(visitKey)) {
             visited.add(visitKey);
             queue.push({
               x: nx,
               y: ny,
               breaksUsed: newBreaks,
               steps: steps + 1,
               path: [...path, { x: nx, y: ny }]
             });
          }
        }
      }
    }
  }

  return null;
};
