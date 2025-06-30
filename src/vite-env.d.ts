/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react/jsx-runtime" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_NEWS_API_KEY: string;
  readonly VITE_CRYPTO_PANIC_API_KEY: string;
  readonly VITE_BINANCE_API_KEY: string;
  readonly VITE_BINANCE_SECRET_KEY: string;
  readonly VITE_ENVIRONMENT: 'development' | 'production' | 'staging';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
