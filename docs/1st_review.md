# HyperKRW DEX Web — 1차 코드 리뷰 (krw-dex-web)

**최초 작성:** 2026-04-02 / **마지막 업데이트:** 2026-04-02 (2차 세션)
**Reviewer:** Claude Sonnet 4.6
**Scope:** krw-dex-web 전체 (F-0~F-4 + E-1~E-2 + F-1~F-2 + G-1 버그 수정)
**상태:** MVP 구현 완료 + 주요 버그 수정 완료 + CLI E2E 전 항목 통과

---

## 1. Executive Summary

| 영역 | 등급 | 비고 |
|------|------|------|
| 아키텍처 | **A-** | 레이어 분리 명확, re-render 격리 전략 양호 |
| EIP-712 연동 | **A** | 9-field 정확 구현, wagmi signTypedData 올바르게 사용 |
| BigInt 경계 관리 | **A** | reviver 일관 적용, Number() 변환 2곳 제한 |
| 상태 관리 | **B+** | Zustand v5 올바른 사용, persist 적절 |
| WS 싱글톤 | **A-** | 30s ping/pong, 지수 백오프 구현 양호 |
| UI 완성도 | **B** | 트레이딩 레이아웃 완성, 일부 placeholder 존재 |
| 서버 API 정합성 | **B+** | BigInt 직렬화·마진·포지션·펀딩 수정 완료 |
| 테스트 커버리지 | **D** | 프론트엔드 테스트 전혀 없음 |

---

## 2. 잘 된 점 (Strengths)

### 2.1 BigInt 경계 규칙 철저 준수
```typescript
// src/lib/bigint/reviver.ts — 서버 JSON의 모든 수치 필드를 bigint로 변환
export function bigintReviver(key: string, value: unknown): unknown {
  if (typeof value === 'string' && BIGINT_KEYS.has(key)) return BigInt(value)
  return value
}
```
- `Number()` 변환을 CandleChart.tsx와 format.ts 내부로 완전 제한
- `2^53` 초과 정밀도 손실 위험 없음

### 2.2 EIP-712 9-field 정확 구현
- `isLiquidation` 필드 미포함 — 서버 EIP712Verifier.ts와 정확히 일치
- `buildLimitOrder` / `buildMarketOrder` 헬퍼 함수로 실수 가능성 차단

### 2.3 WS 싱글톤 아키텍처
- `Map<pairId, WsEntry>` — 동일 pairId에 대한 중복 연결 방지
- heartbeat interval + 지수 백오프 재연결 구현됨
- `handlerRef` 패턴으로 stale closure 방지

### 2.4 Re-render 격리
- `Orderbook` → React.memo + 독립 WS 구독
- `CandleChart` → useRef 기반 명령형, React re-render 없이 chart 업데이트
- `OrderForm` → tradingStore 구독만 (pairId prop 불필요)

### 2.5 usePairs 컨트랙트 직접 읽기
- 서버 `/pairs` 엔드포인트 없이 PairRegistry 컨트랙트 직접 읽기
- `getAllPairIds()` → `pairs(bytes32)` → `symbol()` 3단계 배치 읽기

---

## 3. Critical Issues → ✅ 모두 수정 완료 (2차 세션)

### ~~C-1. 서버 `GET /orders/:address` BigInt 직렬화 에러~~ ✅ 수정됨
**커밋:** `2339d1d` (krw-dex-server)
**수정 내용:**
- `StoredOrder` optional bigint 필드(`leverage`, `triggerPrice`, `goodTillTime`) 모두 `.toString()` 처리
- `orderId: o.id` 매핑 추가 (프론트 호환)
- `useOpenOrders.ts`: `{ orders: [] }` 래퍼 처리 + `normalizeOrder()` + `useFilledOrders` 추가

### ~~C-2. marginMode 포함 주문 → "Insufficient margin"~~ ✅ 수정됨
**커밋:** `2339d1d` (krw-dex-server)
**수정 내용:** `POST/GET /margin/deposit·withdraw·:address` 신규 라우트 추가

---

## 4. Important Issues

### ~~I-1. 서버에 `/pairs` 엔드포인트 없음~~ → 해결책 유지
**현황:** `usePairs.ts`가 PairRegistry 컨트랙트 직접 읽기로 해결. 서버 `/pairs` 장기 추가는 Phase H로 이관.

### ~~I-2. `GET /positions/:address` 엔드포인트 없음~~ ✅ 수정됨
**커밋:** `2339d1d` (krw-dex-server)
**수정 내용:**
- `positionsRoutes.ts` 신규 추가: `GET /positions/:address`
- `usePositions.ts` 훅 추가, `PositionPanel.tsx` + `BottomTabs.tsx` 연동
- bigint 직렬화 완전 처리 (`size`, `margin`, `markPrice`, `unrealizedPnl`, `totalBalance`, `freeMargin`)

### I-3. 프론트엔드 테스트 전무 (미해결 — Phase H)
**현상:** `src/` 전체에 테스트 파일 없음
**위험:** 핵심 유틸리티(bigint format, pairId 변환, EIP-712 order build) 회귀 감지 불가
**다음 단계:** Phase H — Vitest로 lib/bigint, lib/pair, lib/eip712 단위 테스트 추가

### ~~I-4. BottomTabs "체결 내역" 탭 미구현~~ ✅ 수정됨
**커밋:** `37f6455` (krw-dex-web)
- `useFilledOrders` 훅 추가 (`GET /orders/:address?status=filled`)
- `FilledOrdersTable` 컴포넌트 추가
- `PositionsTable` 컴포넌트 추가 (totalBalance/freeMargin 헤더 포함)
- 탭 레이블에 실시간 카운트 표시

### I-5. TopNav 페어 셀렉터 미구현 (미해결 — Phase H)
**현상:** 페어 변경 UI 없음, 주소 앞 8자리만 표시
**다음 단계:** Phase H — usePairs() 결과로 드롭다운 구성, baseSymbol/quoteSymbol 표시

---

## 5. Minor Issues

### M-1. .env.local이 gitignore되지 않을 수 있음
- `.env.local`에 `VITE_TESTNET_ADMIN_API_KEY`가 포함됨
- `.gitignore`에 `.env.local` 포함 여부 확인 필요

### M-2. ApiKeyModal — role 매핑 불일치
- 서버의 `ApiKeyRole`: `'read' | 'trade'`
- 프론트 `authStore`의 `KeyRole`: `'ADMIN' | 'OPERATOR' | 'READ_ONLY'`
- ApiKeyModal이 서버 응답 없이 `'OPERATOR'`로 하드코딩 중
- 장기적으로 타입 통일 필요

### M-3. CandleChart WebSocket 업데이트 단순화
- 현재: 최신 trade price만 반영 (tick update)
- 이상적: 서버가 WS로 OHLC candle update 메시지 전송 필요
- 현재 구현은 실시간 가격 반영에는 충분

### M-4. wagmiConfig에 WalletConnect projectId 없음
- `VITE_WALLETCONNECT_PROJECT_ID=` 빈 값
- 로컬 MetaMask 테스트에는 무관하지만 배포 전 필수 설정

### M-5. vite-env.d.ts VITE_HYBRID_POOL_ADDRESS 미사용
- SwapPage에서 `VITE_HYBRID_POOL_ADDRESS` 사용하지만 `.env.local`에 `0x000...`으로 설정
- 스왑 기능 테스트 시 실제 HybridPool 주소 필요

---

## 6. 아키텍처 평가

### 레이어 구조 (양호)
```
UI (components) → hooks (api/mutations/ws/chain) → lib (eip712/bigint/api) → store (zustand)
```
- 단방향 의존성 잘 지켜짐
- lib 레이어는 React 의존성 없음 (테스트 용이)

### 상태 관리 분리 (양호)
- `tradingStore` — UI 상태 (주문폼, 선택 페어, 차트 해상도)
- `authStore` — 인증 상태 (apiKey, persist)
- 서버 상태 — TanStack Query (캐싱, 재조회)
- 체인 상태 — wagmi

### 개선 필요
- `TradingPage.tsx`에서 `pairId.split('/')` 직접 호출 → `parsePairId()` 사용 권장
- `useSubmitOrder.ts`의 bigint → string 직렬화 로직이 분산됨

---

## 7. E2E 검증 결과

### 1차 세션 (2026-04-02)
| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| 컨트랙트 배포 (Deploy.s.sol) | ✅ | Anvil chainId=998 |
| Config.s.sol 실행 | ✅ | 역할 권한 + InsuranceFund 연결 |
| wBTC/KRW 페어 등록 | ✅ | PairRegistry.addToken + addPair |
| 서버 시작 (1 pair 로드) | ✅ | fastify@4 + @fastify/static@7 |
| API key 등록 | ✅ | POST /admin/api-keys → `{"registered":true}` |
| EIP-712 서명 (9-field) | ✅ | viem signTypedData |
| 주문 제출 | ✅ | POST /orders → orderId 반환 |
| 오더북 반영 | ✅ | bids:[{price,amount,orderCount:1}] |
| WS 스트림 | ✅ | orderbook.snapshot 즉시 수신 |
| 프론트 빌드 & 기동 | ✅ | http://localhost:3001 |

### 2차 세션 (2026-04-02 — Phase E/F/G 버그 수정 후 재검증)
| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| GET /orders/:address 직렬화 | ✅ | BigInt fields + optional fields 모두 처리 |
| GET /funding/:pair | ✅ | rate bigint 1e18 스케일, nextFundingAt 포함 |
| GET /positions/:address | ✅ | totalBalance, freeMargin, positions[] |
| GET /margin/:address | ✅ | totalBalance, usedMargin, freeMargin |
| POST /margin/deposit | ✅ | 10M KRW 입금 확인 |
| EIP-712 서명 (domain='KRW DEX') | ✅ | 올바른 도메인명으로 수정 후 통과 |
| 실제 토큰 주소 확인 | ✅ | KRW=0x5FbDB, wBTC=0xc6e7DF (이전 착각 수정) |
| 주문 제출 E2E (CLI) | ✅ | orderId 반환, 오더북 반영 확인 |
| 브라우저 E2E (MetaMask) | 🔲 | G-2~G-4 — 다음 세션

---

## 8. 다음 단계 우선순위 (2차 세션 후 업데이트)

### 완료 ✅
1. ~~서버 BigInt 직렬화 버그 수정 (C-1)~~ → `2339d1d`
2. ~~마진 deposit API 추가 (C-2)~~ → `2339d1d`
3. ~~서버 `GET /positions/:address` 추가 (I-2)~~ → `2339d1d`
4. ~~BottomTabs 체결 내역/포지션 탭 연동 (I-4)~~ → `37f6455`
5. ~~EIP-712 domain name 수정 ('KRW DEX')~~ → `3e3f77a`
6. ~~fundingEngine buildServer 연결 + funding 직렬화~~ → `4eab073`

### 다음 세션 우선순위
1. **[HIGH]** MetaMask 브라우저 E2E (G-2~G-4) — 지갑 연결 → 서명 → 오더북 반영
2. **[HIGH]** TopNav 페어 셀렉터 UI (I-5) — 심볼 표시 + 드롭다운
3. **[MEDIUM]** 프론트엔드 단위 테스트 추가 (I-3) — lib/bigint, lib/pair, lib/eip712
4. **[MEDIUM]** HyperEVM 테스트넷 배포 (Phase I) — HYPE faucet 확보 후
5. **[MEDIUM]** WalletConnect projectId 설정 (배포 전)
6. **[LOW]** 번들 최적화 (manualChunks)
7. **[LOW]** 모바일 레이아웃 대응

---

## 9. 전체 프로젝트 진행 상황 (3개 레포)

| 레포 | 상태 | 주요 완료 사항 |
|------|------|----------------|
| `HyperEVM-KRW-DEX` (contracts) | ✅ 완성 | PairRegistry, OrderSettlement, MarginRegistry, HybridPool, InsuranceFund 배포 가능 |
| `krw-dex-server` | ✅ 완성 | CLOB 매칭, EIP-712 검증, WS 스트림, 포지션/펀딩/청산 엔진 |
| `krw-dex-web` | 🔄 MVP+ | 트레이딩 UI 완성, CLI E2E 통과, 브라우저 E2E 미완 |

**다음 마일스톤:** MetaMask 브라우저 E2E → HyperEVM 테스트넷 배포 → 퍼블릭 베타

---

## 10. 2차 세션 주요 발견 사항 (버그 기록)

### BUG-1: EIP-712 domain name 불일치 (심각도: CRITICAL)
- **현상:** 모든 주문 서명이 서버에서 `"Invalid signature"` 반환
- **원인:** `domain.ts`에 `name: 'HyperKRW'` → 계약은 `__EIP712_init("KRW DEX", "1")`
- **수정:** `domain.ts` → `name: 'KRW DEX'` (커밋 `3e3f77a`)
- **교훈:** 프론트 EIP-712 도메인은 반드시 컨트랙트 소스 확인 후 설정

### BUG-2: Anvil 토큰 주소 착각 (심각도: HIGH)
- **현상:** `isTradeAllowed` 항상 false, 주문 제출 시 `"Trading pair not active"`
- **원인:** `0x5FbDB...`를 wBTC로 착각했지만 실제로는 MockKRW (Deploy.s.sol 첫 번째 new)
  - MockKRW = `0x5FbDB2315678afecb367f032d93F642f64180aa3`
  - MockwBTC = `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d` (수동 등록)
- **수정:** `sign-order.mjs` 주소 교체
- **교훈:** Deploy.s.sol의 `new` 호출 순서 = Anvil 배포 주소 순서

### BUG-3: fundingEngine buildServer 미연결 (심각도: MEDIUM)
- **현상:** `GET /funding/:pair` → 404
- **원인:** `index.ts`에서 `buildServer()` 호출 시 `fundingEngine`, `getMarkPrice`, `getIndexPrice` 미전달
- **수정:** `index.ts`에 3개 파라미터 추가 (커밋 `4eab073`)

### BUG-4: funding rate 타입 불일치 (심각도: MEDIUM)
- **현상:** 프론트 `FundingRate.rate: bigint` ← 서버 `FundingRate.rate: number`
- **원인:** 서버 타입은 `number` (0.0001), 프론트 타입은 1e18 스케일 `bigint`
- **수정:** `funding.ts`에서 `Math.round(rate * 1e18)` bigint string 직렬화 + `BIGINT_KEYS`에 `'rate'` 추가
