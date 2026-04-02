import { useState } from 'react';
import { useAccount } from 'wagmi';

import { useAuthStore } from '@/store/authStore';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

const ADMIN_API_KEY = import.meta.env['VITE_TESTNET_ADMIN_API_KEY'] ?? '';
const API_BASE      = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';

/**
 * ApiKeyModal — registers a new trading API key for the connected wallet.
 *
 * ⚠️  TESTNET ONLY: Uses VITE_TESTNET_ADMIN_API_KEY for self-registration.
 * Production requires a separate key registration server.
 */
export function ApiKeyModal({ isOpen, onClose }: Props) {
  const { address } = useAccount();
  const setApiKey   = useAuthStore((s) => s.setApiKey);
  const existingKey = useAuthStore((s) => s.apiKey);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  if (!isOpen) return null;

  const handleRegister = async () => {
    if (!address) {
      setError('지갑을 먼저 연결하세요.');
      return;
    }
    if (!ADMIN_API_KEY) {
      setError('환경 변수 VITE_TESTNET_ADMIN_API_KEY가 설정되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_API_KEY}`,
        },
        body: JSON.stringify({
          address,
          role: 'OPERATOR',
          description: `Web client key for ${address}`,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`등록 실패 (${res.status}): ${body}`);
      }

      const data = await res.json() as { apiKey: string; role: string };
      setApiKey(data.apiKey, data.role as 'OPERATOR', address);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-color-layer-2 border border-color-border rounded-xl p-6 w-[400px] max-w-[90vw] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spacedRow">
          <h2 className="text-medium font-semibold text-color-text-2">API 키 등록</h2>
          <button onClick={onClose} className="text-color-text-0 hover:text-color-text-1 text-large">×</button>
        </div>

        {existingKey && !success && (
          <div className="p-3 bg-color-layer-3 rounded-lg border border-color-border">
            <p className="text-tiny text-color-text-0">이미 API 키가 등록되어 있습니다.</p>
            <p className="text-tiny tabular-nums text-color-text-1 mt-1 break-all">
              {existingKey.slice(0, 20)}...
            </p>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-color-positive-faded rounded-lg border border-color-positive">
            <p className="text-small text-color-positive font-medium">✓ API 키 등록 완료!</p>
            <p className="text-tiny text-color-text-1 mt-1">이제 주문을 제출할 수 있습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 text-tiny text-color-text-0">
              <p>거래를 위해 서버 API 키가 필요합니다.</p>
              <p className="text-color-warning">
                ⚠️ 테스트넷 전용: 메인넷에서는 별도 키 등록 서버를 사용합니다.
              </p>
            </div>

            <div className="bg-color-layer-3 rounded-lg p-3 text-tiny text-color-text-0">
              <span className="text-color-text-1">연결된 지갑: </span>
              <span className="tabular-nums break-all">{address ?? '미연결'}</span>
            </div>

            {error && (
              <div className="p-3 bg-color-error/10 border border-color-error rounded-lg">
                <p className="text-tiny text-color-error">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg bg-color-layer-3 text-small text-color-text-1 hover:bg-color-layer-4 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRegister}
                disabled={isLoading || !address}
                className="flex-1 py-2.5 rounded-lg bg-color-accent text-white text-small font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {isLoading ? '등록 중...' : 'API 키 발급'}
              </button>
            </div>
          </>
        )}

        {success && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-color-layer-3 text-small text-color-text-1"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}
