import type { Course, Item, ArenaSize } from './model';
import { Bale, StartBox } from './model';

export type CourseChangeListener = (course: Course) => void;

/**
 * Manages a single course with change notification.
 * Provides encapsulation and triggers listeners on mutations.
 */
export class CourseManager {
  private course: Course;
  private listeners: Set<CourseChangeListener> = new Set();

  constructor(course: Course) {
    this.course = course;
  }

  /**
   * Get the current course (read-only access)
   */
  getCourse(): Readonly<Course> {
    return this.course;
  }

  /**
   * Get arena size
   */
  getArena(): ArenaSize {
    return this.course.arena;
  }

  /**
   * Update arena size
   */
  setArena(arena: ArenaSize): void {
    this.course.arena = arena;
    this.notifyChange();
  }

  /**
   * Get all items
   */
  getItems(): readonly Item[] {
    return this.course.items;
  }

  /**
   * Add an item to the course
   */
  addItem(item: Item): void {
    this.course.items.push(item);
    this.notifyChange();
  }

  /**
   * Remove an item from the course
   */
  removeItem(item: Item): void {
    const index = this.course.items.indexOf(item);
    if (index !== -1) {
      this.course.items.splice(index, 1);
      this.notifyChange();
    }
  }

  /**
   * Remove selected items
   */
  removeSelected(): void {
    this.course.items = this.course.items.filter(item => !item.selected);
    this.notifyChange();
  }

  /**
   * Notify that the course has changed (for when items are mutated directly)
   */
  notifyChange(): void {
    this.listeners.forEach(listener => listener(this.course));
  }

  /**
   * Subscribe to course changes
   */
  onChange(listener: CourseChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Load a new course
   */
  load(course: Course): void {
    this.course = course;
    this.notifyChange();
  }

  /**
   * Serialize course to JSON-compatible object
   */
  toJSON(): SerializedCourse {
    return {
      arena: this.course.arena,
      items: this.course.items.map(serializeItem),
    };
  }

  /**
   * Deserialize course from JSON
   */
  static fromJSON(data: SerializedCourse): CourseManager {
    const course: Course = {
      arena: data.arena,
      items: data.items.map(deserializeItem),
    };
    return new CourseManager(course);
  }
}

// Serialization types and functions

interface SerializedCourse {
  arena: ArenaSize;
  items: SerializedItem[];
}

type SerializedItem = SerializedBale | SerializedStartBox;

interface SerializedBale {
  type: 'bale';
  x: number;
  y: number;
  rotated: boolean;
  isAnchor: boolean;
  level: 1 | 2 | 3;
}

interface SerializedStartBox {
  type: 'startBox';
  x: number;
  y: number;
}

function serializeItem(item: Item): SerializedItem {
  if (item instanceof Bale) {
    return {
      type: 'bale',
      x: item.x,
      y: item.y,
      rotated: item.rotated,
      isAnchor: item.isAnchor,
      level: item.level,
    };
  } else if (item instanceof StartBox) {
    return {
      type: 'startBox',
      x: item.x,
      y: item.y,
    };
  }
  throw new Error('Unknown item type');
}

function deserializeItem(data: SerializedItem): Item {
  if (data.type === 'bale') {
    const bale = new Bale(data.x, data.y, data.isAnchor);
    bale.rotated = data.rotated;
    bale.level = data.level;
    return bale;
  } else if (data.type === 'startBox') {
    return new StartBox(data.x, data.y);
  }
  throw new Error('Unknown item type in data');
}
