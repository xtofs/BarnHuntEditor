import './style.css'

import { Bale, StartBox, type Item } from './model';
import { canvasPointToWorld, getArenaViewport, renderCourse } from './renderer';
import { getPalette, initializePaletteDialog, type Palette } from './palette'
import { AppController } from './appController';


const canvas = document.getElementById('ring') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const libraryContainer = document.getElementById('design-library-container') as HTMLElement;
const libraryDialog = document.getElementById('design-library-dialog') as HTMLDialogElement;
const openDesignsButton = document.getElementById('open-designs') as HTMLButtonElement;
const currentDesignDisplay = document.getElementById('current-design-display') as HTMLElement;

const helpDialog = document.getElementById('keyboard-help-dialog') as HTMLDialogElement | null;
const openHelpButton = document.getElementById('open-help') as HTMLButtonElement | null;

export var palette: Palette = await getPalette()

// Initialize the app controller
const appController = new AppController({ 
  canvas, 
  ctx, 
  libraryContainer, 
  dialog: libraryDialog,
  onCurrentDesignChanged: (name) => {
    currentDesignDisplay.innerHTML = `<strong>${name}</strong>`;
  }
});
await appController.initialize();

// Get the course manager for use throughout
const courseManager = appController.getCourseManager();

// Set up the "Designs" button to open the dialog
openDesignsButton.addEventListener('click', () => {
  appController.openLibrary();
});

// Focus canvas when dialog closes
libraryDialog.addEventListener('close', () => {
  canvas.focus();
});

initializePaletteDialog('#palette-dialog-placeholder', '#open-palette-dialog', {
  onPaletteChanged: (_palette) => {
    palette = _palette
    console.log('Current palette', palette)
    renderCourse(canvas, ctx, courseManager.getCourse() as any);
  },
})

if (helpDialog !== null && openHelpButton !== null) {
  openHelpButton.addEventListener('click', () => {
    helpDialog.showModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!isHelpShortcut(event)) {
      return;
    }

    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    if (helpDialog.open || document.querySelector('dialog[open]') !== null) {
      return;
    }

    event.preventDefault();
    helpDialog.showModal();
  });

  helpDialog.addEventListener('close', () => {
    canvas.focus();
  });
}

resizeCanvasToElement();

renderCourse(canvas, ctx, courseManager.getCourse() as any);

let draggedElement: Item | null = null;
let lastPointerXWorld = 0;
let lastPointerYWorld = 0;

canvas.addEventListener('pointerdown', (event) => {
  const canvasPoint = getCanvasPoint(event);
  const viewport = getArenaViewport(canvas, courseManager.getArena());
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

  appController.notifyChange();
});

canvas.addEventListener('pointermove', (event) => {
  if (draggedElement === null) {
    return;
  }

  const canvasPoint = getCanvasPoint(event);
  const viewport = getArenaViewport(canvas, courseManager.getArena());
  const worldPoint = canvasPointToWorld(canvasPoint.x, canvasPoint.y, viewport);
  const dx = worldPoint.x - lastPointerXWorld;
  const dy = worldPoint.y - lastPointerYWorld;

  draggedElement.x += dx;
  draggedElement.y += dy;
  draggedElement.applyPlacementRules(courseManager.getArena());

  lastPointerXWorld = worldPoint.x;
  lastPointerYWorld = worldPoint.y;

  appController.notifyChange();
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
  renderCourse(canvas, ctx, courseManager.getCourse() as any);
});


function keydownHandler(event: KeyboardEvent) {

  // single Shift press creates a weird event
  if (event.key === "Shift") return;

  const selected = courseManager.getItems().find((element) => element.selected);
  if (selected === undefined) {
    return;
  }
  const step = event.shiftKey ? 0.1 : 1;
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
        const items = courseManager.getItems() as Item[];
        const ix = items.findIndex(item => item === selected);
        const step = event.shiftKey ? -1 : 1;
        const len = items.length;
        const next = items[(ix + step + len) % len];
        next.selected = true;
        selected.selected = false;
        handled = true;
      }
      break;

    case 'Delete':
    case 'Backspace':
      courseManager.removeSelected();
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
    selected.applyPlacementRules(courseManager.getArena());
    appController.notifyChange();
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
  for (const element of courseManager.getItems()) {
    element.selected = element === selected;
  }
}

function findTopMostElementAt(x: number, y: number) {
  const items = courseManager.getItems() as Item[];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const element = items[index];
    if (element.hitTest(x, y)) {
      return element;
    }
  }

  return null;
}

function isHelpShortcut(event: KeyboardEvent) {
  return event.key === '?' || event.key.toLowerCase() === 'h';
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.closest('[contenteditable]:not([contenteditable="false"])') !== null
  );
}


