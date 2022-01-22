import { dragStart } from "./dragdrop";

const algoVis = document.getElementById('algo-vis');
let terrainGrid = null;

type editorState = "editing" | "confirmed";
export let curEditorState : editorState = "editing";
let isMouseDown : boolean = false;

// utility functions
export const make2DArr = (rows : number, cols: number, value : number): Array<Array<number>> =>  {
  let arr : Array<Array<number>> = new Array();
  for(let r = 0; r < rows; r++) {
    let rowArr : Array<number> = new Array();
    for(let c = 0; c < cols; c++) {
      rowArr.push(value);
    }
    arr.push(rowArr);
  }
  return arr;
}

export const colorFromPassability = (pass : number) : number => {
  return 255 * (1.1 - pass);
}

const updatePassabilityTool = () => {
  const passability : number = getEditorPassability();
  textPassability.textContent = passability.toString();

  const colorScale : number = 255 * (1 - passability);
  const rgbColor : string = `rgb(${colorScale}, ${colorScale}, ${colorScale})`;
  iconPassability.style.backgroundColor = rgbColor;
};

const isEditableElement = (el : HTMLElement) : boolean => {
  if(!el.classList.contains('vis-cell')) return false;
  if(el.childElementCount > 0) return false;
  return true;
};

// preview terrain update on hover
const mouseHoverTerrain = (e : Event) => {
  if(curEditorState == "confirmed") return;
  const cell : HTMLElement = e.target as HTMLElement;
  if(!isEditableElement(cell)) return;
  const passability : number = getEditorPassability();
  const colorScale : number = colorFromPassability(passability);
  const rgbaColor : string = `rgb(${colorScale}, ${colorScale}, ${colorScale}, ${0.9})`;
  cell.style.backgroundColor = rgbaColor;
}

// remove preview color on mouseout
const mouseEndHover = (e : Event) => {
  if(curEditorState == "confirmed") return;
  const cell : HTMLElement = e.target as HTMLElement;
  if(!isEditableElement(cell)) return;
  const passability : number = Number(cell.dataset.passability);
  const colorScale : number = colorFromPassability(passability);
  const rgb : string = `rgb(${colorScale}, ${colorScale}, ${colorScale})`;
  cell.style.backgroundColor = rgb;
}

// set new passability on click
const editorClick = (e : Event) => {
  if(curEditorState == "confirmed") return;
  const cell : HTMLElement = e.target as HTMLElement;
  if(!isEditableElement(cell)) return;
  cell.dataset.passability = getEditorPassability().toString();
  const passability : number = getEditorPassability();
  const colorScale : number = colorFromPassability(passability);
  const rgbColor : string = `rgb(${colorScale}, ${colorScale}, ${colorScale})`;
  cell.style.backgroundColor =  rgbColor;
}

import { dragOver } from "./dragdrop";
import { dropIcon } from "./dragdrop";

// convert 2D array of numbers to grid of containers
export const gridFromArr = (arr : Array<Array<number>>) => {
  let table = document.createElement('table');
  table.id = "vis-table";
  table.draggable = false;
  for(let row = 0; row < arr.length; row++) {
    const tableWidth : number = parseFloat(window.getComputedStyle(algoVis).width.slice(0, -2));
    const cellSize : number = tableWidth / arr.length;
    const tableRow = document.createElement('tr');
    console.log(tableWidth);
    tableRow.draggable = false;
    for(let col = 0; col < arr[0].length; col++) {
      const cell = document.createElement('td');
      cell.id = `cell-${row}${col}`;

      // scale cell size to fill container
      cell.style.width = cellSize.toString() + "px";
      cell.style.height = cellSize.toString() + "px";

      cell.classList.add('vis-cell');

      // passability proportional to darker gray color
      const colorScale : number = colorFromPassability(arr[row][col]);
      const rgbColor : string = `rgb(${colorScale}, ${colorScale}, ${colorScale})`;
      cell.style.backgroundColor = rgbColor;

      // store passability in cell dataset
      cell.dataset.passability = arr[row][col].toString();
      cell.draggable = false;

      // add hover events
      cell.addEventListener('mouseenter', (e) => {
        if(isMouseDown) editorClick(e);
        else mouseHoverTerrain(e);
      });
      cell.addEventListener('mouseout', mouseEndHover);
      cell.addEventListener('mousedown', editorClick);

      cell.addEventListener('dragstart', dragStart);
      cell.addEventListener('dragover', dragOver);
      cell.addEventListener('drop', dropIcon);

      tableRow.appendChild(cell);
    }
    table.appendChild(tableRow);
  }

  return table;
};

export const getCurGrid = (table : HTMLElement) : Array<Array<number>> => {
  if(table.childElementCount == 0) return null;
  let arr : Array<Array<number>> = new Array();
  for(let row = 0; row < table.childElementCount; row++) {
    let arrRow : Array<number> = new Array();
    for(let col = 0; col < table.children[row].childElementCount; col++) {
      const cell : HTMLElement = table.children[row].children[col] as HTMLElement;
      arrRow.push(Number(cell.dataset.passability));
    }
    arr.push(arrRow);
  }
  return arr;
};

const updateGridSize = () => {
  const size : string = sizeRange.value;
  sizeTextDisplay.textContent = `${size} x ${size}`;
  const newArr = gridFromArr(make2DArr(parseInt(size), parseInt(size), 0.1));
  document.getElementById('algo-vis').innerHTML = "";
  document.getElementById('algo-vis').appendChild(newArr);
};

const clearBtn = document.getElementById('clear-map-btn');
clearBtn.addEventListener('click', () => {
  if(confirm("Are you sure you want to clear the terrain map?")) updateGridSize();
});


const confirmBtn = document.getElementById('confirm-map-btn');
confirmBtn.addEventListener('click', (e) => {
  e.preventDefault();
  confirmSaveGrid();
})

const editBtn = document.getElementById('edit-map-btn');
editBtn.addEventListener('click', (e) => {
  e.preventDefault();
  enableEditGrid();
});

const confirmSaveGrid = () => {
  // save terrain to global var
  if(algoVis.childElementCount == 0) return;
  const arr : Array<Array<number>> = getCurGrid(algoVis.children[0] as HTMLElement);
  terrainGrid = arr;

  // disable editing
  curEditorState = "confirmed";
  algoVis.classList.remove('editable');
  algoVis.classList.add('not-editable');
  confirmBtn.style.display = "none";
  editBtn.style.display = "";
}

const enableEditGrid = () => {
  // enable editing
  curEditorState = "editing";
  algoVis.classList.remove('not-editable');
  algoVis.classList.add('editable');
  confirmBtn.style.display = "";
  editBtn.style.display = "none";
};

// Track mouse state
document.onmousedown = () => {isMouseDown = true;};
document.onmouseup = () => {isMouseDown = false;};
document.ondragstart  = (e) => {
  // if(typeof(e.target) == HTMLTableCellElement.toString()) e.preventDefault();
  // isMouseDown = true;
};
document.ondragend  = () => {isMouseDown = false;};

// terrain editor controls
const passabilitySlider = document.getElementById('passability-slider') as HTMLInputElement;
const getEditorPassability = (): number => {return Number(passabilitySlider.value);};
const iconPassability = document.getElementById('passability-icon');
const textPassability = document.getElementById('passability-text-display');
passabilitySlider.addEventListener('input', updatePassabilityTool);
updatePassabilityTool();

// Grid size editor control
// stop form submit (page reload)
document.getElementById('vis-settings').addEventListener('submit', (e) => {e.preventDefault();});
const sizeRange = document.getElementById('dimensions-slider') as HTMLInputElement;
sizeRange.addEventListener('input', updateGridSize);
const sizeTextDisplay = document.getElementById('grid-size-counter');

// add drag and drop from start/finish icons
const startIconDrag = document.getElementById('start-icon');
startIconDrag.addEventListener('dragstart', dragStart);

const finishIconDrag = document.getElementById('finish-icon');
finishIconDrag.addEventListener('dragstart', dragStart);

// set up intial grid
enableEditGrid();
window.onload = () => {
  updateGridSize();
} 