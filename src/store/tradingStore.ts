import { create } from 'zustand';
import type { CandleResolution, MarginMode, OrderType, TimeInForce } from '@/types/api';

// ─── Trading Store ────────────────────────────────────────────────────────────
// Client-side trading UI state (not persisted).

interface OrderFormState {
  side:        'buy' | 'sell';
  orderType:   OrderType;
  priceInput:  string;   // raw user input (string, not bigint)
  amountInput: string;   // raw user input (string, not bigint)
  leverage:    number;   // 1–100x
  marginMode:  MarginMode;
  timeInForce: TimeInForce;
}

interface TradingState {
  // Currently selected trading pair (pairId format)
  selectedPairId: string;

  // Candle chart resolution
  chartResolution: CandleResolution;

  // Order form
  form: OrderFormState;

  // Active bottom tab
  bottomTab: 'openOrders' | 'filled' | 'positions';

  // Actions
  setSelectedPairId:   (pairId: string) => void;
  setChartResolution:  (r: CandleResolution) => void;
  setFormField:        <K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) => void;
  setBottomTab:        (tab: TradingState['bottomTab']) => void;
  resetForm:           () => void;
}

const DEFAULT_FORM: OrderFormState = {
  side:        'buy',
  orderType:   'limit',
  priceInput:  '',
  amountInput: '',
  leverage:    1,
  marginMode:  'cross',
  timeInForce: 'GTC',
};

export const useTradingStore = create<TradingState>((set) => ({
  selectedPairId:  '',
  chartResolution: '1h',
  form:            { ...DEFAULT_FORM },
  bottomTab:       'openOrders',

  setSelectedPairId:  (pairId) => set({ selectedPairId: pairId }),
  setChartResolution: (r)      => set({ chartResolution: r }),
  setFormField:       (key, value) =>
    set((s) => ({ form: { ...s.form, [key]: value } })),
  setBottomTab:       (tab)    => set({ bottomTab: tab }),
  resetForm:          ()       => set({ form: { ...DEFAULT_FORM } }),
}));
