import { Grid, Level, Cell } from '../types';
import { generateId, GRID_SIZE } from '../constants';
import { solveMaze } from './pathfinding';

const DIRECTIONS = [
  { dx: 0, dy: -2 },
  { dx: 0, dy: 2 },
  { dx: -2, dy: 0 },
  { dx: 2, dy: 0 }
];

export const generateRandomLevel = (maxBreaks: number = 1): Level => {
  let grid: Grid = [];
  let attempts = 0;

  // Try up to 20 times to generate a valid interesting maze
  while(attempts < 20) {
      attempts++;
      
      // 1. Init with Walls
      grid = Array(GRID_SIZE).fill(null).map((_, y) => 
        Array(GRID_SIZE).fill(null).map((_, x) => ({
          x, y, type: 'wall', id: generateId()
        }))
      );

      // 2. Recursive Backtracking to carve path
      // Start at 1,1 to ensure walls on borders usually
      const startX = 1; 
      const startY = 1;
      
      grid[startY][startX].type = 'empty';
      
      const stack = [{x: startX, y: startY}];
      const visited = new Set([`${startX},${startY}`]);

      while(stack.length > 0) {
        const current = stack[stack.length - 1];
        const {x, y} = current;
        
        // Find unvisited neighbors (distance 2)
        const neighbors = [];
        for(const d of DIRECTIONS) {
            const nx = x + d.dx;
            const ny = y + d.dy;
            if(nx > 0 && nx < GRID_SIZE - 1 && ny > 0 && ny < GRID_SIZE - 1) {
                if(!visited.has(`${nx},${ny}`)) {
                    neighbors.push({nx, ny, dx: d.dx/2, dy: d.dy/2});
                }
            }
        }

        if(neighbors.length > 0) {
            const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
            // Knock down wall between
            grid[y + chosen.dy][x + chosen.dx].type = 'empty';
            // Mark neighbor as visited/empty
            grid[chosen.ny][chosen.nx].type = 'empty';
            visited.add(`${chosen.nx},${chosen.ny}`);
            stack.push({x: chosen.nx, y: chosen.ny});
        } else {
            stack.pop();
        }
      }

      // 3. Place Start
      grid[startY][startX].type = 'start';
      
      // 4. Place Goal (Find furthest point or random point far away)
      let bestDist = 0;
      let goalPos = {x: 1, y: 1};

      // Simple BFS to find distances from start
      const dists = new Map<string, number>();
      const q = [{x: startX, y: startY, d: 0}];
      dists.set(`${startX},${startY}`, 0);
      
      while(q.length) {
          const curr = q.shift()!;
          if(curr.d > bestDist) {
              bestDist = curr.d;
              goalPos = {x: curr.x, y: curr.y};
          }
          
          const moves = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
          for(const m of moves) {
              const nx = curr.x + m.dx;
              const ny = curr.y + m.dy;
              if(nx >=0 && nx < GRID_SIZE && ny >=0 && ny < GRID_SIZE) {
                  if(grid[ny][nx].type === 'empty' && !dists.has(`${nx},${ny}`)) {
                      dists.set(`${nx},${ny}`, curr.d + 1);
                      q.push({x: nx, y: ny, d: curr.d + 1});
                  }
              }
          }
      }
      grid[goalPos.y][goalPos.x].type = 'goal';

      // 5. Add Portals (1 pair)
      let empties: {x:number, y:number}[] = [];
      for(let y=0; y<GRID_SIZE; y++) {
          for(let x=0; x<GRID_SIZE; x++) {
              if(grid[y][x].type === 'empty') empties.push({x,y});
          }
      }
      
      // Filter out spots too close to start/goal if possible, but random is fine for chaos
      if(empties.length >= 2) {
          empties.sort(() => Math.random() - 0.5);
          const p1 = empties[0];
          const p2 = empties[1];
          grid[p1.y][p1.x].type = 'portal';
          grid[p1.y][p1.x].portalColor = 'blue';
          grid[p2.y][p2.x].type = 'portal';
          grid[p2.y][p2.x].portalColor = 'blue';
      }

      // 6. Add random holes to create loops
      for(let y=1; y<GRID_SIZE-1; y++) {
          for(let x=1; x<GRID_SIZE-1; x++) {
              if(grid[y][x].type === 'wall' && Math.random() < 0.1) {
                   grid[y][x].type = 'empty';
              }
          }
      }

      // 7. Validate
      const solNoBreak = solveMaze(grid, 0);
      const solWithBreak = solveMaze(grid, maxBreaks);

      if(solNoBreak && solWithBreak) {
          return {
              id: generateId(),
              name: `Random Sector ${Math.floor(Math.random() * 900) + 100}`,
              grid,
              maxBreaks,
              optimalStepsNoBreak: solNoBreak.steps,
              optimalStepsWithBreak: solWithBreak.steps,
              createdAt: Date.now()
          };
      }
  }
  
  // Fallback if random gen fails repeatedly (unlikely)
  // Return a simple box
  grid[1][1].type = 'start';
  grid[1][2].type = 'empty';
  grid[1][3].type = 'goal';
  return {
      id: generateId(),
      name: "Fallback Level",
      grid,
      maxBreaks,
      optimalStepsNoBreak: 2,
      optimalStepsWithBreak: 2,
      createdAt: Date.now()
  };
};