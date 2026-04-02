# HyperKRW DEX Web — 다음 작업 목록

## 현재 상태 (2026-04-02 갱신)

**완료된 프론트엔드 작업:**
- F-0 ~ F-4: MVP 전체 (오더북, 차트, 주문폼, 포지션 패널, 바텀탭)
- Phase H: Vitest 단위 테스트 60개 (4개 파일) — 커밋 `88ade0d`
- Phase I (UI): Hyperliquid 수준 UI/UX 업그레이드 — 커밋 `c5e683f`
  - TickerBar, Orderbook flash, OrderForm % 버튼, 볼륨 서브차트, PositionPanel ROI%
- Phase J (구조): 3탭 BottomNav (Market/Trade/Account) — 커밋 `43e6ecf`
  - MarketPage: 페어 목록 + SVG 스파클라인 + 전체 캔들차트
  - AccountPage: 증거금 입출금 + 포지션 요약 + API키 관리

**TypeScript:** ✅ 클린 (타입에러 0)
**최신 커밋:** `43e6ecf` (master)

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

⚠️ Anvil 재시작 시 상태 초기화 — 아래 재시작 방법 참조

---

## 다음 단계 선택지

### 1. 🔴 HyperEVM 테스트넷 배포 (Phase I) — 추천 다음 작업
서버 + 컨트랙트 + 프론트를 실제 테스트넷에 올리는 단계.
> **선결 조건:** 테스트넷 HYPE 확보 (faucet 또는 Discord)

```bash
# faucet: https://faucet.hyperliquid-testnet.xyz
# RPC: https://rpc.hyperliquid-testnet.xyz/evm (chainId=998)
```

단계:
1. [I-1] HYPE 테스트넷 토큰 확보
2. [I-2] 컨트랙트 테스트넷 배포 (`forge script --rpc-url https://rpc.hyperliquid-testnet.xyz/evm`)
3. [I-3] 서버 환경변수 업데이트 (RPC, 컨트랙트 주소)
4. [I-4] 서버 배포 (Railway / Fly.io / VPS)
5. [I-5] 프론트 환경변수 업데이트 + Vercel/Netlify 배포

### 2. 🟠 MetaMask 브라우저 E2E (Phase G)
로컬 Anvil에서 실제 MetaMask로 주문 제출 검증.
> 사용자가 직접 브라우저에서 실행해야 함

```
MetaMask 네트워크: HyperEVM Local, RPC http://127.0.0.1:8545, chainId 998
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
URL: http://localhost:3001
```

### 3. 🟡 추가 UI/기능 작업
- **주문 수정(Amend)** UI — `PATCH /orders/:nonce`
- **조건부 주문(Stop-Limit)** 폼
- **청산 시뮬레이션** (청산가 근접 경고 개선)
- **모바일 반응형** 레이아웃 (현재 데스크탑 전용)

### 4. 🟡 테스트 보강
- 훅 통합 테스트 (usePairs, useSubmitOrder mock)
- Playwright E2E 자동화 (지갑 mock)

---

## 설계 결정사항 & 주의사항

### BigInt 경계 (절대 준수)
- `Number()` 변환 허용: `CandleChart.tsx`, `format.ts` 내부만
- 서버 응답 → `bigintReviver` 자동 적용 (`api/client.ts`)
- BIGINT_KEYS에 `'rate'` 포함 (funding rate 1e18 스케일)

### EIP-712 9-field (절대 변경 금지)
- `src/lib/eip712/types.ts` ORDER_TYPES isLiquidation 추가 금지
- **domain name: `'KRW DEX'`** (OrderSettlement.sol `__EIP712_init("KRW DEX", "1")`)

### Anvil 실제 주소
```
krwStablecoin = 0x5FbDB2315678afecb367f032d93F642f64180aa3  (KRW, not wBTC!)
wBTC (수동 등록) = 0xc6e7DF5E7b4f2A278906862b61205850344D4e7d
```
⚠️ 초기 세션 실수: `0x5FbDB...`를 wBTC로 착각했었음

### usePairs 구현
- 서버 `/pairs` 없음 → PairRegistry 컨트랙트 직접 읽기
- `getAllPairIds()` → `pairs(bytes32)` 배치 조회

### 라이선스
- 현재: dYdX v4-web 포크 → **AGPL v3**
- 메인넷 상업화 시: GMX v2 (MIT) 포크 또는 스크래치 재작성 검토

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

# 4. 프론트
cd krw-dex-web && npm run dev
```
