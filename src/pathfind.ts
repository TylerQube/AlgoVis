import { startPair, finishPair, dropIconInCell } from "./dragdrop";
import { getCurGrid } from ".";
import { PathNode, copyNodeArray } from "./obj/PathNode";
import { heuristicMode } from "./obj/PathNode";
import { PathState, astarStep, copyStateArr } from "./obj/PathState";

let visualizerRunning : boolean = false;

const generatePathState = (table : HTMLTableElement, arr : Array<Array<number>>) : Array<PathState> => {

  const diagonalCheckbox = document.getElementById('diagonal-movement-checkbox') as HTMLInputElement;
  // const euclideanCheckbox = document.getElementById("euclidean-checkbox") as HTMLInputElement;
  const canDiagonalMove : boolean = diagonalCheckbox.checked;
  // const euclideanHeuristic : boolean = euclideanCheckbox.checked;
  const heuristicMode : heuristicMode = /*euclideanHeuristic ? "euclidean" :*/ canDiagonalMove ? "diagonal" : "manhattan";
  const startNode = new PathNode(null, startPair.x, startPair.y, 0, heuristicMode);

  let states : Array<PathState> = [];
  // add start state
  let openNodes : Array<PathNode> = [startNode];
  let closedNodes : Array<PathNode> = [];
  states.push(new PathState(openNodes, closedNodes));
  // keep searching until path found or run out of nodes
  while(states[states.length - 1].result == null && states[states.length - 1].openNodes.length > 0) {
    const newState = astarStep(arr, states[states.length - 1].copy(), finishPair, canDiagonalMove);
    states.push(newState);
  }

  return states;
};

import { curEditorState } from ".";

let indState : number = 0;
let states : Array<PathState>;
let drawVisInterval : NodeJS.Timer = null;;
let startTime : number;

const setupSim = () => {
  if(curEditorState != "confirmed" || visualizerRunning) return;
  // generate path or until all nodes explored
  startTime = window.performance.now();
  states = generatePathState(document.getElementById('vis-table') as HTMLTableElement, getCurGrid(document.getElementById('vis-table')));
  const endTime = window.performance.now();

  document.getElementById('comp-time').textContent = ((endTime - startTime) / 1000).toFixed(3).toString() + " seconds";
  indState = 0;
};

const runVisualizer = () => {
  const visTable = document.getElementById('vis-table') as HTMLTableElement;
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;

  const delayMs = (1 - Number(speedSlider.value)) * 1000;
  drawVisInterval = setInterval(() => {
    if(indState > states.length - 1) {
      // finished drawing all states
      clearInterval(drawVisInterval);
      return;
    }

    // draw the current state
    const state = states[indState];
    state.draw(visTable, startPair, finishPair);

    indState++;
  }, delayMs);
};

import { gridFromArr } from ".";

const resetPathfinder = (table : HTMLTableElement) => {
  const newGrid = gridFromArr(getCurGrid(document.getElementById('vis-table')));
  dropIconInCell(newGrid.children[startPair.x].children[startPair.y] as HTMLTableCellElement, true);
  dropIconInCell(newGrid.children[finishPair.x].children[finishPair.y] as HTMLTableCellElement, false);
  document.getElementById('algo-vis').innerHTML = "";
  document.getElementById('algo-vis').appendChild(newGrid);

  if(drawVisInterval != null) clearInterval(drawVisInterval);
  document.getElementById('comp-time').textContent = "";
  document.getElementById('cells-searched').textContent = "";
  states = [];
  indState = 0;
  startTime = null;
};

const pausePathfinder = () => {
  if(drawVisInterval != null) clearInterval(drawVisInterval);
};

const stepPathfinder = (e : MouseEvent) => {
  if(!visualizerRunning || states == null) return;
  const target = e.target as HTMLButtonElement;
  const stepDir : number = target.id == 'step-forward-btn' ? 1 : -1;
  indState = Math.min(states.length - 1, Math.max(0, indState + stepDir));
  states[indState].draw(document.getElementById('vis-table') as HTMLTableElement, startPair, finishPair); 
}

const setupControls = () => {
  const startBtn = document.getElementById('play-btn');
  startBtn.addEventListener('click', () => {
    setupSim();
    visualizerRunning = true;
    runVisualizer();
  });

  const resetBtn = document.getElementById('reset-btn');
  resetBtn.addEventListener('click', () => {
    resetPathfinder(document.getElementById('vis-table') as HTMLTableElement);
    visualizerRunning = false;
  });

  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
  speedSlider.addEventListener('change', () => {
    clearInterval(drawVisInterval);
    runVisualizer();
  });

  const pauseBtn = document.getElementById('pause-btn');
  pauseBtn.addEventListener('click', () => {
    if(drawVisInterval != null) clearInterval(drawVisInterval);
  });

  const forwardBtn = document.getElementById('step-forward-btn');
  const backBtn = document.getElementById('step-back-btn');
  forwardBtn.addEventListener('click', stepPathfinder);
  backBtn.addEventListener('click', stepPathfinder);

};
export { setupControls };