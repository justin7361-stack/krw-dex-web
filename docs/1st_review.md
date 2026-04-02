# HyperKRW DEX Web — 1차 코드 리뷰 (krw-dex-web)

**Date:** 2026-04-02
**Reviewer:** Claude Sonnet 4.6
**Scope:** krw-dex-web 전체 (F-0~F-4 + D-1~D-4 E2E 검증까지)
**상태:** MVP 구현 완료, 로컬 E2E 검증 완료

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
| 서버 API 정합성 | **B-** | 엔드포인트 일부 미구현, 버그 존재 |
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

## 3. Critical Issues (즉시 수정 필요)

### C-1. 서버 `GET /orders/:address` BigInt 직렬화 에러
**심각도:** HIGH
**현상:** `{"error":"Do not know how to serialize a BigInt"}`
**원인:** `src/api/routes/orders.ts`의 GET 핸들러가 StoredOrder[] (bigint 포함)를 직접 `reply.send()` 호출
**위치:** `krw-dex-server/src/api/routes/orders.ts` GET 핸들러
**수정:**
```typescript
// BigInt → string 변환 replacer
const bigintReplacer = (_: string, v: unknown) =>
  typeof v === 'bigint' ? v.toString() : v

// GET 핸들러에서:
return reply.type('application/json').send(JSON.stringify(orders, bigintReplacer))
```

### C-2. marginMode 포함 주문 → "Insufficient margin" (in-memory MarginAccount)
**심각도:** HIGH
**현상:** `order.marginMode` 가 있으면 반드시 marginAccount.canOpen() 통과해야 함
**원인:** in-memory MarginAccount에 잔액 없음 — `deposit()` API가 없음
**위치:** `krw-dex-server/src/api/routes/orders.ts` L106
**수정 방법 2가지:**
1. `POST /margin/deposit { maker, amount, mode }` API 추가 (권장)
2. 테스트 환경 한정 bypass flag 추가

---

## 4. Important Issues (다음 세션 우선순위)

### I-1. 서버에 `/pairs` 엔드포인트 없음
**현상:** 프론트가 `/pairs`를 호출하면 404
**현재 해결책:** `usePairs.ts`가 PairRegistry 컨트랙트 직접 읽기로 대체
**장기 해결:** 서버에 `GET /pairs` 추가 (심볼, 소수점, 마지막 가격 등 부가 정보 포함)

### I-2. `GET /positions/:address` 엔드포인트 없음
**현상:** PositionPanel이 서버 포지션 데이터 못 가져옴 → placeholder 표시
**위치:** `src/components/trading/PositionPanel.tsx`
**수정:** 서버에 `GET /positions/:address` 추가

### I-3. 프론트엔드 테스트 전무
**현상:** `src/` 전체에 테스트 파일 없음
**위험:** 핵심 유틸리티(bigint format, pairId 변환, EIP-712 order build) 회귀 감지 불가
**수정:** Vitest로 lib/bigint, lib/pair, lib/eip712 단위 테스트 추가

### I-4. BottomTabs "체결 내역" 탭 미구현
**현상:** 탭 클릭해도 placeholder 표시
**수정:** `GET /trades/:pair` REST API 연동

### I-5. TopNav 페어 셀렉터 미구현
**현상:** 페어 변경 UI 없음, 주소 앞 8자리만 표시
**수정:** usePairs() 결과로 드롭다운 구성, baseSymbol/quoteSymbol 표시

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

## 7. E2E 검증 결과 (2026-04-02)

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

---

## 8. 다음 단계 우선순위

1. **[즉시]** 서버 BigInt 직렬화 버그 수정 (C-1)
2. **[즉시]** 마진 deposit API 추가 (C-2)
3. **[HIGH]** 서버 `GET /positions/:address` 추가 (I-2)
4. **[HIGH]** BottomTabs 체결 내역 탭 연동 (I-4)
5. **[HIGH]** MetaMask 브라우저 E2E 테스트
6. **[MEDIUM]** TopNav 페어 셀렉터 UI (I-5)
7. **[MEDIUM]** 프론트엔드 단위 테스트 추가 (I-3)
8. **[MEDIUM]** WalletConnect projectId 설정 (배포 전)
9. **[LOW]** 번들 최적화 (manualChunks)
10. **[LOW]** 모바일 레이아웃 대응

---

## 9. 전체 프로젝트 진행 상황 (3개 레포)

| 레포 | 상태 | 주요 완료 사항 |
|------|------|----------------|
| `HyperEVM-KRW-DEX` (contracts) | ✅ 완성 | PairRegistry, OrderSettlement, MarginRegistry, HybridPool, InsuranceFund 배포 가능 |
| `krw-dex-server` | ✅ 완성 | CLOB 매칭, EIP-712 검증, WS 스트림, 포지션/펀딩/청산 엔진 |
| `krw-dex-web` | 🔄 MVP | 트레이딩 UI 완성, 일부 기능 placeholder |

**다음 마일스톤:** 실제 HyperEVM 테스트넷 배포 + 퍼블릭 베타
