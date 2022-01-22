import { getCurGrid } from './index';

const verifyTerrainMap = () => {
  
};

const runPathfinder = () => {
  // const startNode : PathNode = 
};

// returns updated explored and unexplored nodes or list of moves to goal (if goal found)
const astarStep = (terrainArr : Array<Array<number>>, openNodes : Array<PathNode>, closedNodes : Array<PathNode>, goal : Pair, diagonalMovement : boolean) => {
  const heuristicMode = diagonalMovement ? "diagonal" : "manhattan";
  // pick node with lowest heuristic
    let currentNode = openNodes[0]; 
    let ind = 0; 
    for(let i = 0; i < openNodes.length; i++) {
      if(openNodes[i].getHeuristicSum(goal.x, goal.y) < currentNode.getHeuristic(goal.x, goal.y)) {
        currentNode = openNodes[i];
        ind = i;
      } 
    }

    openNodes.slice(ind, 1);
    closedNodes.push(currentNode);

    // found the goal!
    if(currentNode.coord.equals(goal)) {
      return backtrackMoves(currentNode);
    }

    const newMoves : Array<Pair> = findValidMoves(terrainArr, currentNode.coord, diagonalMovement);
    for(let ind = 0; ind < newMoves.length; ind++) {
      const coord : Pair = newMoves[ind];
      const newNode = new PathNode(currentNode, coord.x, coord.y, terrainArr[coord.x][coord.y], heuristicMode);

      if(PathNode.arrayContainsNode(openNodes, newNode) || PathNode.arrayContainsNode(closedNodes, newNode)) {
        continue;
      }

      openNodes.push(newNode);
    }
  return [openNodes, closedNodes];
}

const backtrackMoves = (endNode : PathNode) : Array<Pair> => {
  let curNode = endNode;
  let moves : Array<Pair> = [];
  while(curNode.parent != null) {
    moves.push(curNode.coord);
    curNode = curNode.parent;
  }
  return moves.reverse();
}

const findValidMoves = (arr : Array<Array<number>>, coord : Pair, canDiagonal : boolean) : Array<Pair> => {
  let moves : Array<Pair> = [];

  for(let x = -1; x <= 1; x++) {
    for(let y = -1; y <= 1; y++) {
      if(x == 0 && y == 0) continue; // skip same square
      if(x < 0 || y < 0 || x > arr.length - 1 || y > arr.length - 1) continue; // ignore moves off of map
      if(!canDiagonal && Math.abs(x) == Math.abs(y)) continue; // skip corners if diagonal movement disabled
      if(arr[x][y] == 1) continue; // 1 is impassible
      moves.push(new Pair(x, y));
    }
  }
  return moves;
};