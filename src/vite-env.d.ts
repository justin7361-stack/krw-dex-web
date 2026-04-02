/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_ORDER_SETTLEMENT_ADDRESS: string;
  readonly VITE_PAIR_REGISTRY_ADDRESS: string;
  readonly VITE_MARGIN_REGISTRY_ADDRESS: string;
  readonly VITE_HYBRID_POOL_ADDRESS: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_TESTNET_ADMIN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
