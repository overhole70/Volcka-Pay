/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Environment variables are now handled securely on the server side
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
