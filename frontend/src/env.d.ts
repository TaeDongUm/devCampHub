/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string; // 환경변수(선택)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
