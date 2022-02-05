import { startPair } from "../dragdrop";
import { Pair } from "./Pair";
import { PathNode, copyNodeArray } from "./PathNode";
import { colorFromPassability } from "..";

export class PathState {
  openNodes : Array<PathNode>;
  closedNodes : Array<PathNode>;
  result : Array<PathNode>;

  constructor(open : Array<PathNode>, closed : Array<PathNode>) {
    this.openNodes = open;
    this.closedNodes = closed;
    this.result = null;
  }

  nodeSets : Array<Array<PathNode>>;
  setColors : Array<string>;

  draw = (table : HTMLTableElement, start : Pair, goal : Pair) => {
    this.nodeSets = [this.openNodes, this.closedNodes, this.result];
    this.setColors = ["#FF3C3C", "#FFFC3C", "#3C98FF"];

    // clear all unnecessary nodes
    const allCoords = this.allNodeCoordArr();
    for(let row = 0; row < table.childElementCount; row++) {
      for(let col = 0; col < table.children[row].childElementCount; col++) {
        if(new Pair(row, col).equals(start) || new Pair(row, col).equals(goal)) continue;
        if(allCoords.filter(c => c.x == row && c.y == col).length == 0) {
          const cell = table.children[row].children[col] as HTMLTableCellElement;
          cell.innerHTML = "";
          const passability : number = Number(cell.dataset.passability);
          const colorScale : number = colorFromPassability(passability);
          const rgb : string = `rgb(${colorScale}, ${colorScale}, ${colorScale})`;
          cell.style.backgroundColor = rgb;
        }
      }
    }

    // draw nodes on table
    for(let i = 0; i < this.nodeSets.length; i++) {
      const set : Array<PathNode> = this.nodeSets[i];
      if(set == null) continue;

      const color = this.setColors[i];

      for(let j = 0; j < set.length; j++) {
        const node : PathNode = set[j];
        // do not draw over start/end
        if(node.coord.equals(start) || node.coord.equals(goal)) continue;
        const cell = cellFromInd(table, node.coord.x, node.coord.y);
        cell.style.backgroundColor = color;

        cell.innerHTML = "";
        const newdiv = document.createElement('div');
        newdiv.classList.add('flex-center');
        newdiv.textContent = (node.distFromStart.toPrecision(2)).toString();
        cell.appendChild(newdiv);
      }
    }
    document.getElementById('cells-searched').textContent = (this.openNodes.length + this.closedNodes.length).toString();
  }

  allNodeCoordArr = () : Array<Pair> => {
    let arr : Array<Pair> = [];
    for(let i = 0; i < this.nodeSets.length; i++) {
      const set : Array<PathNode> = this.nodeSets[i];
      if(set == null) continue;
      for(let j = 0; j < set.length; j++) {
        const node = set[j];
        if(!arr.includes(node.coord)) arr.push(node.coord);
      }
    }
    return arr;
  };

  copy = () : PathState => {
    let stateCopy = new PathState(copyNodeArray(this.openNodes), copyNodeArray(this.closedNodes));
    stateCopy.result = this.result == null ? null : copyNodeArray(this.result);
    return stateCopy
  }
}

const astarStep = (terrainArr : Array<Array<number>>, state : PathState, goal : Pair, diagonalMovement : boolean) : PathState => {
  let openNodes = state.openNodes;
  let closedNodes = state.closedNodes;

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

  openNodes.splice(ind, 1);
  closedNodes.push(currentNode);

  // found the goal!
  if(currentNode.coord.equals(goal)) {
    // console.log(`goal: (${goal.x}, ${goal.y})`)
    // console.log(`cur: (${currentNode.coord.x}, ${currentNode.coord.y})`);
    // console.log("reached goal!");
    const state = new PathState(openNodes, closedNodes);
    state.result = backtrackMoves(currentNode);
    return state;
  }
  // console.log(`current node (${currentNode.coord.x}, ${currentNode.coord.y})`)

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
      // console.log(`node (${existingNode.coord.x}, ${existingNode.coord.y}) already open, evaluating dist...`)
      if(newNode.distFromStart < existingNode.distFromStart) {
        // console.log((newNode.distFromStart).toString() + "<" + existingNode.distFromStart);
        existingNode.parent = currentNode;
        existingNode.distFromStart = newNode.distFromStart;
      }
    } else {
    openNodes.push(newNode);
    }
  }
  return new PathState(openNodes, closedNodes);
}

const backtrackMoves = (endNode : PathNode) : Array<PathNode> => {
  let curNode = endNode;
  let moves : Array<PathNode> = [];
  while(curNode.parent != null) {
    moves.push(curNode);
    curNode = curNode.parent;
  }
  // console.log("moves " + moves.toString());
  // console.log("count: " + moves.length.toString());
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
  // console.log(`${moves.length} valid moves`);
  return moves;
};

const cellFromInd = (table : HTMLTableElement, x : number, y : number) : HTMLTableCellElement => {
  return table.children[x].children[y] as HTMLTableCellElement;
}

export const copyStateArr = (arr : Array<PathState>) : Array<PathState> => {
  let newArr : Array<PathState> = [];
  for(let i = 0; i < arr.length; i++) {
    newArr.push(arr[i].copy());
  }
  return newArr;
};

export { astarStep }