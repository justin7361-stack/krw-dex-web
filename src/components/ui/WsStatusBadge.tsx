import { useWsStatus } from '@/hooks/ws/useWsStatus';

interface Props {
  pairId: string;
}

const STATUS_CONFIG = {
  connecting:   { label: '연결 중', color: 'bg-color-warning', dot: 'animate-pulse' },
  connected:    { label: '실시간', color: 'bg-color-positive', dot: '' },
  disconnected: { label: '연결 중단', color: 'bg-color-error', dot: 'animate-pulse' },
};

export function WsStatusBadge({ pairId }: Props) {
  const status = useWsStatus(pairId);
  const { label, color, dot } = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-color-layer-3 border border-color-border">
      <span className={`w-1.5 h-1.5 rounded-full ${color} ${dot}`} />
      <span className="text-tiny text-color-text-0">{label}</span>
    </div>
  );
}
