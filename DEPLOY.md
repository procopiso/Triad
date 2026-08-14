# Deploy Triad

## Contract

1. Open Remix and create `Triad.sol`.
2. Paste the contents of `contracts/Triad.sol`.
3. Compile with Solidity `0.8.24` and optimizer enabled at 200 runs.
4. Connect the injected wallet to Base Mainnet, chain ID `8453`.
5. Deploy `Triad` without constructor arguments or value.
6. Copy the deployed address into `src/config/contract.ts`.
7. Verify on BaseScan with the same compiler and optimizer settings.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

The included `netlify.toml` already supplies these values.
