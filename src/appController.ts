import { CourseManager } from './courseManager';
import { DesignLibrary } from './designLibrary';
import {
  type Design,
  saveDesign,
  loadDesign,
  getAllDesigns,
  createNewDesign,
  deleteDesign as deleteDesignFromDB,
} from './designStorage';
import { renderCourse } from './renderer';

interface AppControllerOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  libraryContainer: HTMLElement;
  dialog: HTMLDialogElement;
  onCurrentDesignChanged?: (name: string) => void;
}

export class AppController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private courseManager: CourseManager;
  private library: DesignLibrary;
  private dialog: HTMLDialogElement;
  private currentDesign: Design | null = null;
  private saveTimeout: number | null = null;
  private designs: Design[] = [];
  private onCurrentDesignChanged?: (name: string) => void;

  constructor(options: AppControllerOptions) {
    this.canvas = options.canvas;
    this.ctx = options.ctx;
    this.dialog = options.dialog;
    this.onCurrentDesignChanged = options.onCurrentDesignChanged;
    
    // Initialize with a default course
    const initialCourse = {
      arena: { widthFt: 30, heightFt: 20 },
      items: [],
    };
    this.courseManager = new CourseManager(initialCourse);

    // Set up change listener for auto-save
    this.courseManager.onChange(() => {
      this.scheduleAutoSave();
      this.render();
    });

    // Set up design library
    this.library = new DesignLibrary(options.libraryContainer, {
      onSelectDesign: (design) => this.switchToDesign(design),
      onDeleteDesign: (design) => this.deleteDesign(design),
      onNewDesign: () => this.createNewDesign(),
      onImportDesign: (design) => this.switchToDesign(design),
      onRenameDesign: (design, newName) => this.renameDesign(design, newName),
      onClose: () => this.closeLibrary(),
    });
  }

  /**
   * Initialize the app - load designs and set up the first one
   */
  async initialize(): Promise<void> {
    await this.loadAllDesigns();

    // Try to load the last active design from localStorage
    const lastActiveId = localStorage.getItem('lastActiveDesign');
    if (lastActiveId) {
      const design = await loadDesign(lastActiveId);
      if (design) {
        await this.loadDesignData(design);
        return;
      }
    }

    // Otherwise, load the first design or create a new one
    if (this.designs.length > 0) {
      await this.loadDesignData(this.designs[0]);
    } else {
      await this.createNewDesign();
    }
  }

  /**
   * Get the course manager (for external manipulation)
   */
  getCourseManager(): CourseManager {
    return this.courseManager;
  }

  /**
   * Get the current design name
   */
  getCurrentDesignName(): string {
    return this.currentDesign?.name ?? 'Untitled';
  }

  /**
   * Open the design library dialog
   */
  openLibrary(): void {
    this.dialog.showModal();
  }

  /**
   * Close the design library dialog
   */
  closeLibrary(): void {
    this.dialog.close();
  }

  /**
   * Notify that something changed (trigger re-render and auto-save)
   */
  notifyChange(): void {
    this.courseManager.notifyChange();
  }

  /**
   * Load all designs and update the library UI
   */
  private async loadAllDesigns(): Promise<void> {
    this.designs = await getAllDesigns();
    this.updateLibrary();
  }

  /**
   * Update the library UI with current designs
   */
  private updateLibrary(): void {
    this.library.updateWithCache(this.designs, this.currentDesign?.id ?? null);
  }

  /**
   * Switch to a different design
   */
  private async switchToDesign(design: Design): Promise<void> {
    // Save current design first
    if (this.currentDesign) {
      await this.saveCurrentDesign();
    }

    await this.loadDesignData(design);
  }

  /**
   * Load a design's data into the course manager
   */
  private async loadDesignData(design: Design): Promise<void> {
    this.currentDesign = design;
    
    // Reconstruct the course from saved data
    const newCourseManager = CourseManager.fromJSON(design.data);
    this.courseManager.load(newCourseManager.getCourse() as any);
    
    // Remember this as the last active design
    localStorage.setItem('lastActiveDesign', design.id);
    
    this.updateLibrary();
    this.render();
    
    // Notify about design change
    if (this.onCurrentDesignChanged) {
      this.onCurrentDesignChanged(design.name);
    }
  }

  /**
   * Create a new blank design
   */
  private async createNewDesign(): Promise<void> {
    // Save current design first
    if (this.currentDesign) {
      await this.saveCurrentDesign();
    }

    const newDesign = createNewDesign();
    
    // Save it immediately to get it in the database
    const saved = await saveDesign(
      newDesign.id,
      newDesign.name,
      CourseManager.fromJSON(newDesign.data),
      this.canvas
    );

    // Reload all designs and switch to the new one
    await this.loadAllDesigns();
    await this.loadDesignData(saved);
  }

  /**
   * Delete a design
   */
  private async deleteDesign(design: Design): Promise<void> {
    await deleteDesignFromDB(design.id);
    await this.loadAllDesigns();

    // If we deleted the current design, switch to another one or create new
    if (this.currentDesign?.id === design.id) {
      if (this.designs.length > 0) {
        await this.loadDesignData(this.designs[0]);
      } else {
        await this.createNewDesign();
      }
    }
  }

  /**
   * Rename a design
   */
  private async renameDesign(design: Design, newName: string): Promise<void> {
    design.name = newName;
    
    if (this.currentDesign?.id === design.id) {
      this.currentDesign.name = newName;
      await this.saveCurrentDesign();
      
      // Notify about name change
      if (this.onCurrentDesignChanged) {
        this.onCurrentDesignChanged(newName);
      }
    } else {
      // Save the design with the new name
      const loaded = await loadDesign(design.id);
      if (loaded) {
        await saveDesign(
          design.id,
          newName,
          CourseManager.fromJSON(loaded.data),
          this.canvas
        );
      }
    }

    await this.loadAllDesigns();
  }

  /**
   * Schedule an auto-save (debounced)
   */
  private scheduleAutoSave(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = window.setTimeout(() => {
      this.saveCurrentDesign();
    }, 1000); // 1 second debounce
  }

  /**
   * Save the current design immediately
   */
  private async saveCurrentDesign(): Promise<void> {
    if (!this.currentDesign) return;

    await saveDesign(
      this.currentDesign.id,
      this.currentDesign.name,
      this.courseManager,
      this.canvas
    );

    // Update the design in our local list
    const index = this.designs.findIndex(d => d.id === this.currentDesign!.id);
    if (index !== -1) {
      this.designs[index] = { ...this.currentDesign, modifiedAt: Date.now() };
    }

    this.updateLibrary();
    this.showSaveIndicator();
  }

  /**
   * Render the current course
   */
  private render(): void {
    renderCourse(this.canvas, this.ctx, this.courseManager.getCourse() as any);
  }

  /**
   * Show a brief "Saved" indicator
   */
  private showSaveIndicator(): void {
    const indicator = document.getElementById('save-indicator');
    if (!indicator) return;

    indicator.classList.add('show');
    setTimeout(() => {
      indicator.classList.remove('show');
    }, 1500);
  }
}
