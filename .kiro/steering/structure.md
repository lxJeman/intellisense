# Project Structure

## Root Directory

- **src/** - All extension source code
- **utils/** - Build utilities and development tools
- **build/** - Generated output directory (gitignored)
- Configuration files at root level

## Source Organization (`src/`)

### Pages Architecture
Each Chrome extension page type has its own directory under `src/pages/`:

- **Background/** - Service worker (`index.js`)
- **Content/** - Content scripts (`index.js`) with styles and modules
- **Popup/** - Extension popup UI (React JSX)
- **Options/** - Extension options page (React TSX - TypeScript example)
- **Newtab/** - New tab replacement page (React JSX)
- **Devtools/** - Developer tools integration
- **Panel/** - DevTools panel (React TSX)

### Shared Resources
- **assets/img/** - Icons and images (icon-128.png, icon-34.png, logo.svg)
- **containers/** - Reusable React components (e.g., Greetings)
- **manifest.json** - Chrome extension manifest

## File Naming Conventions

- **React Components** - PascalCase (e.g., `Popup.jsx`, `Options.tsx`)
- **Entry Points** - `index.js` or `index.jsx` in each page directory
- **Styles** - Component name + extension (e.g., `Popup.css`, `Options.css`)
- **HTML Templates** - `index.html` in each page directory

## Language Usage Patterns

- **JavaScript** - Default for most files (`.js`, `.jsx`)
- **TypeScript** - Used selectively (Options and Panel pages as examples)
- **Mixed Approach** - Both JS and TS coexist in the same project

## Build Output Structure

Webpack generates these files in `build/`:
- `[pagename].bundle.js` - Bundled JavaScript for each page
- `[pagename].html` - Generated HTML files
- `manifest.json` - Processed manifest with package.json data
- Static assets (icons, CSS files)

## Key Architectural Patterns

- **Page-based Organization** - Each extension page is self-contained
- **Shared Components** - Reusable UI components in `containers/`
- **Asset Co-location** - Styles and components kept together
- **Entry Point Convention** - Each page has an `index` file as entry point