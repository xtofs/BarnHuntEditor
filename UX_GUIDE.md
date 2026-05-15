# Design Library UX Guide

## Layout Overview

```
┌──────────────────────────────────────────────────────────┐
│  [Designs] Current: My Design    [Help] [Palette] [...]  │ ← Toolbar
├──────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                     Canvas Area                            │
│                  (Full Width Now!)                         │
│                                                            │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## Modal Dialog (When "Designs" Clicked)

```
        ┌─────────────────────────────────────────┐
        │  Designs              [+ New]    [×]    │ ← Header
        ├─────────────────────────────────────────┤
        │  ┌────────┐  ┌────────┐  ┌────────┐    │
        │  │ [img]  │  │ [img]  │  │ [img]  │    │
        │  │ Name 1 │  │ Name 2 │  │ Name 3 │    │ ← Grid of
        │  │ 2pm    │  │ 1pm    │  │ 12pm   │    │   designs
        │  │ [↑][×] │  │ [↑][×] │  │ [↑][×] │    │
        │  └────────┘  └────────┘  └────────┘    │
        │                                         │
        │  ┌────────┐  ┌────────┐  ┌────────┐    │
        │  │ [img]  │  │ [img]  │  │ [img]  │    │
        │  │ Name 4 │  │ Name 5 │  │ Name 6 │    │
        │  │ 11am   │  │ 10am   │  │ 9am    │    │
        │  │ [↑][×] │  │ [↑][×] │  │ [↑][×] │    │
        │  └────────┘  └────────┘  └────────┘    │
        ├─────────────────────────────────────────┤
        │  [Import Design]            [Close]     │ ← Footer
        └─────────────────────────────────────────┘
```

## Design Card Anatomy

```
┌─────────────────┐
│                 │
│    Thumbnail    │ ← Canvas snapshot
│                 │
├─────────────────┤
│ Design Name     │ ← Click to edit inline
│ 2:30 PM         │ ← Last modified
├─────────────────┤
│         [↑] [×] │ ← Export / Delete
└─────────────────┘
     Active design has blue border
```

## User Interactions

### Opening the Library
**Action**: Click "Designs" button
**Result**: Modal dialog opens with grid of all designs

### Selecting a Design
**Action**: Click any design card (not on buttons)
**Result**: 
- Design loads
- Modal closes automatically
- Toolbar shows new design name

### Creating New Design
**Action**: Click "+ New" button in modal
**Result**:
- Blank design created
- Modal closes
- New design becomes active

### Renaming a Design
**Action**: Click design name in card
**Result**: Name becomes editable inline (press Enter to save)

### Exporting a Design
**Action**: Click [↑] export button
**Result**: JSON file downloads to browser

### Importing a Design
**Action**: Click "Import Design" → Select JSON file
**Result**:
- Design imported with new ID
- Modal closes
- Imported design becomes active

### Deleting a Design
**Action**: Click [×] delete button → Confirm
**Result**:
- Design removed from IndexedDB
- If deleted design was active, switches to next available design

## Auto-save Behavior

**Every 1 second after changes**:
1. Design saves to IndexedDB
2. Thumbnail regenerated from canvas
3. "Saved ✓" indicator briefly appears bottom-right

**No manual save needed** - just edit and it auto-saves!

## Responsive Behavior

- **Desktop**: Grid shows 3-4 cards per row
- **Tablet**: Grid shows 2 cards per row
- **Mobile**: Grid shows 1 card per row
- Dialog is always centered and responsive

## Keyboard Shortcuts (Future Enhancement Ideas)

- `Ctrl/Cmd + O` - Open designs dialog
- `Ctrl/Cmd + N` - New design
- `Ctrl/Cmd + E` - Export current design
- `Escape` - Close dialog

## Visual States

### Design Cards
- **Normal**: White background, gray border
- **Hover**: Slight shadow, darker border, lifts up 2px
- **Active**: Blue border, light blue background

### Buttons
- **Normal**: Gray with border
- **Hover**: Darker background
- **Delete hover**: Red background, red border

## Data Flow

```
User edits course
       ↓
AppController.notifyChange()
       ↓
CourseManager triggers onChange listeners
       ↓
Schedule auto-save (1s debounce)
       ↓
Save to IndexedDB with thumbnail
       ↓
Update library UI
       ↓
Show "Saved ✓" indicator
```

## Storage Strategy

- **IndexedDB**: All designs with thumbnails
- **localStorage**: Last active design ID (for restore on reload)
- **In-memory**: Current design being edited

## Error Handling

- Import fails → Alert with error message
- Design not found → Create new design
- IndexedDB unavailable → Fallback to in-memory only
