# My House Design Studio

A browser-based design studio for reviewing, editing, and sharing your house drawings with
family — no CAD experience required. Built as a real, working app (React + TypeScript +
Three.js), not a mockup.

## Running it

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). `npm run build` produces a static
production build in `dist/` that can be hosted anywhere (Netlify, Vercel, GitHub Pages, a plain
web server, etc.) — there is no backend to deploy.

The app opens with a real sample project already loaded: all four floors (Basement, Ground,
First, Top/Roof) of **Plot 667, Golden Model Town, Islamabad**. Room names and dimensions come
directly from the official **Furniture Layout Plan** (drawing A466-007, Syed Brothers —
Engineers, Architects & Consultants, architect Aftab Ahmad) — the authoritative, currently-issued
drawing set, copied into `reference-drawings/pdf/Furniture-Layout-Plan-A466-007.pdf` (and
rendered per-floor as PNGs in `reference-drawings/images/official-*.png`). Ground, First and Top
share the same bedroom-wing footprint, matching how the real drawings stack those floors.

The wall *positions* below are a clean re-layout for this editor — that PDF's exact CAD wall
centerlines aren't machine-readable, and a couple of circulation areas (stairs, the open-to-sky
shaft) aren't dimensioned on the drawing — use **Upload Drawing → Calibrate** with the PDF or PNGs
in `reference-drawings/` to trace the exact geometry if you need precision. The earlier informal
"REDESIGN" sketches from `HOUSE DESIGN GOLDEN TOWN/` are also still there as
`reference-drawings/images/{basement,ground-floor,ground-floor-alt,first-floor,top-floor}.png` for
comparison, but the official PDF above is the one this sample project is built from.

## Folder structure

```
src/
  types/project.ts        Data model: Project → Floor → Room/Opening. This is the single
                           source of truth; every view (2D, 3D, elevations, PDF export) is
                           derived from it, so an edit anywhere propagates everywhere.
  store/projectStore.ts   Zustand store: current project, undo/redo history, selection,
                           active tool/floor, view-only mode.
  lib/
    units.ts               ft-in / mm / m parsing & formatting.
    geometry.ts             Rectangle math, grid/angle snapping, the resize-by-dimension logic.
    wallSegments.ts         Cuts door/window gaps out of a wall edge.
    elevation.ts             Projects the 3D building onto front/rear/left/right elevations.
    threeGeometry.ts        Turns floor data into 3D box geometry for the Three.js scene.
    areaTotals.ts            Covered / veranda / open area roll-ups.
    persistence.ts          localStorage-backed project versions ("Original Plan", "Option A"…).
    share.ts                 Encodes/decodes a project into a shareable URL (see below).
    uploadDrawing.ts         Reads an uploaded JPG/PNG/PDF into a reference image layer.
    exportUtils.ts           PNG/PDF export.
    sampleProject.ts         The seeded Plot 667 sample.
  components/
    layout/                Top toolbar, tool palette, floor tabs, the right-hand properties panel.
    editor2d/               The 2D plan canvas (pan/zoom, draw rooms, drag walls, place openings).
    viewer3d/                Scene3D.tsx — the live 3D model (react-three-fiber).
    elevation/               Front/Rear/Left/Right elevation views.
    dialogs/                 Upload, Share, Versions, Export modals.
```

## What's implemented (MVP)

- Upload a drawing (PDF/JPG/PNG) as a locked-scale reference layer; pan/zoom/rotate/opacity/lock.
- Calibration tool: click two points of a known length, the whole drawing rescales.
- ft-in / mm / m units, switchable anytime.
- 2D editor: draw rooms (also used for stairs/columns/furniture via the room type picker),
  place doors & windows on walls, drag to move/resize, grid + 45° snapping.
- **Click a dimension, type a new value** — the wall moves and everything recalculates
  (width/depth fields in the right panel, with a "move left/right wall vs. expand both" choice).
- Room info: name, type, W×D, area (sq ft + sq m), ceiling height, per-floor area totals
  (covered / veranda / open / total).
- Multiple floors (Basement…Roof, add as many as you need), with "copy layout to new floor".
- Live 3D model generated from the 2D geometry — orbit/pan/zoom, perspective/orthographic,
  per-floor visibility, roof toggle, click an element to select it (syncs with the 2D panel).
- Front/Rear/Left/Right elevations, generated from the same geometry, with an Elevation Design
  Studio (style, roof type, colours, finishes, overhang, parapet) — appearance-only, your
  dimensions never change from this.
- Undo/redo, duplicate/lock/delete rooms.
- Design versions (save, duplicate, compare, delete) stored per-browser.
- Share links: **View** (rotate 3D, check dimensions, comment) and **Edit** — no account or
  server involved, the whole project is packed into the link itself.
- Threaded comments on a room, opening, or elevation (e.g. "can we make this bedroom a foot
  wider?").
- Export PNG and a PDF sheet (drawing + room/area schedule) at A4–A1.
- Works down to phone width (bottom floor bar, slide-in properties panel, touch pinch-zoom on
  the 2D and 3D canvases).

## Deliberately deferred (not faked — flagged per your spec)

These need real infrastructure or scope this assistant can't provide unilaterally, so they're
left as clean extension points rather than non-functional buttons:

- **Live multi-user sync** (someone edits, you see it update in real time). Needs a hosted
  backend (Supabase/Firebase/Postgres) — creating that account is something only you can do;
  the data model (`types/project.ts`) is already shaped to slot a backend in later. Today,
  sharing works via self-contained links instead (see above) — genuinely functional, just not
  live-synced.
- **Walkthrough / first-person mode** inside the 3D view.
- **DXF / OBJ / GLTF export** (PNG/PDF export is implemented).
- A **furniture palette** with a library of draggable/rotatable pieces (furniture *can* be placed
  today via the Room tool with type "furniture", but there's no curated catalogue yet).
- Automatic room detection from freehand wall drawing (rooms are drawn as rectangles directly,
  which covers the vast majority of home layouts and is what "click a dimension, type a new
  number" needs to work reliably).
- Sloped/gable/hip roof 3D geometry (the Elevation Design Studio lets you *pick* these styles and
  they show correctly on the flat elevation drawings; the 3D model currently always builds a
  flat-RCC-style roof slab + parapet).

## Known limitations worth knowing about

- Wall thickness is one value per room edge (with an exterior/interior override baked into the
  sample project); there's no separate UI yet to mark an individual edge as exterior on
  rooms you draw yourself — every edge of a new room uses the room's single "Wall thickness"
  field.
- The production bundle is a bit heavy (~1.8 MB before gzip, mostly Three.js + pdf.js) — fine
  for local/family use; if you ever host it publicly, code-splitting the PDF and 3D libraries
  behind dynamic `import()` would shrink the initial load.
