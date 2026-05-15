import type { Design } from './designStorage';
import { deleteDesign, exportDesign, importDesign } from './designStorage';

export interface DesignLibraryCallbacks {
  onSelectDesign: (design: Design) => void;
  onDeleteDesign: (design: Design) => void;
  onNewDesign: () => void;
  onImportDesign: (design: Design) => void;
  onRenameDesign: (design: Design, newName: string) => void;
  onClose: () => void;
}

export class DesignLibrary {
  private container: HTMLElement;
  private callbacks: DesignLibraryCallbacks;
  private currentDesignId: string | null = null;

  constructor(container: HTMLElement, callbacks: DesignLibraryCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  /**
   * Update the library with all designs
   */
  update(designs: Design[], currentDesignId: string | null): void {
    this.currentDesignId = currentDesignId;
    this.render(designs);
  }

  private render(designs: Design[]): void {
    this.container.innerHTML = `
      <div class="design-library">
        <div class="design-library-header">
          <h2>Designs</h2>
          <div class="design-library-header-actions">
            <button class="new-design-btn" title="New Design">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              New
            </button>
            <button class="close-library-btn" title="Close">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="design-list">
          ${designs.length === 0 ? this.renderEmpty() : designs.map(d => this.renderDesignCard(d)).join('')}
        </div>
        
        <div class="design-library-footer">
          <button class="import-btn">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 12V4M5 9l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 13h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Import Design
          </button>
          <button class="close-dialog-btn">Close</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderEmpty(): string {
    return `
      <div class="design-empty">
        <p>No designs yet</p>
        <p class="design-empty-hint">Click "New" to create your first design</p>
      </div>
    `;
  }

  private renderDesignCard(design: Design): string {
    const isActive = design.id === this.currentDesignId;
    const modifiedDate = new Date(design.modifiedAt).toLocaleDateString();
    const modifiedTime = new Date(design.modifiedAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `
      <div class="design-card ${isActive ? 'active' : ''}" data-id="${design.id}">
        <div class="design-thumbnail">
          ${design.thumbnail ? `<img src="${design.thumbnail}" alt="${design.name}">` : '<div class="no-thumbnail">No preview</div>'}
        </div>
        <div class="design-info">
          <div class="design-name" contenteditable="true" spellcheck="false">${design.name}</div>
          <div class="design-meta">${modifiedDate} ${modifiedTime}</div>
        </div>
        <div class="design-actions">
          <button class="design-action-btn export-btn" title="Export" data-id="${design.id}">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 4v8M5 7l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 13h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="design-action-btn delete-btn" title="Delete" data-id="${design.id}">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 4h10M6 4V3h4v1M6 7v5M10 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M4 4h8v9H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // New design button
    const newBtn = this.container.querySelector('.new-design-btn');
    newBtn?.addEventListener('click', () => this.callbacks.onNewDesign());

    // Close buttons
    const closeButtons = this.container.querySelectorAll('.close-library-btn, .close-dialog-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.callbacks.onClose());
    });

    // Import button
    const importBtn = this.container.querySelector('.import-btn');
    importBtn?.addEventListener('click', () => this.handleImport());

    // Design cards
    const cards = this.container.querySelectorAll('.design-card');
    cards.forEach(card => {
      const id = card.getAttribute('data-id')!;
      
      // Click to select (but not on buttons or name field)
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (
          !target.closest('.design-action-btn') && 
          !target.classList.contains('design-name')
        ) {
          const design = this.findDesignById(id);
          if (design) {
            this.callbacks.onSelectDesign(design);
            this.callbacks.onClose(); // Close dialog after selecting
          }
        }
      });

      // Rename
      const nameField = card.querySelector('.design-name');
      nameField?.addEventListener('blur', (e) => {
        const newName = (e.target as HTMLElement).textContent?.trim() || 'Untitled';
        const design = this.findDesignById(id);
        if (design && newName !== design.name) {
          this.callbacks.onRenameDesign(design, newName);
        }
      });

      nameField?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      });

      // Export
      const exportBtn = card.querySelector('.export-btn');
      exportBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const design = this.findDesignById(id);
        if (design) {
          exportDesign(design);
        }
      });

      // Delete
      const deleteBtn = card.querySelector('.delete-btn');
      deleteBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const design = this.findDesignById(id);
        if (design && confirm(`Delete "${design.name}"?`)) {
          this.callbacks.onDeleteDesign(design);
        }
      });
    });
  }

  private designs: Design[] = [];

  // Store designs for event handler access
  private updateDesignsCache(designs: Design[]): void {
    this.designs = designs;
  }

  private findDesignById(id: string): Design | undefined {
    return this.designs.find(d => d.id === id);
  }

  // Update the update method to cache designs
  updateWithCache(designs: Design[], currentDesignId: string | null): void {
    this.currentDesignId = currentDesignId;
    this.updateDesignsCache(designs);
    this.render(designs);
  }

  private async handleImport(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const design = await importDesign(file);
        this.callbacks.onImportDesign(design);
      } catch (err) {
        console.error('Failed to import design:', err);
        alert('Failed to import design. Please check the file format.');
      }
    });

    input.click();
  }
}
