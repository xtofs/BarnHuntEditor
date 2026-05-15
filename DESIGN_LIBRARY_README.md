# Design Library Feature Branch

This branch adds a complete design management system to the Barn Hunt Editor with:

## Features

### 1. **Auto-save with IndexedDB**
- Designs automatically save 1 second after any change (debounced)
- No manual "Save" button needed
- All data persists in the browser's IndexedDB
- Brief "Saved ✓" indicator appears after each save

### 2. **Design Library Sidebar**
- Shows all saved designs with thumbnail previews
- Click any design to switch to it instantly
- Active design is highlighted
- Each design card shows:
  - Thumbnail preview
  - Name (editable - click to rename)
  - Last modified date and time
  - Export and Delete buttons

### 3. **Export/Import**
- **Export**: Download any design as a JSON file
- **Import**: Upload a previously exported design file
- Imports create a new design (don't overwrite existing ones)

### 4. **Better Architecture**

#### `CourseManager` class
- Encapsulates the `Course` model
- Provides change notification via observer pattern
- Handles serialization/deserialization
- Methods for adding/removing items, modifying arena, etc.

#### `AppController` class
- Orchestrates the entire application
- Manages current design state
- Coordinates between UI, storage, and course manager
- Handles switching between designs

#### `DesignLibrary` class
- Manages the sidebar UI
- Renders design cards
- Handles user interactions (select, delete, rename, etc.)

#### `designStorage.ts` module
- All IndexedDB operations
- Thumbnail generation from canvas
- Import/export functionality

## Architecture Benefits

1. **Separation of Concerns**: UI, business logic, and storage are cleanly separated
2. **Change Notification**: `CourseManager` notifies listeners when the course changes, triggering auto-save and re-render
3. **Type Safety**: Full TypeScript with proper interfaces
4. **Testability**: Each component can be tested independently
5. **Extensibility**: Easy to add new features (undo/redo, templates, etc.)

## How It Works

### On App Load:
1. `AppController.initialize()` loads all designs from IndexedDB
2. Tries to restore the last active design from `localStorage`
3. Falls back to the first design, or creates a blank one if none exist

### When User Edits:
1. Item is mutated (e.g., `bale.x += 5`)
2. `appController.notifyChange()` is called
3. `CourseManager` triggers its change listeners
4. Listener schedules auto-save (1 second debounce)
5. Listener also re-renders the canvas
6. After debounce, design saves to IndexedDB with new thumbnail
7. "Saved ✓" indicator briefly appears

### When User Switches Designs:
1. Current design auto-saves first
2. New design loads from IndexedDB
3. `CourseManager.load()` replaces the current course
4. Canvas re-renders
5. Library UI updates to show new active design

## File Structure

```
src/
├── appController.ts      - Main app orchestrator
├── courseManager.ts      - Course model with change notification
├── designLibrary.ts      - Design library UI component
├── designStorage.ts      - IndexedDB persistence layer
├── main.ts              - Entry point (refactored to use AppController)
├── model.ts             - Course, Item, Bale, StartBox classes (unchanged)
├── renderer.ts          - Canvas rendering (unchanged)
├── palette.ts           - Color palette (unchanged)
└── style.css            - Styles (added design library styles)
```

## Usage

```bash
npm install
npm run dev
```

The sidebar appears on the left (hidden on mobile/small screens). All designs are stored locally in your browser.

## Future Improvements

Possible enhancements:
- Undo/redo stack
- Design templates
- Duplicate design
- Search/filter designs
- Cloud sync
- Collaborative editing
- Print/export to PDF
- Keyboard shortcuts for design switching

## Migration Notes

The existing `Course` model is unchanged - this is purely additive. The old code would still work, but now goes through `CourseManager` for better encapsulation.
