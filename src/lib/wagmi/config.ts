import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { mainnet } from 'wagmi/chains'; // fallback for WalletConnect

// ─── HyperEVM Testnet ───────────────────────────────────────────────────────
export const hyperEvmTestnet = defineChain({
  id: 998,
  name: 'HyperEVM Testnet',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Explorer',
      url: 'https://explorer.hyperliquid-testnet.xyz',
    },
  },
  testnet: true,
});

// ─── HyperEVM Mainnet (future) ───────────────────────────────────────────────
export const hyperEvmMainnet = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Explorer',
      url: 'https://explorer.hyperliquid.xyz',
    },
  },
});

// ─── Active chain (determined by env) ────────────────────────────────────────
const chainId = Number(import.meta.env['VITE_CHAIN_ID'] ?? 998);
export const activeChain = chainId === 999 ? hyperEvmMainnet : hyperEvmTestnet;

// ─── Wagmi + RainbowKit config ────────────────────────────────────────────────
export const wagmiConfig = getDefaultConfig({
  appName: 'HyperKRW DEX',
  projectId: import.meta.env['VITE_WALLETCONNECT_PROJECT_ID'] ?? '',
  chains: [activeChain, mainnet], // mainnet included for WalletConnect compatibility
  ssr: false,
});
