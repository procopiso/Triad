import { zeroAddress, type Address } from 'viem'

const deployedAddress =
  '0x8fede691B67c0D4664E307B5De49ef67f821Cdc1'

const configuredAddress =
  import.meta.env.VITE_TRIAD_CONTRACT_ADDRESS

const activeAddress =
  configuredAddress || deployedAddress

export const isContractConfigured =
  /^0x[a-fA-F0-9]{40}$/.test(activeAddress) &&
  activeAddress.toLowerCase() !== zeroAddress

export const TRIAD_ADDRESS = (
  isContractConfigured
    ? activeAddress
    : zeroAddress
) as Address

export const triadAbi = [
  {
    type: 'function',
    name: 'play',
    inputs: [
      {
        name: 'playerMove',
        type: 'uint8',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'dailyCheckIn',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'profileOf',
    inputs: [
      {
        name: 'user',
        type: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          {
            name: 'rounds',
            type: 'uint64',
          },
          {
            name: 'wins',
            type: 'uint64',
          },
          {
            name: 'losses',
            type: 'uint64',
          },
          {
            name: 'draws',
            type: 'uint64',
          },
          {
            name: 'checkIns',
            type: 'uint64',
          },
          {
            name: 'lastCheckInDay',
            type: 'uint64',
          },
          {
            name: 'lastPlayedAt',
            type: 'uint64',
          },
          {
            name: 'streak',
            type: 'uint16',
          },
          {
            name: 'lastPlayerMove',
            type: 'uint8',
          },
          {
            name: 'lastChainMove',
            type: 'uint8',
          },
          {
            name: 'lastOutcome',
            type: 'uint8',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'globalRounds',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'globalCheckIns',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
  },
] as const
