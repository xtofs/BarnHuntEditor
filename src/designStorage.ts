import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CourseManager } from './courseManager';

interface DesignDBSchema extends DBSchema {
  designs: {
    key: string;
    value: Design;
    indexes: { 'by-modified': number };
  };
}

export interface Design {
  id: string;
  name: string;
  thumbnail: string; // base64 data URL
  data: any; // serialized course
  createdAt: number;
  modifiedAt: number;
}

const DB_NAME = 'barnhunt-designs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DesignDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<DesignDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DesignDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('designs', { keyPath: 'id' });
        store.createIndex('by-modified', 'modifiedAt');
      },
    });
  }
  return dbPromise;
}

/**
 * Generate a thumbnail from the canvas
 */
function generateThumbnail(canvas: HTMLCanvasElement): string {
  // Create a smaller version for the thumbnail
  const thumbCanvas = document.createElement('canvas');
  const thumbSize = 200;
  thumbCanvas.width = thumbSize;
  thumbCanvas.height = thumbSize;
  const thumbCtx = thumbCanvas.getContext('2d')!;
  
  // White background
  thumbCtx.fillStyle = 'white';
  thumbCtx.fillRect(0, 0, thumbSize, thumbSize);
  
  // Scale and draw the main canvas
  const scale = Math.min(thumbSize / canvas.width, thumbSize / canvas.height);
  const scaledWidth = canvas.width * scale;
  const scaledHeight = canvas.height * scale;
  const offsetX = (thumbSize - scaledWidth) / 2;
  const offsetY = (thumbSize - scaledHeight) / 2;
  
  thumbCtx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
  
  return thumbCanvas.toDataURL('image/png');
}

/**
 * Save a design to IndexedDB
 */
export async function saveDesign(
  id: string,
  name: string,
  courseManager: CourseManager,
  canvas: HTMLCanvasElement
): Promise<Design> {
  const db = await getDB();
  
  const existing = await db.get('designs', id);
  
  const design: Design = {
    id,
    name,
    thumbnail: generateThumbnail(canvas),
    data: courseManager.toJSON(),
    createdAt: existing?.createdAt ?? Date.now(),
    modifiedAt: Date.now(),
  };
  
  await db.put('designs', design);
  return design;
}

/**
 * Load a design from IndexedDB
 */
export async function loadDesign(id: string): Promise<Design | undefined> {
  const db = await getDB();
  return await db.get('designs', id);
}

/**
 * Get all designs, sorted by most recently modified
 */
export async function getAllDesigns(): Promise<Design[]> {
  const db = await getDB();
  const designs = await db.getAllFromIndex('designs', 'by-modified');
  return designs.reverse(); // newest first
}

/**
 * Delete a design
 */
export async function deleteDesign(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('designs', id);
}

/**
 * Create a new blank design
 */
export function createNewDesign(): Design {
  return {
    id: generateId(),
    name: `Design ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    thumbnail: '',
    data: {
      arena: { widthFt: 30, heightFt: 20 },
      items: [],
    },
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export design as JSON file
 */
export function exportDesign(design: Design): void {
  const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${design.name.replace(/[^a-z0-9]/gi, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import design from JSON file
 */
export async function importDesign(file: File): Promise<Design> {
  const text = await file.text();
  const imported = JSON.parse(text) as Design;
  
  // Give it a new ID to avoid conflicts
  const design: Design = {
    ...imported,
    id: generateId(),
    name: `${imported.name} (imported)`,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  };
  
  const db = await getDB();
  await db.put('designs', design);
  
  return design;
}
