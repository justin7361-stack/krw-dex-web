# HyperKRW DEX Web — Task List

## 현재 상태 (2026-04-02)

**완료:** F-0~F-4 (전체 프론트엔드 MVP) + D-1~D-4 (로컬 E2E 검증 완료)

### 로컬 환경 상태
- Anvil 노드: `http://127.0.0.1:8545` (chainId=998), 재시작 필요 시 아래 참조
- 서버: `http://localhost:3000` (krw-dex-server)
- 프론트: `http://localhost:3001` (Vite dev)

### 배포된 컨트랙트 주소 (Anvil — 재시작 시 초기화됨)
| 컨트랙트 | 주소 |
|---------|------|
| MockKRW | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| MockwBTC | `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d` |
| PairRegistry | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| OracleAdmin | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| BasicCompliance | `0x0165878A594ca255338adfa4d48449f69242Eb8F` |
| FeeCollector | `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6` |
| OrderSettlement | `0x610178dA211FEF7D417bC0e6FeD39F05609AD788` |
| InsuranceFund | `0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0` |
| MarginRegistry | `0x9A676e781A523b5d0C0e43731313A708CB607508` |

### E2E 검증 결과 (2026-04-02)
- ✅ 컨트랙트 배포 성공 (Deploy.s.sol + Config.s.sol)
- ✅ wBTC/KRW 페어 등록 (PairRegistry.addToken + addPair)
- ✅ 서버 시작 + wBTC/KRW 1 페어 로드 확인
- ✅ API key 등록 (`POST /admin/api-keys`)
- ✅ EIP-712 서명 생성 (viem signTypedData, 9-field)
- ✅ 주문 제출 성공 (`POST /orders` → `{"orderId":"..."}`)
- ✅ 오더북 반영 확인 (`GET /orderbook/{pair}` → bids:[{price,amount,orderCount:1}])
- ✅ WS 스트림 동작 (`ws://localhost:3000/stream?pair=...` → orderbook.snapshot)
- ✅ ApiKeyModal 수정 완료 (올바른 필드명: key/maker/role)
- ✅ usePairs 컨트랙트 직접 읽기 구현 (PairRegistry.getAllPairIds → pairs → symbol)

### 알려진 이슈
- ⚠️ 서버 `GET /orders/:address` BigInt 직렬화 에러 (`Cannot serialize BigInt`)
  - 서버 orders route에 JSON.stringify replacer 추가 필요
- ⚠️ 마진 check: `marginMode` 포함 주문은 `Insufficient margin` 반환
  - 원인: in-memory MarginAccount에 잔액 없음
  - 해결: `POST /margin/deposit` API 추가 또는 테스트용 bypass 필요
- ⚠️ @fastify/static v9 → v7.0.4로 다운그레이드 (fastify v4 호환)

---

## 다음 세션에 할 일

### [HIGH] 서버 버그 수정

1. **`GET /orders/:address` BigInt 직렬화 에러**
   - `src/api/routes/orders.ts`의 GET 핸들러에서 `JSON.stringify(orders, bigintReplacer)` 적용
   - 또는 Fastify의 `serializerCompiler`에 bigint replacer 등록

2. **마진 deposit API**
   - `POST /margin/deposit { maker, amount }` → MarginAccount.deposit() 호출
   - 테스트: deposit 후 marginMode 포함 주문 제출

### [HIGH] UI 완성도 개선

3. **TopNav 페어 셀렉터 개선**
   - `usePairs()`로 읽은 pair 목록을 드롭다운으로 표시
   - baseSymbol/quoteSymbol 표시 (현재 주소 앞 8자리)

4. **PositionPanel 실제 포지션 연동**
   - `GET /positions/:address` 엔드포인트 서버에 추가 필요
   - 현재 PositionPanel은 placeholder 표시

5. **체결 내역 탭**
   - BottomTabs의 "체결 내역" 탭 구현
   - `GET /trades/{pair}` REST API 연동

### [MEDIUM] MetaMask E2E 테스트

6. **MetaMask로 실제 브라우저 테스트**
   - MetaMask에 Anvil 네트워크 추가 (RPC: http://127.0.0.1:8545, ChainID: 998)
   - Anvil 테스트 키 import (0xac0974...f80)
   - 브라우저에서 지갑 연결 → API key 등록 → 주문 제출 → 오더북 반영 확인

7. **주문 수정(Amend)**
   - `useAmendOrder` 뮤테이션 구현
   - `PATCH /orders/:id` 연동

### [LOW] 품질 개선

8. **번들 사이즈 최적화**
   - `vite.config.ts`에 `manualChunks` 설정

9. **모바일 레이아웃**
   - 트레이딩 페이지 모바일 대응

---

## 로컬 환경 재시작 방법

```bash
# 1. Anvil 시작 (새 터미널)
~/.foundry/bin/anvil --chain-id 998 --port 8545 --accounts 10 --balance 10000 --block-time 2

# 2. 컨트랙트 배포 (Anvil 시작 후)
cd krw-dex-contracts
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
ADMIN_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
OPERATOR_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
GUARDIAN_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

# ※ 주의: 컨트랙트 주소가 매 배포마다 동일하면 재사용, 변경되면 .env 업데이트 필요

# 3. wBTC 토큰 및 페어 등록 (Config.s.sol 실행 후)
# — docs/local-setup.sh 참조

# 4. 서버 시작
cd krw-dex-server && node dist/index.js

# 5. 프론트 시작
cd krw-dex-web && npm run dev
```

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
- 서버 `ADMIN_API_KEY` = `local-dev-admin-key-12345`
- 프론트 `VITE_TESTNET_ADMIN_API_KEY` = `local-dev-admin-key-12345`
- ApiKeyModal: `crypto.randomUUID()` 로 키 생성 → 서버에 `{key, maker, role:'trade'}` 등록
- 메인넷 전 별도 Key Registration 서버 구축 필수

### pairId URL 인코딩
- URL slug: `--` (이중 대시) ↔ 서버 pairId: `/` (슬래시)
- REST 호출 시: `encodePairId(pairId)` 반드시 사용

### usePairs 구현 방식
- 서버에 `/pairs` 엔드포인트 없음 → PairRegistry 컨트랙트 직접 읽기
- `getAllPairIds()` → `pairs(bytes32)` → `symbol()` 3단계 읽기
- `PAIR_REGISTRY_ABI`: `getAllPairIds()` + `pairs(bytes32)` 함수 포함됨

### @fastify/static 버전
- v9.0.0 (package.json) → v7.0.4로 다운그레이드 (fastify v4 호환)
- package.json의 `@fastify/static` 버전도 `^7.0.0`으로 업데이트 필요

---

## 완료된 작업

### 2026-04-02 (F-0~F-4 + D-1~D-4)
- 전체 프론트엔드 MVP 구현 (F-0~F-4)
- 로컬 Anvil E2E 검증 완료 (D-1~D-4)
- ApiKeyModal 서버 API 형식 수정 (key/maker/role)
- usePairs PairRegistry 컨트랙트 직접 읽기 구현
- wagmiConfig VITE_RPC_URL 오버라이드 지원 추가
- @fastify/static v9→v7 다운그레이드 (서버)
