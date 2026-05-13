import './style.css'


import { Bale, StartBox, type CourseElement } from './model';
import { renderCourse as renderCourse } from './renderer';


const canvas = document.getElementById('ring') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

resizeCanvasToElement();

const elements: CourseElement[] = [
  new Bale(50, 40),
  new Bale(100, 100),
  new StartBox(400, 0)
]

renderCourse(canvas, ctx, elements);

let draggedElement: CourseElement | null = null;
let lastPointerX = 0;
let lastPointerY = 0;

canvas.addEventListener('pointerdown', (event) => {
  const point = getCanvasPoint(event);
  const hitElement = findTopMostElementAt(point.x, point.y);

  setSelection(hitElement);

  if (hitElement !== null) {
    draggedElement = hitElement;
    lastPointerX = point.x;
    lastPointerY = point.y;

    canvas.setPointerCapture(event.pointerId);
    canvas.focus();
  }

  renderCourse(canvas, ctx, elements);
});

canvas.addEventListener('pointermove', (event) => {
  if (draggedElement === null) {
    return;
  }

  const point = getCanvasPoint(event);
  const dx = point.x - lastPointerX;
  const dy = point.y - lastPointerY;

  const rect = canvas.getBoundingClientRect();
  draggedElement.moveBy(dx, dy, rect);

  lastPointerX = point.x;
  lastPointerY = point.y;

  renderCourse(canvas, ctx, elements);
});

canvas.addEventListener('pointerup', (event) => {
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  draggedElement = null;
});

canvas.addEventListener('pointercancel', (event) => {
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  draggedElement = null;
});

canvas.addEventListener('keydown', (event) => {

  const rect = canvas.getBoundingClientRect();
  const selected = elements.find((element) => element.selected);
  if (selected === undefined) {
    return;
  }

  const step = event.shiftKey ? 10 : 2;
  let handled = false;

  if (event.key === 'ArrowUp') {
    selected.moveBy(0, -step, rect);
    handled = true;
  } else if (event.key === 'ArrowDown') {
    selected.moveBy(0, step, rect);
    handled = true;
  } else if (event.key === 'ArrowLeft') {
    selected.moveBy(-step, 0, rect);
    handled = true;
  } else if (event.key === 'ArrowRight') {
    selected.moveBy(step, 0, rect);
    handled = true;
  } else {
    handled = selected.handleKeyDown(event);
  }

  if (handled) {
    event.preventDefault();
    renderCourse(canvas, ctx, elements);
  }
});

window.addEventListener('resize', () => {
  resizeCanvasToElement();
  renderCourse(canvas, ctx, elements);
});



function resizeCanvasToElement() {
  const bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width;
  canvas.height = bounds.height;
}

function getCanvasPoint(event: PointerEvent) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = canvas.width / bounds.width;
  const scaleY = canvas.height / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY,
  };
}

function setSelection(selected: CourseElement | null) {
  for (const element of elements) {
    element.selected = element === selected;
  }
}

function findTopMostElementAt(x: number, y: number) {
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (element.hitTest(x, y)) {
      return element;
    }
  }

  return null;
}


