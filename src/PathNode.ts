type heuristicMode = "euclidean" | "manhattan" | "diagonal";

class PathNode {
  parent : PathNode;
  coord: Pair;
  passability : number;
  heuristic : heuristicMode;

  distFromStart : number;

  constructor(parent : PathNode, x : number, y : number, passability : number, heuristic : heuristicMode) {
    this.parent = parent;
    this.coord = new Pair(x, y);
    this.passability = passability;
    this.heuristic = heuristic;

    this.distFromStart = this.parent != null ? parent.distFromStart + this.passability : 0;
  }

  getHeuristic = (goalX : number, goalY : number) : number => {
    const dx = Math.abs(goalX - this.coord.x);
    const dy = Math.abs(goalY - this.coord.y);
    switch(this.heuristic) {
      case "euclidean":
        return Math.sqrt(Math.pow(goalY - this.coord.y, 2) + Math.pow(goalX - this.coord.x, 2));
      case "manhattan":
        return dx + dy;
      case "diagonal":
        return (dx + dy) - Math.min(dx, dy); 
    }
  }

  getHeuristicSum = (goalX : number, goalY : number) : number => {
    return this.distFromStart + this.getHeuristic(goalX, goalY);
  }

  equals = (other : PathNode) => {
    return this.coord.equals(other.coord) && this.passability == other.passability && this.heuristic == other.heuristic;
  }


  static arrayContainsNode(arr : Array<PathNode>, node : PathNode) {
    for(let i = 0; i < arr.length; i++) {
      if(node.equals(arr[i])) return true;
    }
    return false;
  }

}