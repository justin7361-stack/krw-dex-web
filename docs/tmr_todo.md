# HyperKRW DEX Web — 다음 작업 목록

## 현재 상태 (2026-04-02 갱신)

**완료:** F-0~F-4 (전체 프론트엔드 MVP) + E-1~E-2, F-1~F-2, G-1 (버그 수정 + E2E 검증)
- TypeScript 타입체크: ✅ 클린 (서버 + 프론트 모두)
- CLI E2E (sign → POST /orders → 오더북 반영): ✅ 검증 완료
- 커밋 이력: `37f6455` (F-2), `1176cd2` (reviver), `3e3f77a` (EIP-712 domain)
- 서버 커밋 이력: `2339d1d` (E+F), `4eab073` (G-1 fundingEngine)

**G-1 브라우저 MetaMask E2E: 아직 실행 필요** (아래 Phase G 참조)

### 로컬 환경 상태 (Anvil — 재시작 시 초기화)
```
Anvil:   http://127.0.0.1:8545  (chainId=998)
서버:    http://localhost:3000
프론트:  http://localhost:3001
```

### 배포된 컨트랙트 주소 (Anvil)
| 컨트랙트 | 주소 |
|---------|------|
| MockKRW | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| MockwBTC | `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d` |
| PairRegistry | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| OrderSettlement | `0x610178dA211FEF7D417bC0e6FeD39F05609AD788` |
| MarginRegistry | `0x9A676e781A523b5d0C0e43731313A708CB607508` |
| InsuranceFund | `0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0` |
| OracleAdmin | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| FeeCollector | `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6` |

---

## Phase E — 버그 수정 ✅ 완료 (커밋 `2339d1d`)

### [E-1] ✅ 서버 BigInt 직렬화 에러 (CRITICAL)
**파일:** `krw-dex-server/src/api/routes/orders.ts`
**현상:** `GET /orders/:address` → `"Cannot serialize BigInt"`
**수정:** GET 핸들러에서 bigintReplacer 적용
```typescript
const bigintReplacer = (_: string, v: unknown) =>
  typeof v === 'bigint' ? v.toString() : v
// reply.type('application/json').send(JSON.stringify(orders, bigintReplacer))
```
**영향:** BottomTabs 미체결 주문 탭, PositionPanel 전체 영향

### [E-2] ✅ 서버 마진 deposit API 없음 (CRITICAL)
**파일:** `krw-dex-server/src/api/routes/` (신규 추가)
**현상:** `marginMode` 포함 주문 → `"Insufficient margin"` 에러
**원인:** in-memory MarginAccount에 잔액 없음
**수정:**
```
POST /margin/deposit  { maker, amount, mode: 'cross'|'isolated', pairId? }
POST /margin/withdraw { maker, amount, mode }
GET  /margin/:address
```
**주의:** 실제 온체인 담보금은 OrderSettlement 컨트랙트가 관리함
현재 서버 MarginAccount는 off-chain 미러 → 온체인 이벤트 구독으로 동기화 필요 (장기)

---

## Phase F — 기능 완성 ✅ 완료 (커밋 `2339d1d` / `37f6455`)

### [F-1] ✅ 서버 `GET /positions/:address` 엔드포인트 추가
**파일:** `krw-dex-server/src/api/routes/positions.ts` (신규)
**현상:** PositionPanel이 포지션 데이터 못 가져옴 → placeholder
**구현:**
```
GET /positions/:address → PositionTracker.getAll().filter(p => p.maker === address)
```
BigInt 직렬화에 bigintReplacer 적용 필수

### [F-2] ✅ BottomTabs "체결 내역" 탭 연동
**파일:** `src/components/trading/BottomTabs.tsx`
**현상:** 체결 내역 탭 클릭해도 placeholder
**구현:** `GET /trades/{pair}` → 체결 내역 테이블 표시
**참고:** `useTrades.ts` 훅 이미 구현됨, UI 연결만 필요

### [F-3] 🔲 TopNav 페어 셀렉터 UI (다음 세션)
**파일:** `src/components/layout/TopNav.tsx`
**현상:** 페어 변경 UI 없음, 토큰 주소 앞 8자리만 표시
**구현:**
- `usePairs()` 결과로 드롭다운 표시
- `baseSymbol/quoteSymbol` 표시 (현재 address 기반)
- 페어 선택 시 `/trade/{slug}` 라우팅

### [F-4] 🟡 주문 수정(Amend) 기능
**파일:** `src/hooks/mutations/useAmendOrder.ts` (신규)
**구현:** `PATCH /orders/:nonce` → 새 price/amount로 수정
**참고:** 서버에 amend 핸들러 있는지 먼저 확인 필요

### [F-5] 🟡 마진 추가/출금 UI
**파일:** `src/components/modals/MarginModal.tsx` (신규)
**의존성:** E-2 서버 마진 API 먼저 구현 후 진행

---

## Phase G — MetaMask 브라우저 E2E 테스트 (1일)

### 수정 완료 항목 (G-1 서버/프론트 버그)
- ✅ `index.ts`: fundingEngine + getMarkPrice/getIndexPrice buildServer에 전달 (커밋 `4eab073`)
- ✅ `funding.ts`: rate bigint 직렬화 (1e18 스케일), nextFundingAt 추가
- ✅ `reviver.ts`: BIGINT_KEYS에 'rate' 추가 (커밋 `1176cd2`)
- ✅ `domain.ts`: EIP-712 domain name 'HyperKRW' → 'KRW DEX' (커밋 `3e3f77a`)
- ✅ CLI E2E: sign-order.mjs → POST /orders → orderId 반환 확인

### 실제 Anvil 토큰 주소 (중요!)
```
wBTC (base):  0xc6e7DF5E7b4f2A278906862b61205850344D4e7d  ← 수동 등록된 MockwBTC
KRW  (quote): 0x5FbDB2315678afecb367f032d93F642f64180aa3  ← Deploy.s.sol의 MockKRW (krwStablecoin)
pairId: 0xc6e7DF5E7b4f2A278906862b61205850344D4e7d/0x5FbDB2315678afecb367f032d93F642f64180aa3
```
⚠️ Anvil 재시작 시 상태 초기화 — 재시작 후 반드시 아래 재시작 방법 실행

### [G-2] 🟠 MetaMask에 Anvil 네트워크 추가
```
네트워크 이름: HyperEVM Local
RPC URL: http://127.0.0.1:8545
Chain ID: 998
통화 기호: HYPE
```

### [G-3] 🟠 Anvil 테스트 계정 MetaMask import
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
잔액: 10,000 HYPE
```

### [G-4] 🟠 브라우저 E2E 체크리스트
- [ ] http://localhost:3001 접속 → 자동으로 wBTC/KRW 페이지 이동 확인
- [ ] 오더북에 기존 CLI 제출 주문 (65,000,000 KRW bid) 표시 확인
- [ ] MetaMask 지갑 연결 (RainbowKit 버튼)
- [ ] "API 키 등록 필요" 배너 → ApiKeyModal → API 키 발급 (VITE_TESTNET_ADMIN_API_KEY 사용)
- [ ] 지정가 매수 주문 입력 (가격: 65,000,000 / 수량: 0.001)
- [ ] "매수 주문" 버튼 → MetaMask 서명 팝업 → 확인
- [ ] 오더북 매수 호가 반영 확인 (WS 업데이트)
- [ ] BottomTabs 미체결 주문 탭에서 주문 확인
- [ ] PositionPanel 마켓 정보 (펀딩 레이트, 마크 가격) 표시 확인

---

## Phase H — 테스트 코드 추가 (2일)

### [H-1] 🟡 lib/ 단위 테스트 (Vitest)
```
src/lib/bigint/format.test.ts   → formatKRW, formatAmount, parseScaled, roundDown
src/lib/pair/pairId.test.ts     → pairIdToSlug, slugToPairId, encodePairId
src/lib/eip712/buildOrder.test.ts → buildLimitOrder, buildMarketOrder 구조 검증
```

### [H-2] 🟡 훅 통합 테스트
```
src/hooks/api/usePairs.test.ts  → wagmi mock으로 컨트랙트 읽기 검증
```

---

## Phase I — HyperEVM 테스트넷 배포 (1~2일)

### [I-1] 🔴 HYPE 테스트넷 토큰 확보
**현황:** 배포자 지갑 `0xe056F4fbb48B83Abc5D0CDf12872a480E1717E5F` 잔액 0 HYPE
**방법:**
1. HyperEVM 테스트넷 faucet 확인: https://faucet.hyperliquid-testnet.xyz
2. 또는 Hyperliquid Discord에서 테스트넷 HYPE 요청

### [I-2] 🟠 테스트넷 배포
```bash
# 실제 HyperEVM 테스트넷 RPC
DEPLOYER_PRIVATE_KEY=... forge script script/Deploy.s.sol \
  --rpc-url https://rpc.hyperliquid-testnet.xyz/evm --broadcast --verify
```

### [I-3] 🟠 환경 변수 업데이트
- `krw-dex-server/.env` — 테스트넷 RPC + 새 컨트랙트 주소
- `krw-dex-web/.env.local` — 테스트넷 컨트랙트 주소, VITE_RPC_URL 제거

### [I-4] 🟡 서버 배포
- Railway / Fly.io / VPS 등에 배포
- `VITE_API_URL` / `VITE_WS_URL` 실서버로 업데이트

---

## Phase J — 메인넷 준비 (향후)

### [J-1] 보안 감사
- 스마트 컨트랙트: Certik / Hacken / Code4rena
- 서버: 펀딩 레이트 조작, 청산 정확성 검증

### [J-2] API Key 등록 서버 분리
- 현재: 프론트에서 `ADMIN_API_KEY`로 직접 호출 (테스트넷 전용)
- 메인넷: KYC 게이트웨이 + 별도 key registration 서버 필수

### [J-3] 라이선스 전략 검토
- 현재: dYdX v4-web 포크 → AGPL v3
- 메인넷 상업화 시: GMX v2 (MIT) 포크 또는 스크래치 재작성

---

## 로컬 환경 재시작 방법

```bash
# 1. Anvil 시작
~/.foundry/bin/anvil --chain-id 998 --port 8545 --accounts 10 --balance 10000 --block-time 2 --silent &

# 2. 컨트랙트 배포 (Anvil 초기화 후)
cd krw-dex-contracts
DEPLOYER_PRIVATE_KEY="0xac0974..." ADMIN_ADDRESS="0xf39F..." \
OPERATOR_ADDRESS="0xf39F..." GUARDIAN_ADDRESS="0xf39F..." \
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974... --broadcast

# 3. Config + 페어 등록
forge script script/Config.s.sol --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974... --broadcast [ENV 변수 설정 후]
cast send {PAIR_REGISTRY} "addToken(address,bool,bool)" {WBTC} false false \
  --rpc-url http://127.0.0.1:8545 --private-key 0xac0974...
cast send {PAIR_REGISTRY} "addPair(address,address,uint256,uint256,uint256,uint256)" \
  {WBTC} {KRW} ... --rpc-url http://127.0.0.1:8545 --private-key 0xac0974...

# 4. 서버 시작
cd krw-dex-server && node dist/index.js

# 5. 프론트 시작
cd krw-dex-web && npm run dev
```

---

## 설계 결정사항 & 주의사항

### BigInt 경계 (절대 준수)
- `Number()` 변환 허용: CandleChart.tsx, format.ts 내부만
- 서버 응답 → `bigintReviver` 자동 적용 (api/client.ts)
- BIGINT_KEYS에 `'rate'` 포함 (funding rate 1e18 스케일)

### EIP-712 9-field (절대 변경 금지)
- `src/lib/eip712/types.ts` ORDER_TYPES isLiquidation 추가 금지
- **domain name: `'KRW DEX'`** (OrderSettlement.sol `__EIP712_init("KRW DEX", "1")`)
- 이전에 'HyperKRW'로 잘못 설정 → 모든 서명 검증 실패 → 3e3f77a 커밋으로 수정

### Anvil 실제 주소 (중요! 이전 session의 실수 정정)
```
krwStablecoin = 0x5FbDB2315678afecb367f032d93F642f64180aa3  (KRW, not wBTC!)
wBTC (수동 등록) = 0xc6e7DF5E7b4f2A278906862b61205850344D4e7d
PairRegistry proxy = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
OrderSettlement proxy = 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
```
초기 세션에서 0x5FbDB...를 wBTC로 착각 (실제로는 Deploy.s.sol 첫 번째 MockERC20 = KRW)

### usePairs 구현 방식
- 서버 `/pairs` 없음 → PairRegistry 컨트랙트 직접 읽기
- `PAIR_REGISTRY_ABI`: `getAllPairIds()` + `pairs(bytes32)` 포함

### @fastify/static 버전 (서버)
- v9.0.0 → v7.0.4 다운그레이드 (fastify v4 호환)
- package.json에 `^7.0.0`으로 이미 반영됨

### fundingEngine buildServer 연결 주의
- `index.ts`에서 `fundingEngine`, `getMarkPrice`, `getIndexPrice` 반드시 buildServer에 전달
- 미전달 시 `GET /funding/:pair` → 404 (조건부 등록)
- `funding.ts` rate: number → `Math.round(rate * 1e18)` bigint string 변환 필수
