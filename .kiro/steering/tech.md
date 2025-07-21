# Technology Stack

## Core Technologies

- **React 18** - UI framework with React Refresh for hot reloading
- **Webpack 5** - Module bundler with Webpack Dev Server 4
- **TypeScript** - Optional static typing (mixed JS/TS codebase)
- **Babel** - JavaScript transpilation with React preset
- **Chrome Extension Manifest V3** - Latest Chrome extension API

## Build System

- **Webpack Configuration** - Custom config in `webpack.config.js`
- **Multi-entry Setup** - Separate bundles for each extension page
- **Hot Reload** - Excludes background, contentScript, and devtools from HMR
- **Asset Processing** - Handles CSS, SCSS, images, and static files
- **Environment Variables** - Supports development/production modes

## Code Quality Tools

- **ESLint** - Uses `react-app` config with Chrome globals
- **Prettier** - Code formatting with single quotes and ES5 trailing commas
- **TypeScript** - Strict mode enabled, targets ES5 with modern libs

## Common Commands

```bash
# Development server with hot reload
npm start

# Production build for Chrome Web Store
NODE_ENV=production npm run build

# Code formatting
npm run prettier

# Custom port for dev server
PORT=6002 npm start
```

## Key Dependencies

- **React/React-DOM** - UI framework
- **@types/chrome** - Chrome extension API types
- **sass/sass-loader** - SCSS support
- **copy-webpack-plugin** - Static asset copying
- **html-webpack-plugin** - HTML generation for each page
- **terser-webpack-plugin** - Production minification

## Secrets Management

- Environment-specific secrets in `secrets.<NODE_ENV>.js` files
- Import via `secrets` module alias
- Files are gitignored for security