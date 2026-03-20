// base URL is pulled from React env var so it can match whatever port the backend
// is running on.  You can set REACT_APP_API_BASE_URL when starting the dev server
// (create‑react‑app automatically exposes variables prefixed with REACT_APP_).
// Fallback to 8081 which is the default port we use in this workspace.
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";