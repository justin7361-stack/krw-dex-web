import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuthStore } from '@/store/authStore';

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const apiKey  = useAuthStore((s) => s.apiKey);
  const keyOwner = useAuthStore((s) => s.keyOwner);

  return useMutation({
    mutationFn: (orderId: string) =>
      api.delete<{ success: boolean }>(`/orders/${orderId}`, apiKey ?? undefined),

    onSuccess: () => {
      if (keyOwner) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.openOrders(keyOwner),
        });
      }
    },
  });
}
