export type heuristicMode = "euclidean" | "manhattan" | "diagonal";
import { Pair } from "./Pair";

export class PathNode {
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
    let dist;
    switch(this.heuristic) {
      case "euclidean":
        dist = Math.sqrt(Math.pow(goalY - this.coord.y, 2) + Math.pow(goalX - this.coord.x, 2));
      case "manhattan":
        dist = dx + dy;
      case "diagonal":
        dist = (dx + dy) - Math.min(dx, dy); 
    }
    return dist;
  }

  getHeuristicSum = (goalX : number, goalY : number) : number => {
    return this.distFromStart + this.getHeuristic(goalX, goalY);
  }

  equals = (other : PathNode) => {
    return this.coord.equals(other.coord);
  }

  copy = () => {
    return new PathNode(this.parent, this.coord.x, this.coord.y, this.passability, this.heuristic);
  }


  static arrayContainsNode(arr : Array<PathNode>, node : PathNode) {
    for(let i = 0; i < arr.length; i++) {
      if(node.equals(arr[i])) return true;
    }
    return false;
  }

  static indexOfNode(arr : Array<PathNode>, node : PathNode) : number {
    for(let i = 0; i < arr.length; i++) {
      if(node.equals(arr[i])) return i;
    }
    return -1;
  }

}

export const copyNodeArray = (arr : Array<PathNode>) : Array<PathNode> => {
  let newArr : Array<PathNode> = [];
  for(let i = 0; i < arr.length; i++) {
    newArr.push(arr[i].copy());
  }
  return newArr;
};