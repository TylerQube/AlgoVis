import { startPair, finishPair, dropIconInCell } from "./dragdrop";
import { getCurGrid, confirmSaveGrid, enableEditGrid } from ".";
import { PathNode, copyNodeArray } from "./obj/PathNode";
import { heuristicMode } from "./obj/PathNode";
import { PathState, pathfinderStep, pathfindAlgo } from "./obj/PathState";

let visualizerRunning : boolean = false;

const generatePathState = (table : HTMLTableElement, arr : Array<Array<number>>) : Array<PathState> => {

  const diagonalCheckbox = document.getElementById('diagonal-movement-checkbox') as HTMLInputElement;
  const canDiagonalMove : boolean = diagonalCheckbox.checked;
  const heuristicMode : heuristicMode = /*euclideanHeuristic ? "euclidean" :*/ canDiagonalMove ? "diagonal" : "manhattan";
  const startNode = new PathNode(null, startPair.x, startPair.y, 0, heuristicMode);

  let states : Array<PathState> = [];
  // add start state
  let openNodes : Array<PathNode> = [startNode];
  let closedNodes : Array<PathNode> = [];
  states.push(new PathState(openNodes, closedNodes));

  const algoSelect = document.getElementById('algo-select') as HTMLSelectElement;
  let algoType : pathfindAlgo;
  switch(algoSelect.value) {
    case "astar":
      algoType = "astar";
      break;
    case "dijkstra":
      algoType = "dijkstra"
      break;
    case "greedy":
      algoType = "greedy"
      break;
  }
  // keep searching until path found or run out of nodes
  while(states[states.length - 1].result == null && states[states.length - 1].openNodes.length > 0) {
    const newState = pathfinderStep(algoType, arr, states[states.length - 1].copy(), finishPair, canDiagonalMove);
    states.push(newState);
  }

  return states;
};

import { curEditorState } from ".";

let indState : number = 0;
let states : Array<PathState>;
let drawVisInterval : NodeJS.Timer = null;;
let startTime : number;

let paused : boolean;

const setupSim = () => {
  if(curEditorState != "confirmed" || visualizerRunning) return;
  // generate path or until all nodes explored
  startTime = window.performance.now();
  states = generatePathState(document.getElementById('vis-table') as HTMLTableElement, getCurGrid(document.getElementById('vis-table')));
  const endTime = window.performance.now();

  document.getElementById('comp-time').textContent = ((endTime - startTime) / 1000).toFixed(3).toString() + " seconds";
  document.getElementById('step-count').textContent = `0/${states.length}`;
  indState = 0;

  const stateSlider = document.getElementById('state-slider') as HTMLInputElement;
  stateSlider.disabled = false;
  stateSlider.min = "0";
  stateSlider.max = (states.length - 1).toString();
  stateSlider.step = "1";
  stateSlider.value = "0";
};

const runVisualizer = () => {
  paused = false;
  const visTable = document.getElementById('vis-table') as HTMLTableElement;
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;

  const delayMs = (1 - Number(speedSlider.value)) * 1000;
  drawVisInterval = setInterval(() => {
    // draw the current state
    if(indState + 1 > states.length - 1) {
      // finished drawing all states
      clearInterval(drawVisInterval);
      return;
    }
    setState(indState + 1);

  }, delayMs);
};

const setState = (ind : number) => {
  if(states == null || ind >= states.length) return;
  indState = ind;
  states[indState].draw(document.getElementById('vis-table') as HTMLTableElement, startPair, finishPair);
  
  const stateSlider = document.getElementById('state-slider') as HTMLInputElement;
  stateSlider.value = indState.toString();

  const stepStr = `${indState + 1}/${states.length}`;
  document.getElementById('step-count').textContent = stepStr;
}

import { gridFromArr } from ".";

const resetPathfinder = (table : HTMLTableElement) => {
  const newGrid = gridFromArr(getCurGrid(document.getElementById('vis-table')));
  dropIconInCell(newGrid.children[startPair.x].children[startPair.y] as HTMLTableCellElement, true);
  dropIconInCell(newGrid.children[finishPair.x].children[finishPair.y] as HTMLTableCellElement, false);
  document.getElementById('algo-vis').innerHTML = "";
  document.getElementById('algo-vis').appendChild(newGrid);
  const stateSlider = document.getElementById('state-slider') as HTMLInputElement;
  stateSlider.disabled = true;
  stateSlider.value = "0";

  if(drawVisInterval != null) clearInterval(drawVisInterval);
  document.getElementById('comp-time').textContent = "";
  document.getElementById('cells-searched').textContent = "";
  document.getElementById('step-count').textContent = "";
  states = [];
  indState = 0;
  startTime = null;

  document.getElementById('play-btn').style.display = "";
  document.getElementById('pause-btn').style.display = "none";
};

const stepPathfinder = (e : MouseEvent) => {
  if(!visualizerRunning || states == null) return;
  const target = e.target as HTMLButtonElement;
  const stepDir : number = target.id == 'step-forward-btn' ? 1 : -1;
  setState(Math.min(states.length - 1, Math.max(0, indState + stepDir)));
}

const setupControls = () => {
  const startBtn = document.getElementById('play-btn');
  startBtn.addEventListener('click', () => {
    confirmSaveGrid();
    if(curEditorState != "confirmed") return;
    setupSim();
    startBtn.style.display = "none";
    pauseBtn.style.display = "";
    visualizerRunning = true;
    runVisualizer();
  });

  const resetBtn = document.getElementById('reset-btn');
  resetBtn.addEventListener('click', () => {
    resetPathfinder(document.getElementById('vis-table') as HTMLTableElement);
    visualizerRunning = false;
    enableEditGrid();
  });

  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
  speedSlider.addEventListener('change', () => {
    clearInterval(drawVisInterval);
    if(visualizerRunning) runVisualizer();
  });

  const pauseBtn = document.getElementById('pause-btn');
  pauseBtn.style.display = "none";
  pauseBtn.addEventListener('click', () => {
    if(drawVisInterval != null) {
      clearInterval(drawVisInterval);
      paused = true;
      pauseBtn.style.display = "none";
      startBtn.style.display = "";
    } 
  });

  const forwardBtn = document.getElementById('step-forward-btn');
  const backBtn = document.getElementById('step-back-btn');
  forwardBtn.addEventListener('click', stepPathfinder);
  backBtn.addEventListener('click', stepPathfinder);

  const stateSlider = document.getElementById('state-slider') as HTMLInputElement;
  stateSlider.addEventListener('input', () => {
    if(drawVisInterval != null) clearInterval(drawVisInterval);
    setState(Number(stateSlider.value));
  });

  window.addEventListener('mouseup', (e) => {
    if(visualizerRunning && !paused && document.activeElement.id == "state-slider") runVisualizer();
  })
};
export { setupControls };