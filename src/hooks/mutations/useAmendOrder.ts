import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuthStore } from '@/store/authStore';

export interface AmendOrderRequest {
  orderId: string;
  price?:  string;  // bigint as decimal string
  amount?: string;  // bigint as decimal string
}

export interface AmendOrderResponse {
  orderId: string;
  status:  string;
}

export function useAmendOrder() {
  const queryClient = useQueryClient();
  const apiKey  = useAuthStore((s) => s.apiKey);
  const keyOwner = useAuthStore((s) => s.keyOwner);

  return useMutation({
    mutationFn: ({ orderId, price, amount }: AmendOrderRequest) =>
      api.patch<AmendOrderResponse>(
        `/orders/${orderId}`,
        { price, amount },
        apiKey ?? undefined,
      ),

    onSuccess: () => {
      if (keyOwner) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.openOrders(keyOwner),
        });
      }
    },
  });
}
