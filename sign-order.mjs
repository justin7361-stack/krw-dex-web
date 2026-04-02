import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

const hyperEvmTestnet = defineChain({
  id: 998,
  name: 'HyperEVM Testnet',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
})

const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const ORDER_SETTLEMENT = '0x610178dA211FEF7D417bC0e6FeD39F05609AD788'
const BASE_TOKEN  = '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d'  // wBTC (MockERC20)
const QUOTE_TOKEN = '0x5FbDB2315678afecb367f032d93F642f64180aa3' // KRW stablecoin

const account = privateKeyToAccount(PRIVATE_KEY)
const client  = createWalletClient({ account, chain: hyperEvmTestnet, transport: http() })

const domain = {
  name: 'KRW DEX',
  version: '1',
  chainId: 998,
  verifyingContract: ORDER_SETTLEMENT,
}

const ORDER_TYPES = {
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
}

const order = {
  maker:      account.address,
  taker:      '0x0000000000000000000000000000000000000000',
  baseToken:  BASE_TOKEN,
  quoteToken: QUOTE_TOKEN,
  price:      65000000n * (10n ** 18n),  // 65,000,000 KRW per wBTC (scaled 1e18)
  amount:     1n * (10n ** 16n),          // 0.01 wBTC (scaled 1e18)
  isBuy:      true,
  nonce:      BigInt(Date.now()),
  expiry:     BigInt(Math.floor(Date.now() / 1000) + 3600),
}

const sig = await client.signTypedData({ domain, types: ORDER_TYPES, primaryType: 'Order', message: order })
console.log(JSON.stringify({
  order: {
    ...order,
    price:  order.price.toString(),
    amount: order.amount.toString(),
    nonce:  order.nonce.toString(),
    expiry: order.expiry.toString(),
  },
  signature: sig,
}))
