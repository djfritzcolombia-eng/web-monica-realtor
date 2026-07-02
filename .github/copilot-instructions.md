# Copilot Instructions for AI Agents

## Project Overview
- This is a React project bootstrapped with Vite (`vite.config.js`).
- Source code is in `src/` with a clear separation of concerns:
  - `components/` and `components/cards/`: Reusable UI components (e.g., `Hero.jsx`, `CardGrid.jsx`, `BlogCard.jsx`).
  - `cards/`: Additional card components for projects and properties.
  - `pages/`: Top-level page components (e.g., `SRHome.jsx`).
  - `services/`: API and data access logic (`api.js`, `httpClient.ts`, `wasiService.ts`).
  - `data/`: Mock data for development/testing.
  - `hooks/`: Custom React hooks (e.g., `useWasiSearch.ts`).
  - `styles/`: Centralized styling (`styles.js`, plus CSS modules).
- Static assets are in `public/` and `src/assets/`.

## Key Patterns & Conventions
- **Component Structure:**
  - Use functional React components with hooks.
  - Co-locate CSS modules with components when needed (e.g., `WasiPropertyCard.module.css`).
  - Prefer composition over inheritance for UI building blocks.
- **Data Flow:**
  - API/data fetching is abstracted in `services/`.
  - Use custom hooks for encapsulating logic (see `hooks/useWasiSearch.ts`).
  - Mock data in `data/mockData.js` is used for local development.
- **Styling:**
  - Use CSS modules for component-specific styles.
  - Global resets and shared styles in `components/GlobalReset.jsx` and `styles/`.

## Developer Workflows
- **Development:**
  - Start dev server: `npm run dev`
  - Build for production: `npm run build`
  - Preview production build: `npm run preview`
- **Linting:**
  - Run ESLint: `npm run lint` (config in `eslint.config.js`)
- **Testing:**
  - No test directory or scripts detected; add tests in `src/` as needed.
- **Firebase Integration:**
  - `firebase.json` present; project may be deployed to Firebase Hosting.

## Integration & External Dependencies
- Uses Vite for build tooling and HMR.
- React is the primary UI library.
- API integration is handled via `services/` (see `api.js`, `httpClient.ts`, `wasiService.ts`).
- No Redux or global state management detected; state is local or via hooks.

## Examples
- To add a new card type, create a component in `components/cards/` and import it where needed.
- To fetch data, add a function to `services/api.js` and call it from a hook or component.

## References
- See `vite.config.js` for build customization.
- See `README.md` for Vite/React basics.
- See `src/pages/SRHome.jsx` for a page-level example.

---
If you are unsure about a pattern or workflow, check for similar usage in `src/components/` and `src/services/` first.
