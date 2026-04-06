# HyperKRW DEX Web — 다음 작업 목록

## 현재 상태 (2026-04-06 세션 3 갱신)

**완료된 전체 작업 (3개 레포):**

### 서버 (krw-dex-server)
- ✅ Phase M — 서버 크리티컬 버그 수정
  - CR-1: PositionTracker margin=0n → 전체 청산 버그 수정 (`68a48c9`)
  - CR-2: taker 포지션 미추적 수정 (`68a48c9`)
  - CR-4: FundingRateEngine 'payment' 이벤트 리스너 연결 (`0f48e05`)
  - IMP-7: SIGINT 핸들러 추가 — clearInterval(liquidationInterval) 포함 (`0f48e05`)
  - 208/208 tests 통과, tsc --noEmit 클린

### 컨트랙트 (HyperEVM-KRW-DEX)
- ✅ Phase N — 컨트랙트 크리티컬 버그 수정 (`c5e6f46`)
  - N-1 (CR-3): settleADL() 수집 자금 InsuranceFund로 분배 (기존: 영구 잠김)
  - N-2 (CR-5): HybridPool decimal 정규화 — KRW(18) vs USDC(6) 혼용 수정
    - _precisionMultipliers() 헬퍼 추가
    - _calcSwapCurve(): xp와 dx 모두 18 decimal 정규화 후 계산, 출력 역정규화
    - addLiquidity(): amountsNorm으로 LP ratio + geometricMean 계산
  - N-3 (IMP-3): InsuranceFund.deposit() CEI 순서 수정 (Interactions → Effects 순서 정정)
  - 132/132 tests 통과

### 프론트엔드 (krw-dex-web)
- ✅ Phase P — 프론트엔드 버그 수정 (`4e562b6`)
  - P-1: AccountPage ERC-20 approve 플로우 연결 (기존: onClick={() => {}})
    - VITE_KRW_TOKEN_ADDRESS 환경변수 추가
    - allowance 읽기 위치 수정 (MarginRegistry → KRW 토큰)
    - approveWrite({approve(marginRegistry, amount)}) 호출 연결
  - P-2: MarginForm 에러 상태 표시 (approveError / marginError)
  - P-3: window.innerWidth < 600 → useMediaQuery(MOBILE_QUERY) 훅으로 교체
    - src/hooks/useMediaQuery.ts 신규 생성
    - MarketPage.tsx 교체 완료
  - P-4: keyRole 타입 정렬 ('ADMIN'|'OPERATOR' → 'read'|'trade') — 서버 ApiKeyRole과 일치
  - P-5: Toast 알림 시스템 (src/components/ui/Toast.tsx) — 외부 의존성 없음
    - OrderForm 주문 성공/실패 토스트 표시 (기존: alert())
  - P-6: 청산 거리 방향 수정 — 롱(mark < liqPrice), 숏(mark > liqPrice) 구분
  - 60/60 Vitest tests 통과, tsc --noEmit 클린

**세션 3 완료 (프론트엔드 — 2026-04-06):**
- WS markprice.update 실시간 — `3427d9d` (useFundingRate WS 캐시 업데이트, useMarkPrice 훅)
- usePositions WS 실시간 업데이트 — `af0058e` (position.update → TanStack 캐시 즉시 반영)
- Vite 코드 스플리팅 — `5417717` (manualChunks 4개, React.lazy 모든 페이지)
- OrderForm/PositionPanel markPrice WS 연동 — `9c2f9ac`
- Admin 서킷브레이커 UI + 404 페이지 — `b20ac39`
- **Playwright E2E 테스트 — `b9015ca`** (playwright.config.ts + e2e/ 3개 스펙)
  - navigation.spec.ts: home→/market 리다이렉트, 404, /admin, /trade
  - health.spec.ts: API health check (서버 미실행 시 graceful skip)
  - orderbook.spec.ts: 거래 페이지 스모크 테스트

**이전 완료 (프론트엔드):**
- F-0~F-4: MVP 전체 — `0c8626c`
- Phase H: Vitest 단위 테스트 60개 — `88ade0d`
- Phase I: Hyperliquid 수준 UI/UX — `c5e683f`
- Phase J: 3탭 BottomNav + MarketPage + AccountPage — `43e6ecf`
- Phase K: 모바일 반응형 레이아웃 — `7eeb221`
- Phase L: Amend UI + 청산 리스크 표시 — `6a9a263`

**TypeScript:** ✅ 클린 (3개 레포 모두 타입 에러 0)

---

## 로컬 환경 (Anvil)

```
Anvil:   http://127.0.0.1:8545  (chainId=998)
서버:    http://localhost:3000
프론트:  http://localhost:3001
```

### 배포된 컨트랙트 주소
| 컨트랙트 | 주소 |
|---------|------|
| MockKRW (krwStablecoin) | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| MockwBTC (수동등록)      | `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d` |
| PairRegistry            | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| OrderSettlement         | `0x610178dA211FEF7D417bC0e6FeD39F05609AD788` |
| MarginRegistry          | `0x9A676e781A523b5d0C0e43731313A708CB607508` |

⚠️ Anvil 재시작 시 상태 초기화

---

## ✅ Phase O~R-4 전부 완료 (서버/컨트랙트/인프라)

Phase O (PostgreSQL, Redis, Ponder, RPC 폴백, Traefik, Docker, OFAC), Phase R-2 (VaultClient), R-3 (Gnosis Safe), R-4 (Timelock), R-7 (CircuitBreaker), OpenAPI/Swagger, WalletRateLimiter — 모두 완료.

**다음 작업: Phase Q (테스트넷 배포) — 사용자 직접 실행 필요**

---

## 🗑️ (하위 호환성 보존 — 이전 상태, 이미 완료된 내용)

### Phase O: 인프라 레이어 구축 (완료됨)

**선결 조건:** Phase M+N 완료 ✅

### O-1: PostgreSQL 영속성 레이어
- 라이브러리: `postgres.js` (경량) 또는 `prisma` (ORM)
- 대상: 오더북 스냅샷, 포지션, 펀딩 이력, 체결 내역
- 재시작 시 PostgreSQL에서 상태 복원

### O-2: Redis WS pub/sub
- 라이브러리: `ioredis`
- 싱글 프로세스 WS → Redis pub/sub으로 교체
- 향후 수평 확장 가능하도록 준비

### O-3: Ponder 인덱서 서비스 (신규)
- 레퍼런스: https://github.com/ponder-sh/ponder (MIT, TypeScript)
- 역할: 온체인 이벤트(OrderSettled, LiquidationExecuted, FundingSettled) → PostgreSQL
- 자동 생성 GraphQL/SQL API

### O-4: viem fallback() RPC transport
- 파일: `krw-dex-server/src/lib/rpcClient.ts` (신규)
- Alchemy(주) → 공개 RPC(폴백) fallback 설정

### O-5: Traefik API Gateway
- Rate limiting: IP당 100 req/s, API Key당 500 req/s
- Health check: `/health`
- TLS: Let's Encrypt 자동
- `/admin/*` → Operator IP allowlist

### O-6: Docker Compose
```yaml
services:
  server:   { build: ./krw-dex-server,  restart: always }
  ponder:   { build: ./krw-dex-indexer, restart: always }
  postgres: { image: postgres:16-alpine }
  redis:    { image: redis:7-alpine }
  traefik:  { image: traefik:v3 }
```

### O-7: 컴플라이언스 미들웨어
- OFAC 주소 스크리닝 (로컬 목록)
- 감사 로그 PostgreSQL 저장

---

## Phase Q: HyperEVM 테스트넷 배포 🟠 (Phase O 이후)

```
Faucet: https://faucet.hyperliquid-testnet.xyz
RPC:    https://rpc.hyperliquid-testnet.xyz/evm (chainId=998)
```

**단계:**
1. [Q-1] HYPE 테스트넷 토큰 확보
2. [Q-2] 컨트랙트 테스트넷 배포 (DeployTestnet.s.sol)
3. [Q-3] 서버 Railway 배포 + PostgreSQL + Redis 애드온
4. [Q-4] Traefik 게이트웨이 Docker Compose 배포
5. [Q-5] 프론트엔드 Vercel 배포 (VITE_KRW_TOKEN_ADDRESS 포함)
6. [Q-6] MetaMask E2E 검증

⚠️ VITE_KRW_TOKEN_ADDRESS 추가됨 — 테스트넷 배포 후 .env 업데이트 필요

---

## 설계 결정사항 & 주의사항

### settleADL OPERATOR_ROLE 설정 필수
CR-3 수정으로 settleADL()이 InsuranceFund.deposit()을 호출함.
배포 시 반드시: `insuranceFund.grantRole(OPERATOR_ROLE, address(orderSettlement))` 실행.

### HybridPool decimal 정규화 방식
_precisionMultipliers()는 IERC20Metadata.decimals() 외부 호출 사용.
KRW는 18 decimal이므로 multiplier=1, USDC는 6 decimal이므로 multiplier=1e12.
모든 StableSwap 수학 함수 내에서 일관되게 18 decimal 기준으로 정규화.

### FundingRateEngine on-chain 연결 미완
CR-4 부분 수정: 'payment' 이벤트 로깅은 완료.
실제 on-chain settleFunding() 호출은 Phase N 컨트랙트에 함수 추가 후 연결 필요.
(현재 OrderSettlement에 settleFunding() 이미 존재 — SettlementWorker에 enqueueFunding() 추가 필요)

### IMP-8: MarginAccount ↔ PositionTracker 이중 상태
여전히 미수정. MarginAccount는 별도 상태를 유지함.
Phase O에서 PostgreSQL 통합 시 단일 진실 원본으로 통합 예정.

### BigInt 경계 (절대 준수)
- Number() 변환 허용: CandleChart.tsx, format.ts 내부만
- 서버 응답 → bigintReviver 자동 적용 (api/client.ts)

### EIP-712 9-field (절대 변경 금지)
- ORDER_TYPES: isLiquidation 추가 금지
- domain name: 'KRW DEX' (OrderSettlement.sol __EIP712_init("KRW DEX", "1"))

### keyRole 정렬 완료
- 서버: 'read' | 'trade' (ApiKeyRole in traderAuth.ts)
- 프론트: KeyRole = 'read' | 'trade' (authStore.ts 수정 완료)
- ApiKeyModal: 'OPERATOR' → 'trade'로 수정 완료

---

## 로컬 환경 재시작 방법

```bash
# 1. Anvil
~/.foundry/bin/anvil --chain-id 998 --port 8545 --accounts 10 --balance 10000 --block-time 2 --silent &

# 2. 컨트랙트 배포
cd krw-dex-contracts
DEPLOYER_PRIVATE_KEY="0xac0974..." forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 --private-key 0xac0974... --broadcast

# 3. 서버
cd krw-dex-server && node dist/index.js

# 4. 프론트 (.env.local에 VITE_KRW_TOKEN_ADDRESS 설정 필요)
cd krw-dex-web && npm run dev
```
