import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignTypedData } from 'wagmi';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { getOrderDomain } from '@/lib/eip712/domain';
import { ORDER_TYPES, type OrderMessage } from '@/lib/eip712/types';
import { useAuthStore } from '@/store/authStore';
import type { MarginMode, StpMode, SubmitOrderResponse, TimeInForce } from '@/types/api';

interface SubmitOrderVars {
  order:       OrderMessage;
  // Optional metadata sent alongside the signed order
  leverage?:    bigint;
  marginMode?:  MarginMode;
  timeInForce?: TimeInForce;
  stpMode?:     StpMode;
}

/**
 * Submit a signed EIP-712 order to the server.
 *
 * Flow:
 *   1. Sign the 9-field OrderMessage with useSignTypedData (wagmi)
 *   2. POST to /orders with the order + signature
 *   3. Invalidate open orders cache
 */
export function useSubmitOrder() {
  const queryClient   = useQueryClient();
  const apiKey        = useAuthStore((s) => s.apiKey);
  const keyOwner      = useAuthStore((s) => s.keyOwner);
  const { signTypedDataAsync } = useSignTypedData();

  return useMutation({
    mutationFn: async (vars: SubmitOrderVars): Promise<SubmitOrderResponse> => {
      const { order, leverage, marginMode, timeInForce, stpMode } = vars;

      // 1. Sign
      const signature = await signTypedDataAsync({
        domain: getOrderDomain(),
        types:  ORDER_TYPES,
        primaryType: 'Order',
        message: order,
      });

      // 2. Submit to server
      const body = {
        maker:      order.maker,
        taker:      order.taker,
        baseToken:  order.baseToken,
        quoteToken: order.quoteToken,
        price:      order.price.toString(),
        amount:     order.amount.toString(),
        isBuy:      order.isBuy,
        nonce:      order.nonce.toString(),
        expiry:     order.expiry.toString(),
        signature,
        ...(leverage    && { leverage:    leverage.toString() }),
        ...(marginMode  && { marginMode }),
        ...(timeInForce && { timeInForce }),
        ...(stpMode     && { stpMode }),
      };

      return api.post<SubmitOrderResponse>('/orders', body, apiKey ?? undefined);
    },

    onSuccess: () => {
      // Invalidate open orders cache for the connected wallet
      if (keyOwner) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.openOrders(keyOwner) });
      }
    },
  });
}
