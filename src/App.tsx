import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Check,
  FileText,
  Gem,
  LogOut,
  Radio,
  Scissors,
  Sparkles,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { encodeFunctionData } from 'viem'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { base } from 'wagmi/chains'
import { isContractConfigured, TRIAD_ADDRESS, triadAbi } from './config/contract'
import { DATA_SUFFIX } from './config/wagmi'

type Move = 0 | 1 | 2
type Action = 'play' | 'checkin'

const moves: Array<{ id: Move; label: string; icon: ReactNode; tone: string }> = [
  { id: 0, label: 'Rock', icon: <Gem />, tone: 'blue' },
  { id: 1, label: 'Paper', icon: <FileText />, tone: 'red' },
  { id: 2, label: 'Scissors', icon: <Scissors />, tone: 'black' },
]

const outcomeCopy = ['Draw. Perfect balance.', 'You won this round.', 'The chain takes it.']

function shortAddress(value?: `0x${string}`) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : ''
}

function MoveMark({ move, muted = false }: { move?: Move; muted?: boolean }) {
  const item = move === undefined ? undefined : moves[move]
  return (
    <span className={`move-mark ${item?.tone || 'empty'} ${muted ? 'muted' : ''}`}>
      {item?.icon || <span>?</span>}
    </span>
  )
}

export default function App() {
  const [selected, setSelected] = useState<Move>(0)
  const [walletOpen, setWalletOpen] = useState(false)
  const [action, setAction] = useState<Action>('play')
  const [notice, setNotice] = useState('')

  const { address, isConnected, chainId } = useAccount()
  const { connectors, connectAsync, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync, data: hash, isPending: isSending, reset } = useSendTransaction()
  const receipt = useWaitForTransactionReceipt({ hash })

  const enabledAddress = isContractConfigured && address ? address : undefined
  const { data: profile, refetch: refetchProfile } = useReadContract({
    address: TRIAD_ADDRESS,
    abi: triadAbi,
    functionName: 'profileOf',
    args: enabledAddress ? [enabledAddress] : undefined,
    query: { enabled: Boolean(enabledAddress) },
  })
  const { data: globalRounds, refetch: refetchGlobalRounds } = useReadContract({
    address: TRIAD_ADDRESS,
    abi: triadAbi,
    functionName: 'globalRounds',
    query: { enabled: isContractConfigured },
  })
  const { data: globalCheckIns, refetch: refetchGlobalCheckIns } = useReadContract({
    address: TRIAD_ADDRESS,
    abi: triadAbi,
    functionName: 'globalCheckIns',
    query: { enabled: isContractConfigured },
  })

  const today = BigInt(Math.floor(Date.now() / 86_400_000))
  const checkedToday = Boolean(profile && profile.lastCheckInDay === today)
  const hasRound = Boolean(profile && profile.rounds > 0n)
  const busy = isSending || receipt.isLoading
  const lastOutcome = hasRound ? Number(profile?.lastOutcome) : undefined
  const winRate = useMemo(() => {
    if (!profile || profile.rounds === 0n) return 0
    return Math.round((Number(profile.wins) / Number(profile.rounds)) * 100)
  }, [profile])

  useEffect(() => {
    if (!receipt.isSuccess) return
    void Promise.all([refetchProfile(), refetchGlobalRounds(), refetchGlobalCheckIns()])
    setNotice(action === 'play' ? 'Round settled on Base.' : 'Daily return confirmed.')
  }, [action, receipt.isSuccess, refetchGlobalCheckIns, refetchGlobalRounds, refetchProfile])

  async function connectWallet(index: number) {
    const connector = connectors[index]
    if (!connector) return
    try {
      await connectAsync({ connector, chainId: base.id })
      setWalletOpen(false)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wallet connection failed.')
    }
  }

  async function sendAction(next: Action) {
    if (!isConnected) {
      setWalletOpen(true)
      return
    }
    if (!isContractConfigured) {
      setNotice('Add the deployed contract address in src/config/contract.ts.')
      return
    }

    try {
      setNotice('')
      setAction(next)
      reset()
      if (chainId !== base.id) await switchChainAsync({ chainId: base.id })

      const data = encodeFunctionData({
        abi: triadAbi,
        functionName: next === 'play' ? 'play' : 'dailyCheckIn',
        args: next === 'play' ? [selected] : [],
      })

      await sendTransactionAsync({
        to: TRIAD_ADDRESS,
        data,
        chainId: base.id,
        ...(DATA_SUFFIX ? { dataSuffix: DATA_SUFFIX } : {}),
      })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Transaction cancelled.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="Triad home">
          <span className="brand-mark"><i /><i /><i /></span>
          <strong>TRIAD</strong>
        </a>
        <div className="top-actions">
          <span className="network"><i /> Base</span>
          {isConnected ? (
            <div className="account">
              <span>{shortAddress(address)}</span>
              <button type="button" onClick={() => disconnect()} aria-label="Disconnect"><LogOut /></button>
            </div>
          ) : (
            <button className="wallet-button" type="button" onClick={() => setWalletOpen(true)}>
              <Wallet /> Connect
            </button>
          )}
        </div>
      </header>

      <main id="game">
        <section className="game-heading">
          <div>
            <span className="kicker">Onchain hand game</span>
            <h1>Make your move.</h1>
          </div>
          <p>A quiet contest of instinct<br />and chance.</p>
        </section>

        <section className="duel-stage" aria-label="Game arena">
          <div className="stage-side player-side">
            <span className="side-label">You</span>
            <MoveMark move={selected} />
            <strong>{moves[selected].label}</strong>
          </div>
          <div className={`versus ${busy && action === 'play' ? 'thinking' : ''}`}>
            <span>{busy && action === 'play' ? <Radio /> : 'VS'}</span>
          </div>
          <div className="stage-side chain-side">
            <span className="side-label">Chain</span>
            <MoveMark move={hasRound ? Number(profile?.lastChainMove) as Move : undefined} muted={!hasRound} />
            <strong>{hasRound ? moves[Number(profile?.lastChainMove)].label : 'Hidden'}</strong>
          </div>
          <div className={`result-line ${lastOutcome === 1 ? 'win' : lastOutcome === 2 ? 'loss' : ''}`}>
            <span>{hasRound ? `Round ${profile?.rounds.toString()}` : 'Ready when you are'}</span>
            <strong>{hasRound && lastOutcome !== undefined ? outcomeCopy[lastOutcome] : 'Choose a gesture below.'}</strong>
          </div>
        </section>

        <section className="controls" aria-label="Choose a move">
          <div className="choice-row">
            {moves.map((move) => (
              <button
                className={`choice ${move.tone} ${selected === move.id ? 'selected' : ''}`}
                type="button"
                key={move.id}
                onClick={() => setSelected(move.id)}
                aria-pressed={selected === move.id}
              >
                <span>{move.icon}</span>
                <strong>{move.label}</strong>
              </button>
            ))}
          </div>
          <button className="play-button" type="button" disabled={busy} onClick={() => sendAction('play')}>
            <Zap /> {busy && action === 'play' ? 'Settling round…' : `Play ${moves[selected].label} on Base`}
          </button>
        </section>

        <section className="score-band">
          <div><span>Rounds</span><strong>{Number(profile?.rounds || 0n)}</strong></div>
          <div><span>Wins</span><strong>{Number(profile?.wins || 0n)}</strong></div>
          <div><span>Draws</span><strong>{Number(profile?.draws || 0n)}</strong></div>
          <div><span>Win rate</span><strong>{winRate}<small>%</small></strong></div>
        </section>

        <section className="daily-band">
          <div className="daily-symbol"><Sparkles /></div>
          <div className="daily-copy">
            <span>Daily ritual</span>
            <h2>Return to the table.</h2>
            <p>Meet tomorrow at the same table.</p>
          </div>
          <div className="streak"><strong>{Number(profile?.streak || 0n)}</strong><span>day streak</span></div>
          <button className={checkedToday ? 'done' : ''} type="button" disabled={busy || checkedToday} onClick={() => sendAction('checkin')}>
            {checkedToday ? <><Check /> Checked in</> : <><Sparkles /> {busy && action === 'checkin' ? 'Confirming…' : 'Daily check-in'}</>}
          </button>
        </section>

        <section className="global-line">
          <span>{Number(globalRounds || 0n).toLocaleString()} global rounds</span>
          <span>{Number(globalCheckIns || 0n).toLocaleString()} daily returns</span>
          <span>Base Mainnet</span>
        </section>
        {notice && <p className="notice" role="status">{notice}</p>}
      </main>

      <footer><span>TRIAD / BASE</span><span>Base Mainnet · UTC days</span></footer>

      {walletOpen && (
        <div className="modal-backdrop" onMouseDown={() => setWalletOpen(false)}>
          <div className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close" type="button" aria-label="Close" onClick={() => setWalletOpen(false)}><X /></button>
            <span className="modal-mark"><i /><i /><i /></span>
            <p>BASE MAINNET</p>
            <h2 id="wallet-title">Take your seat.</h2>
            <span>Connect a wallet to play an onchain round.</span>
            <div className="wallet-options">
              <button type="button" disabled={isConnecting} onClick={() => connectWallet(0)}>
                <Wallet /><span><strong>Browser wallet</strong><small>MetaMask, Rabby and more</small></span>
              </button>
              <button type="button" disabled={isConnecting} onClick={() => connectWallet(1)}>
                <b>B</b><span><strong>Base Account</strong><small>Coinbase smart wallet</small></span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
