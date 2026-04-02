# HyperKRW DEX — Frontend (krw-dex-web) CLAUDE.md

This is the **HyperKRW DEX Frontend**: React + Vite SPA for the HyperKRW CLOB DEX on HyperEVM.

- **Repo:** https://github.com/justin7361-stack/krw-dex-web
- **Stack:** React 18, Vite 5, TypeScript, wagmi v2, viem v2, RainbowKit v2, TanStack Query v5, Zustand v5, lightweight-charts v5, Tailwind CSS v3
- **Server:** https://github.com/justin7361-stack/krw-dex-server (REST + WebSocket)
- **Contracts:** https://github.com/justin7361-stack/HyperEVM-KRW-DEX

---

## 세션 규칙 (Session Rules)

### 세션 시작 시 반드시:
1. `docs/`의 **모든 `*_review.md` 파일**과 `docs/research.md`를 읽어 이전 리뷰 결과, 알려진 버그, 설계 결정 히스토리를 숙지
2. `docs/tmr_todo.md` 읽기 — 현재 태스크, 우선순위, 설계 결정사항 파악
3. `git log --oneline -10` 실행 — 최근 커밋 히스토리로 맥락 파악
4. `npm run typecheck` 실행 — 현재 TS 에러 확인
5. 새로운 todo 작성 시 반드시 review.md의 Critical/Important 이슈를 반영하여 우선순위 결정

### 세션 종료 시 반드시:
1. `docs/tmr_todo.md` 업데이트 (설계 결정사항, 주의사항, 다음 세션에 알아야 할 것 포함)
2. 작업 내용 GitHub에 커밋/푸시

---

## 아키텍처 개요

```
src/
├── lib/
│   ├── wagmi/          → HyperEVM 체인 정의 + wagmi config + ABIs
│   ├── eip712/         → 9-field ORDER_TYPES + buildOrder 헬퍼
│   ├── bigint/         → JSON reviver + format + math 유틸
│   ├── api/            → fetch 래퍼 (bigintReviver 적용) + queryKeys
│   └── pair/           → pairId ↔ URL slug 변환
├── hooks/
│   ├── api/            → useOrderbook, useTrades, useCandles, usePairs, etc.
│   ├── mutations/      → useSubmitOrder, useCancelOrder (EIP-712 서명 포함)
│   ├── ws/             → useWebSocket (싱글톤 WS 매니저)
│   └── chain/          → useNonce (비트맵 nonce 배치 조회)
├── store/
│   ├── tradingStore.ts → Zustand (selectedPair, 주문폼 상태, chartResolution)
│   └── authStore.ts    → Zustand+persist (apiKey, keyRole, keyOwner)
├── providers/
│   └── AppProviders.tsx → WagmiProvider + QueryClientProvider + RainbowKitProvider
├── pages/
│   ├── trade/          → TradingPage (메인 거래 화면)
│   ├── swap/           → SwapPage (HybridPool AMM)
│   └── portfolio/      → PortfolioPage (자산 + 펀딩)
└── components/
    ├── layout/         → AppShell, TopNav
    └── trading/        → Orderbook, CandleChart, OrderForm, PositionPanel, BottomTabs
```

---

## 핵심 규칙 (반드시 준수)

### 1. BigInt 경계 규칙 (최중요)

서버의 모든 수치 필드는 **JSON 문자열**로 직렬화됨. `JSON.parse` 시 반드시 `bigintReviver` 사용:

```typescript
// src/lib/api/client.ts가 자동으로 적용함
const data = JSON.parse(text, bigintReviver);
```

**`Number()` 변환이 허용되는 유일한 두 곳:**
1. `src/components/trading/CandleChart.tsx` — `toNumber(bigint)` (lightweight-charts 요구)
2. `Intl.NumberFormat` 포맷팅 직전 (formatKRW, formatAmount 내부)

이외의 곳에서 `Number(bigint)` 사용 절대 금지 — `2^53` 초과 시 정밀도 손실.

### 2. EIP-712 서명 (9-field, isLiquidation 미포함)

```typescript
// src/lib/eip712/types.ts — 절대 변경 금지
export const ORDER_TYPES = {
  Order: [
    { name: 'maker',      type: 'address' },
    { name: 'taker',      type: 'address' },
    { name: 'baseToken',  type: 'address' },
    { name: 'quoteToken', type: 'address' },
    { name: 'price',      type: 'uint256' },
    { name: 'amount',     type: 'uint256' },
    { name: 'isBuy',      type: 'bool'    },
    { name: 'nonce',      type: 'uint256' },
    { name: 'expiry',     type: 'uint256' },
  ],
} as const;
// ⚠️ isLiquidation 추가 시 서버 서명 검증 실패
```

### 3. pairId URL 인코딩

- 서버 형식: `"0xBASE/0xQUOTE"` (슬래시 구분)
- URL slug 형식: `"0xBASE--0xQUOTE"` (이중 대시)
- REST API 호출 시: 반드시 `encodePairId(pairId)` 사용 (`encodeURIComponent`)

### 4. WebSocket 싱글톤

`useWsStream(pairId, handler)` 훅이 내부적으로 싱글톤 WS를 관리:
- 같은 pairId에 여러 컴포넌트가 구독해도 WS 연결은 1개
- 30초 ping/pong heartbeat 자동 처리
- 지수 백오프 자동 재연결 (500ms → 30s)

### 5. API Key 등록 (테스트넷 한정)

`POST /admin/api-keys`는 Admin Bearer 토큰 필요 → 프로덕션에서 프론트엔드 직접 호출 불가.
테스트넷: `.env.local`의 `VITE_TESTNET_ADMIN_API_KEY`로 자기등록.
**메인넷 전 별도 Key Registration 서버 구축 필수.**

---

## 개발 명령어

```bash
npm run dev          # 개발 서버 (port 3001)
npm run build        # 프로덕션 빌드
npm run typecheck    # tsc --noEmit (커밋 전 반드시 실행)
npm run preview      # 빌드 결과 미리보기
```

## 환경 변수

`.env.example`을 복사하여 `.env.local` 생성 후 사용:
```bash
cp .env.example .env.local
```

주요 변수:
- `VITE_API_URL` — 서버 REST API URL (기본: http://localhost:3000)
- `VITE_WS_URL`  — 서버 WebSocket URL (기본: ws://localhost:3000)
- `VITE_CHAIN_ID` — 998 (testnet) 또는 999 (mainnet)
- `VITE_ORDER_SETTLEMENT_ADDRESS` — 배포된 OrderSettlement 주소

---

## Re-render 격리 전략

- `Orderbook` → `React.memo` + 내부 WS 구독 (pairId prop만)
- `CandleChart` → `useRef` 기반 명령형 차트 (React re-render 없이 차트 업데이트)
- `OrderForm` → `tradingStore` Zustand 구독만 (props 없음)
- `PositionPanel`, `BottomTabs` → 각자 독립 useQuery 인스턴스

---

## 중요 참조 파일

| 파일 | 이유 |
|------|------|
| `krw-dex-server/src/verification/EIP712Verifier.ts` | 9-field 서명 타입 일치 확인 |
| `krw-dex-server/src/types/order.ts` | API 응답 타입 원본 |
| `krw-dex-server/src/api/websocket/stream.ts` | WS 메시지 형식 |
| `krw-dex-contracts/src/PairRegistry.sol` | pairs() struct 필드 순서 (ABI 작성 시) |
| `krw-dex-contracts/src/OrderSettlement.sol` | EIP-712 도메인 파라미터 |

---

## 라이선스

이 레포지토리는 dYdX v4-web 포크 기반으로 **AGPL v3** 라이선스를 따릅니다.
메인넷 상업화 시 라이선스 전략 재검토 필요 (GMX v2 MIT 포크 또는 스크래치).
