import { openDB, type DBSchema } from 'idb'

export interface Palette {
    bale_level_1: { fill: string, stroke: string },
    bale_level_2: { fill: string, stroke: string },
    bale_level_3: { fill: string, stroke: string },
    start_box: { fill: string, stroke: string },
    selection: { fill: string, stroke: string },
}

const defaultPalette: Palette = {
    bale_level_1: {
        fill: '#ffa000',
        stroke: '#000000',
    },
    bale_level_2: {
        fill: '#a07000',
        stroke: '#000000',
    },
    bale_level_3: {
        fill: '#604000',
        stroke: '#000000',
    },
    start_box: {
        fill: '#60a0ff',
        stroke: '#000000',
    },
    selection: {
        stroke: '#60ff00',
        fill: '#60ff00'
    }
}

const PALETTE_DB_NAME = 'spike2'
const PALETTE_STORE_NAME = 'palette'
const PALETTE_KEY = 'current'

interface PaletteDb extends DBSchema {
    [PALETTE_STORE_NAME]: {
        key: string
        value: Palette
    }
}

const paletteDbPromise = openDB<PaletteDb>(PALETTE_DB_NAME, 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(PALETTE_STORE_NAME)) {
            db.createObjectStore(PALETTE_STORE_NAME)
        }
    },
})

let currentPalette = clonePalette(defaultPalette)

export interface PaletteDialogOptions {
    onPaletteChanged?: (palette: Palette) => void
}

export async function getPalette(): Promise<Palette> {
    const storedPalette = await loadPalette()
    if (storedPalette) {
        return clonePalette(storedPalette)
    }

    const seededPalette = clonePalette(defaultPalette)
    await savePalette(seededPalette)
    return seededPalette
}

export async function purgePalette(): Promise<void> {
    const db = await paletteDbPromise
    await db.delete(PALETTE_STORE_NAME, PALETTE_KEY)
    currentPalette = clonePalette(defaultPalette)
}

export function initializePaletteDialog(dialogPlaceholderSelector: string, openButtonSelector: string, options?: PaletteDialogOptions): void {
    const dialogPlaceholder = document.querySelector<HTMLDialogElement>(dialogPlaceholderSelector)
    if (!dialogPlaceholder) {
        throw new Error(`Palette dialog placeholder not found: ${dialogPlaceholderSelector}`)
    }

    const openButton = document.querySelector<HTMLButtonElement>(openButtonSelector)
    if (!openButton) {
        throw new Error(`Palette open button not found: ${openButtonSelector}`)
    }

    dialogPlaceholder.outerHTML = createDialogShellHtml()

    const dialog = document.querySelector<HTMLDialogElement>('[data-role="palette-dialog"]')
    if (!dialog) {
        throw new Error('Palette dialog was not created')
    }

    const saveButton = dialog.querySelector<HTMLButtonElement>('[data-action="save-palette"]')!
    const cancelButton = dialog.querySelector<HTMLButtonElement>('[data-action="cancel-palette"]')!

    openButton.onclick = () => dialog.showModal()
    cancelButton.onclick = () => dialog.close()
    saveButton.onclick = async () => {
        applyInputsToPalette(dialog, currentPalette)
        await savePalette(currentPalette)
        notifyPaletteChanged(options?.onPaletteChanged, currentPalette)
        dialog.close()
    }

    renderPalette(dialog, currentPalette)
    void loadSavedPalette(dialog, options?.onPaletteChanged)
}

function createDialogShellHtml(): string {
    return `
    <dialog data-role="palette-dialog">
        <h2>Edit Color Palette</h2>
        <form method="dialog">
            <div data-palette-container></div>
            <p/>
            <div>
                <button data-action="save-palette" class="pill-btn" default>Save</button>
                <button data-action="cancel-palette" class="pill-btn">Cancel</button>
            </div>
        </form>
    </dialog>
  `
}

function createPaletteHtml(palette: Palette): string {
    let html = ''
    html += '<table data-role="palette-table" style="padding:10px">'
    html += '<tr><th></th><th>Fill</th><th>Stroke</th></tr>'
    html += row('bale_level_1', 'Level 1 Bale', palette.bale_level_1)
    html += row('bale_level_2', 'Level 2 Bale', palette.bale_level_2)
    html += row('bale_level_3', 'Level 3 Bale', palette.bale_level_3)
    html += row('start_box', 'Start Box', palette.start_box)
    html += `<tr><td>Selection</td><td></td><td><input type="color" data-key="selection" data-channel="stroke" value="${palette.selection.stroke}" /></td>`;
    html += `</tr>`
    html += '</table>'
    return html

    function row(key: keyof Palette, name: string, style: { fill: string, stroke: string }): string {
        return `
            <tr>
                <td>${name}</td>
                <td><input type="color" data-key="${key}" data-channel="fill" value="${style.fill}" /></td>
                <td><input type="color" data-key="${key}" data-channel="stroke" value="${style.stroke}" /></td>
            </tr>`
    }
}

function renderPalette(dialog: HTMLDialogElement, palette: Palette): void {
    const container = dialog.querySelector<HTMLElement>('[data-palette-container]')!
    container.innerHTML = createPaletteHtml(palette)
}

function applyInputsToPalette(dialog: HTMLDialogElement, palette: Palette): void {
    const colorInputs = dialog.querySelectorAll<HTMLInputElement>('input[type="color"][data-key][data-channel]')
    for (const input of colorInputs) {
        const key = input.dataset.key as keyof Palette
        const channel = input.dataset.channel as 'fill' | 'stroke'
        palette[key][channel] = input.value
    }
}

function clonePalette(source: Palette): Palette {
    return {
        bale_level_1: { ...source.bale_level_1 },
        bale_level_2: { ...source.bale_level_2 },
        bale_level_3: { ...source.bale_level_3 },
        start_box: { ...source.start_box },
        selection: { ...source.selection }
    }
}

function notifyPaletteChanged(onPaletteChanged: PaletteDialogOptions['onPaletteChanged'], palette: Palette): void {
    onPaletteChanged?.(clonePalette(palette))
}

async function savePalette(palette: Palette): Promise<void> {
    const db = await paletteDbPromise
    await db.put(PALETTE_STORE_NAME, palette, PALETTE_KEY)
}

async function loadPalette(): Promise<Palette | undefined> {
    const db = await paletteDbPromise
    return db.get(PALETTE_STORE_NAME, PALETTE_KEY)
}

async function loadSavedPalette(
    dialog: HTMLDialogElement,
    onPaletteChanged: PaletteDialogOptions['onPaletteChanged'],
): Promise<void> {
    currentPalette = await getPalette()
    renderPalette(dialog, currentPalette)
    notifyPaletteChanged(onPaletteChanged, currentPalette)
}
