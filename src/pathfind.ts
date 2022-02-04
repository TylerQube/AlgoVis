import { startPair, finishPair, dropIconInCell } from "./dragdrop";
import { getCurGrid } from ".";
import { Pair } from "./Pair";
import { PathNode } from "./PathNode";
import { heuristicMode } from "./PathNode";

let visualizerRunning : boolean = false;
let isPaused : boolean = false;

const cellFromInd = (table : HTMLTableElement, x : number, y : number) : HTMLTableCellElement => {
  return table.children[x].children[y] as HTMLTableCellElement;
}

const runPathfinder = async (table : HTMLTableElement, arr : Array<Array<number>>) => {
  if(visualizerRunning) return;
  visualizerRunning = true;
  console.log("running sim")
  const diagonalCheckbox = document.getElementById('diagonal-movement-checkbox') as HTMLInputElement;
  const euclideanCheckbox = document.getElementById("euclidean-checkbox") as HTMLInputElement;
  const canDiagonalMove : boolean = diagonalCheckbox.checked;
  const euclideanHeuristic : boolean = euclideanCheckbox.checked;
  const heuristicMode : heuristicMode = euclideanHeuristic ? "euclidean" : canDiagonalMove ? "diagonal" : "manhattan";
  const startNode = new PathNode(null, startPair.x, startPair.y, 0, heuristicMode);



  let openNodes : Array<PathNode> = [startNode];
  let closedNodes : Array<PathNode> = [];
  let result : Array<PathNode> = null;
  // null means pathfinder not done
  while(result == null) {
    if(!visualizerRunning) return;
    if(isPaused) continue;
    result = astarStep(arr, openNodes, closedNodes, finishPair, canDiagonalMove);
    // color nodes in table
    for(let i = 0; i < openNodes.length; i++) {
      if(openNodes[i].coord.equals(startPair) || openNodes[i].coord.equals(finishPair)) continue;
      const cell = cellFromInd(table, openNodes[i].coord.x, openNodes[i].coord.y);
      cell.style.backgroundColor = "red";

      cell.innerHTML = "";
      const newdiv = document.createElement('div');
      newdiv.classList.add('flex-center');
      newdiv.textContent = (openNodes[i].distFromStart.toPrecision(2)).toString();
      cell.appendChild(newdiv);
    }
    for(let i = 0; i < closedNodes.length; i++) {
      if(closedNodes[i].coord.equals(startPair) || closedNodes[i].coord.equals(finishPair)) continue;

      const cell = cellFromInd(table, closedNodes[i].coord.x, closedNodes[i].coord.y);
      cell.style.backgroundColor = "yellow";
      cell.innerHTML = "";
      const newdiv = document.createElement('div');
      newdiv.classList.add('flex-center');
      newdiv.textContent = (closedNodes[i].distFromStart.toPrecision(2)).toString();
      cell.appendChild(newdiv);
    }
    console.log("tick")
    console.log(result)
    console.log(result == null)
    if(result != null) break;
    const delaySlider = document.getElementById('delay-slider') as HTMLInputElement;
    let delay = 1 -(Number(delaySlider.value) * 1000);
    await sleep(delay);
  } 
  // color final path green
  console.log("drawing path...");
  console.log(result)
  for(let node = 0; node < result.length - 1; node++) {
    const pathNode : PathNode = result[node];
    const cell = cellFromInd(table, pathNode.coord.x, pathNode.coord.y);
    cell.style.backgroundColor = "lime";

    cell.style.color = "white";
    const newdiv = document.createElement('div');
    newdiv.classList.add('flex-center');

    let num : number = Number(pathNode.distFromStart.toPrecision(2));
    if(Number.isInteger(num)) num = Math.round(num);
    newdiv.textContent = num.toString();
    cell.innerHTML = "";
    cell.appendChild(newdiv);
  }
};

function sleep(ms : number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// returns updated explored and unexplored nodes or list of moves to goal (if goal found)
const astarStep = (terrainArr : Array<Array<number>>, openNodes : Array<PathNode>, closedNodes : Array<PathNode>, goal : Pair, diagonalMovement : boolean) => {
  
  const heuristicMode = diagonalMovement ? "diagonal" : "manhattan";
  // pick node with lowest heuristic
  let currentNode = openNodes[0]; 
  let ind = 0; 
  for(let i = 0; i < openNodes.length; i++) {
    if(openNodes[i].getHeuristicSum(goal.x, goal.y) < currentNode.getHeuristicSum(goal.x, goal.y)) {
      currentNode = openNodes[i];
      ind = i;
    } 
  }

  console.log(`picking node (${openNodes[ind].coord.x}, ${openNodes[ind].coord.y})`)
  // openNodes.slice(0, ind).push(...openNodes.slice(ind, openNodes.length));
  openNodes.splice(ind, 1);
  closedNodes.push(currentNode);

  // found the goal!
  if(currentNode.coord.equals(goal)) {
    console.log(`goal: (${goal.x}, ${goal.y})`)
    console.log(`cur: (${currentNode.coord.x}, ${currentNode.coord.y})`);
    console.log("reached goal!");
    return backtrackMoves(currentNode);
  }
  console.log(`current node (${currentNode.coord.x}, ${currentNode.coord.y})`)

  const newMoves : Array<Pair> = findValidMoves(terrainArr, currentNode.coord, diagonalMovement);
  for(let ind = 0; ind < newMoves.length; ind++) {
    const coord : Pair = newMoves[ind];
    const moveDist : number = Math.abs(coord.x - currentNode.coord.x) == Math.abs(coord.y - currentNode.coord.y)
    ? Math.sqrt(2) : 1;
    const newNode = new PathNode(currentNode, coord.x, coord.y, terrainArr[coord.x][coord.y] + moveDist, heuristicMode);
    
    // skip if already searched
    if(PathNode.arrayContainsNode(closedNodes, newNode)) continue;

    // if open, check if current path is shorter
    if(PathNode.arrayContainsNode(openNodes, newNode)) {
      const existingNode : PathNode = openNodes[PathNode.indexOfNode(openNodes, newNode)];
      console.log(`node (${existingNode.coord.x}, ${existingNode.coord.y}) already open, evaluating dist...`)
      if(newNode.distFromStart < existingNode.distFromStart) {
        console.log((newNode.distFromStart).toString() + "<" + existingNode.distFromStart);
        existingNode.parent = currentNode;
        existingNode.distFromStart = newNode.distFromStart;
      }
    } else {
    openNodes.push(newNode);
    }
  }
  return null;
}

const backtrackMoves = (endNode : PathNode) : Array<PathNode> => {
  let curNode = endNode;
  let moves : Array<PathNode> = [];
  while(curNode.parent != null) {
    moves.push(curNode);
    curNode = curNode.parent;
  }
  console.log("moves " + moves.toString());
  console.log("count: " + moves.length.toString());
  return moves.reverse();
}

const findValidMoves = (arr : Array<Array<number>>, coord : Pair, canDiagonal : boolean) : Array<Pair> => {
  let moves : Array<Pair> = [];

  for(let x = -1; x <= 1; x++) {
    for(let y = -1; y <= 1; y++) {
      if(x == 0 && y == 0) continue; // skip same square
      if(coord.x + x < 0 || coord.y + y < 0 || coord.x + x > arr.length - 1 || coord.y + y > arr.length - 1) continue; // ignore moves off of map
      if(!canDiagonal && Math.abs(x) == Math.abs(y)) continue; // skip corners if diagonal movement disabled
      if(Number(arr[coord.x + x][coord.y + y]) == Number(1)) continue; // 1 is impassible
      moves.push(new Pair(coord.x + x, coord.y + y));
    }
  }
  console.log(`${moves.length} valid moves`);
  return moves;
};

import { curEditorState } from "./index";

const startBtn = document.getElementById('play-btn');
startBtn.addEventListener('click', () => {
  isPaused = false;
  if(curEditorState == "confirmed" && !visualizerRunning) {
    runPathfinder(document.getElementById('vis-table') as HTMLTableElement, getCurGrid(document.getElementById('vis-table')))
  }
});

import { gridFromArr } from ".";

const resetPathfinder = (table : HTMLTableElement) => {
  const newGrid = gridFromArr(getCurGrid(document.getElementById('vis-table')));
  dropIconInCell(newGrid.children[startPair.x].children[startPair.y] as HTMLTableCellElement, true);
  dropIconInCell(newGrid.children[finishPair.x].children[finishPair.y] as HTMLTableCellElement, false);
  console.log(newGrid);
  document.getElementById('algo-vis').innerHTML = "";
  document.getElementById('algo-vis').appendChild(newGrid);
};

const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
  resetPathfinder(document.getElementById('vis-table') as HTMLTableElement);
  visualizerRunning = false;
});

const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
  isPaused = true;
});