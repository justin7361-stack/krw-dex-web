# HyperKRW DEX Web — Task List

## 현재 상태 (2026-04-02)

**완료:** F-0 (초기 프로젝트 구조) + F-1 (신규 레이어 개발) + F-2 (트레이딩 페이지) + F-3 (스왑/포트폴리오) 기본 구현 완료
- TypeScript 타입체크: ✅ 클린
- 프로덕션 빌드: ✅ 성공

---

## 다음 세션에 할 일

### [HIGH] UI 완성도 개선

1. **ApiKeyModal 구현** — 현재 미구현
   - `VITE_TESTNET_ADMIN_API_KEY` 사용하여 자기등록
   - `POST /admin/api-keys` → `authStore.setApiKey()`
   - 모달 오픈 트리거: OrderForm에서 apiKey 없을 때

2. **WS 연결 상태 표시** — TopNav에 실시간/연결중단 배지
   - WebSocket readyState → green "실시간" / yellow "재연결 중"

3. **Skeleton 로딩 상태** — Orderbook은 구현됨, Chart/OrderForm/Positions 미구현

4. **React Error Boundary** — 각 패널별 독립 에러 처리 필요
   - Orderbook, CandleChart, OrderForm, PositionPanel 각각 감싸기

5. **PositionPanel 실제 포지션 표시** — 현재 placeholder
   - `GET /positions/:address` API 엔드포인트 연동 필요
   - 서버에 positions 엔드포인트가 없으면 추가 필요

### [MEDIUM] 기능 완성

6. **주문 수정(Amend)** — `useAmendOrder` 뮤테이션 미구현
   - `PATCH /orders/:id` 연동

7. **마진 추가/출금** — `useAddMargin` 미구현

8. **체결 내역 탭** — BottomTabs의 "체결 내역" 현재 placeholder
   - `GET /orders/:address?status=filled` 연동

9. **CandleChart WS 업데이트 개선**
   - 현재: 최신 trade price로 단순 tick 업데이트
   - 개선: 서버가 캔들 업데이트를 WS로 전송하면 실제 OHLC 반영

10. **TopNav 페어 심볼** — 현재 토큰 주소 기반, 서버에서 symbol 정보 가져와야 함
    - `GET /pairs` 응답에 baseSymbol/quoteSymbol 포함 여부 확인

### [LOW] 품질 개선

11. **번들 사이즈 최적화** — 현재 wagmi/viem 청크가 1MB 이상
    - `vite.config.ts`에 `manualChunks` 설정으로 코드 분할

12. **모바일 레이아웃** — 트레이딩 페이지 모바일 대응 (태블릿/모바일 브레이크포인트)

13. **.env.local 설정** — 실제 배포된 컨트랙트 주소 입력 후 테스트

---

## 설계 결정사항 & 주의사항

### BigInt 경계
- 서버 API 응답의 price/amount 등은 모두 bigint (bigintReviver 적용됨)
- `toNumber()` 변환: `CandleChart.tsx` 와 `formatKRW/formatAmount` 내부에서만 허용
- `Number(bigint)` 직접 사용 절대 금지

### EIP-712 9-field
- `src/lib/eip712/types.ts`의 ORDER_TYPES 절대 변경 금지
- isLiquidation 필드 추가 시 서버 서명 검증 실패

### WS 싱글톤
- `subscribeToStream(pairId, handler)` → 같은 pairId 연결 공유
- 30초 ping/pong heartbeat 자동 처리됨
- 재연결: 지수 백오프 (500ms → 30s)

### API Key 흐름 (테스트넷)
- `VITE_TESTNET_ADMIN_API_KEY` 환경변수 설정 필요
- 메인넷 전 별도 Key Registration 서버 구축 필수

### pairId URL 인코딩
- URL slug: `--` (이중 대시) ↔ 서버 pairId: `/` (슬래시)
- REST 호출 시: `encodePairId(pairId)` 반드시 사용

---

## 완료된 작업

### 2026-04-02 (초기 커밋)
- dYdX v4-web 포크 (shallow clone) + 대부분 src 초기화
- 신규 HyperKRW 레이어 전체 구현:
  - `src/lib/wagmi/` (config, abis, contracts)
  - `src/lib/eip712/` (domain, types, buildOrder)
  - `src/lib/bigint/` (reviver, format)
  - `src/lib/api/` (client, queryKeys)
  - `src/lib/pair/` (pairId utils)
  - `src/hooks/api/` (useOrderbook, useTrades, useCandles, useOpenOrders, useFundingRate, usePairs)
  - `src/hooks/ws/` (useWebSocket 싱글톤)
  - `src/hooks/mutations/` (useSubmitOrder, useCancelOrder)
  - `src/hooks/chain/` (useNonce)
  - `src/store/` (tradingStore, authStore)
  - `src/providers/` (AppProviders)
  - `src/pages/` (TradingPage, SwapPage, PortfolioPage)
  - `src/components/trading/` (Orderbook, CandleChart, OrderForm, PositionPanel, BottomTabs)
  - `src/components/layout/` (AppShell, TopNav)
- TypeScript 타입체크 클린 ✅
- 프로덕션 빌드 성공 ✅
