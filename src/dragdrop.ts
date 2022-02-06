import { curEditorState } from "./index";
import { Pair } from "./obj/Pair";

export const dragStart = (e : DragEvent) => {
  if(curEditorState == "confirmed") {
    e.preventDefault();
    return;
  } 
  const target = e.target as HTMLElement;
  if(target.classList.contains('vis-cell')) {
    e.preventDefault();
    return;
  }

  e.dataTransfer.setData("text/plain", (target as HTMLImageElement).src);
}

const isValidStartFinish = (cell : HTMLTableCellElement) : boolean => {
  // cannot place start/finish on non-empty tiles
  if(cell.childElementCount > 0) return false;
  if(cell.dataset.passability == null) return false;
  // cannot place start/finish on unpassable tiles
  if(cell.dataset.passability == "1") return false;
  // cannot place start/finish on tiles outside of algo-vis table
  if(cell.parentElement.parentElement.parentElement == null 
  || cell.parentElement.parentElement.parentElement != document.getElementById('algo-vis'))
    return false;
  return true;
};

export const dragOver = (e : DragEvent) => {
  const target = e.target;
  e.preventDefault();
  if(isValidStartFinish(target as HTMLTableCellElement)) {
    e.dataTransfer.dropEffect = "copy";
  } 
  e.preventDefault();
  return;
};

export let startPair : Pair = null;
export let finishPair : Pair = null;

export const dropIcon = (e : DragEvent) => {
  let target = e.target;
  const targetCell : HTMLTableCellElement = target as HTMLTableCellElement;
  if(!isValidStartFinish(targetCell)) return;
  e.preventDefault();

  const iconSrc = e.dataTransfer.getData("text/plain");

  if(iconSrc.includes('flag') && document.getElementById('start-cell') != null) document.getElementById('start-cell').remove();
  if(iconSrc.includes('trophy') && document.getElementById('finish-cell') != null) document.getElementById('finish-cell').remove();

  
  const newImg = document.createElement('img');
  newImg.src = iconSrc;
  newImg.style.width = "80%";
  newImg.style.height = "80%";
  newImg.classList.add('placed-icon');

  const newDiv = document.createElement('div');
  newDiv.style.height = "100%";
  newDiv.style.width = "100%";
  newDiv.classList.add("flex-center");
  newDiv.appendChild(newImg);

  newDiv.id = newImg.src.includes("trophy") ? "finish-cell" : "start-cell";
  const cellRow = targetCell.dataset.row;
  const cellCol = targetCell.dataset.col;

  if(newImg.src.includes("trophy")) {
    finishPair = new Pair(Number(cellRow), Number(cellCol));
  } else {
    startPair = new Pair(Number(cellRow), Number(cellCol));
  }

  targetCell.appendChild(newDiv);
};

export const dropIconInCell = (cell : HTMLTableCellElement, isStart : boolean) => {

  const newImg = document.createElement('img');
  newImg.src = isStart ? "/resources/flag.svg" : "/resources/trophy-fill.svg";
  newImg.style.width = "80%";
  newImg.style.height = "80%";
  newImg.classList.add('placed-icon');

  const newDiv = document.createElement('div');
  newDiv.style.height = "100%";
  newDiv.style.width = "100%";
  newDiv.classList.add("flex-center");
  newDiv.appendChild(newImg);

  newDiv.id = newImg.src.includes("trophy") ? "finish-cell" : "start-cell";
  const cellRow = cell.dataset.row;
  const cellCol = cell.dataset.col;

  if(newImg.src.includes("trophy")) {
    finishPair = new Pair(Number(cellRow), Number(cellCol));
  } else {
    startPair = new Pair(Number(cellRow), Number(cellCol));
  }

  cell.appendChild(newDiv);
};