# Triad

A tactile rock-paper-scissors game on Base. Players choose a gesture, settle a round onchain, and maintain an independent daily return streak.

## Local development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
```

Deploy `contracts/Triad.sol` on Base Mainnet, then place the contract address in `src/config/contract.ts` or set `VITE_TRIAD_CONTRACT_ADDRESS` during the Netlify build.
