import './style.css'


import { Bale, StartBox, type Course, type Item } from './model';
import { canvasPointToWorld, getArenaViewport, renderCourse } from './renderer';


const canvas = document.getElementById('ring') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

resizeCanvasToElement();

const course: Course = {
  arena: {
    widthFt: 30,
    heightFt: 20,
  },
  items: [
    new Bale(5, 4),
    new Bale(11, 10, true),
    new StartBox(25, 0),
  ],
};

renderCourse(canvas, ctx, course);

let draggedElement: Item | null = null;
let lastPointerXWorld = 0;
let lastPointerYWorld = 0;

canvas.addEventListener('pointerdown', (event) => {
  const canvasPoint = getCanvasPoint(event);
  const viewport = getArenaViewport(canvas, course.arena);
  const worldPoint = canvasPointToWorld(canvasPoint.x, canvasPoint.y, viewport);
  const hitElement = findTopMostElementAt(worldPoint.x, worldPoint.y);

  setSelection(hitElement);

  if (hitElement !== null) {
    draggedElement = hitElement;
    lastPointerXWorld = worldPoint.x;
    lastPointerYWorld = worldPoint.y;

    canvas.setPointerCapture(event.pointerId);
    canvas.focus();
  }

  renderCourse(canvas, ctx, course);
});

canvas.addEventListener('pointermove', (event) => {
  if (draggedElement === null) {
    return;
  }

  const canvasPoint = getCanvasPoint(event);
  const viewport = getArenaViewport(canvas, course.arena);
  const worldPoint = canvasPointToWorld(canvasPoint.x, canvasPoint.y, viewport);
  const dx = worldPoint.x - lastPointerXWorld;
  const dy = worldPoint.y - lastPointerYWorld;

  draggedElement.x += dx;
  draggedElement.y += dy;
  draggedElement.applyPlacementRules(course.arena);

  lastPointerXWorld = worldPoint.x;
  lastPointerYWorld = worldPoint.y;

  renderCourse(canvas, ctx, course);
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

canvas.addEventListener('keydown', keydownHandler);

window.addEventListener('resize', () => {
  resizeCanvasToElement();
  renderCourse(canvas, ctx, course);
});


function keydownHandler(event: KeyboardEvent) {

  // single Shift press creates a weird event
  if (event.key === "Shift") return;

  const selected = course.items.find((element) => element.selected);
  if (selected === undefined) {
    return;
  }
  const step = event.shiftKey ? 0.2 : 1;
  let handled = false;

  // arrow, delete and are handled here, the rest gets delegated to the seleced object
  switch (event.key) {
    case 'ArrowUp':
      selected.y -= step;
      handled = true;
      break;

    case 'ArrowDown':
      selected.y += step;
      handled = true;
      break;

    case 'ArrowLeft':
      selected.x -= step;
      handled = true;
      break;

    case 'ArrowRight':
      selected.x += step;
      handled = true;
      break;

    case 'Tab':
      if (selected !== null) {
        const ix = course.items.findIndex(item => item === selected);
        const step = event.shiftKey ? -1 : 1;
        const len = course.items.length;
        const next = course.items[(ix + step + len) % len];
        next.selected = true;
        selected.selected = false;
        handled = true;
      }
      break;

    case 'Delete':
    case 'Backspace':
      course.items = course.items.filter(item => !item.selected);
      handled = true
      break;

    case ' ':
      selected.selected = false;
      handled = true;
      break;

    default:
      // delegate to item
      handled = selected.handleKeyDown(event);
      break;
  }

  if (handled) {
    selected.applyPlacementRules(course.arena);
    renderCourse(canvas, ctx, course);
    event.preventDefault();
  } else {
    console.warn(`unhandled keydown ${event.shiftKey ? "Shift+" : ""}${event.key}`)
  }
};

function resizeCanvasToElement() {
  const bounds = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(bounds.width * dpr));
  canvas.height = Math.max(1, Math.round(bounds.height * dpr));
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

function setSelection(selected: Item | null) {
  for (const element of course.items) {
    element.selected = element === selected;
  }
}

function findTopMostElementAt(x: number, y: number) {
  for (let index = course.items.length - 1; index >= 0; index -= 1) {
    const element = course.items[index];
    if (element.hitTest(x, y)) {
      return element;
    }
  }

  return null;
}


