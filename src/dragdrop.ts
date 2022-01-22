import { curEditorState } from "./index";
console.log("test");

let startLoc : Pair = null;
let finishLoc : Pair = null;

export const dragStart = (e : DragEvent) => {
  console.log(curEditorState);
  if(curEditorState == "confirmed") {
    e.preventDefault();
    return;
  } 
  const target = e.target as HTMLElement;
  console.log(target);
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

export const dropIcon = (e : DragEvent) => {
  let target = e.target;
  const targetCell : HTMLTableCellElement = target as HTMLTableCellElement;
  if(!isValidStartFinish(targetCell)) return;
  e.preventDefault();

  if(document.getElementById('start-cell') != null) document.getElementById('start-cell').remove();
  if(document.getElementById('finish-cell') != null) document.getElementById('finish-cell').remove();

  
  const iconSrc = e.dataTransfer.getData("text/plain");
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

  targetCell.appendChild(newDiv);
};
