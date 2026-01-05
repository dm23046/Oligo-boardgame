import React, { useState } from 'react'
import { rollDie } from '../utils/gameLogic'
import styles from './DuelPopup.module.css'

/**
 * DuelPopup component for Bingo 2:1 duel outcome
 * @param {Object} props - Component props
 * @param {Object} props.initiator - The player who triggered the duel (rolls 2 dice)
 * @param {Array} props.allPlayers - All players in the game
 * @param {Function} props.onClose - Handler to close the popup
 * @param {Function} props.onDuelComplete - Handler when duel completes (initiatorId, opponentId, initiatorRoll, opponentRoll)
 * @returns {JSX.Element} DuelPopup component
 */
const DuelPopup = ({ initiator, allPlayers, onClose, onDuelComplete }) => {
  const [state, setState] = useState({ opponentId: null, isRolling: false, hasRolled: false })
  const [diceResults, setDiceResults] = useState({ initiatorDice1: null, initiatorDice2: null, initiatorTotal: null, opponentDice: null })

  const availableOpponents = allPlayers.filter(p => p.id !== initiator.id && p.money > 0)
  const selectedOpponent = availableOpponents.find(p => p.id === state.opponentId)

  const handleSelectOpponent = (playerId) => {
    if (!state.isRolling && !state.hasRolled) {
      setState(prev => ({ ...prev, opponentId: playerId }))
    }
  }

  const handleStartDuel = () => {
    if (!state.opponentId || state.isRolling) return

    setState(prev => ({ ...prev, isRolling: true }))
    setDiceResults({ initiatorDice1: null, initiatorDice2: null, initiatorTotal: null, opponentDice: null })

    let rollCount = 0
    const rollInterval = setInterval(() => {
      setDiceResults({
        initiatorDice1: rollDie(),
        initiatorDice2: rollDie(),
        opponentDice: rollDie(),
        initiatorTotal: null
      })
      
      if (++rollCount >= 15) {
        clearInterval(rollInterval)
        const finalDice1 = rollDie()
        const finalDice2 = rollDie()
        const finalTotal = finalDice1 + finalDice2
        const finalOpponent = rollDie()
        
        setDiceResults({ initiatorDice1: finalDice1, initiatorDice2: finalDice2, initiatorTotal: finalTotal, opponentDice: finalOpponent })
        setState(prev => ({ ...prev, isRolling: false, hasRolled: true }))

        setTimeout(() => onDuelComplete(initiator.id, state.opponentId, finalTotal, finalOpponent), 2500)
      }
    }, 100)
  }

  const getWinner = () => {
    if (!state.hasRolled || diceResults.initiatorTotal === null) return null
    return diceResults.initiatorTotal > diceResults.opponentDice ? 'initiator' : 
           diceResults.opponentDice > diceResults.initiatorTotal ? 'opponent' : 'tie'
  }

  const getResultMessage = () => {
    const winner = getWinner()
    if (!winner) return ''
    if (winner === 'tie') return 'It\'s a tie! No payment needed.'
    
    const payment = (Math.abs(diceResults.initiatorTotal - diceResults.opponentDice) * 1000).toLocaleString()
    return winner === 'initiator' 
      ? `${initiator.name} wins! ${selectedOpponent.name} pays $${payment}`
      : `${selectedOpponent.name} wins! ${initiator.name} pays $${payment}`
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>2:1 Dice Duel!</h2>
          <p className={styles.subtitle}>Loser pays difference × $1,000</p>
        </div>

        <div className={styles.content}>
          {!state.opponentId && !state.hasRolled && (
            <>
              <div className={styles.instruction}>
                <p><strong>{initiator.name}</strong>, select your opponent:</p>
              </div>

              <div className={styles.playerList}>
                {availableOpponents.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectOpponent(player.id)}
                    className={`${styles.playerButton} ${state.opponentId === player.id ? styles.selected : ''}`}
                    disabled={state.isRolling || state.hasRolled}
                  >
                    <div className={styles.playerInfo}>
                      <span className={styles.playerName} style={{ color: player.color }}>
                        {player.name}
                      </span>
                      <span className={styles.playerMoney}>
                        ${player.money.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {availableOpponents.length === 0 && (
                <div className={styles.noOpponents}>
                  <p>No opponents available with money!</p>
                  <button onClick={onClose} className={styles.closeButton}>
                    Close
                  </button>
                </div>
              )}
            </>
          )}

          {state.opponentId && (
            <>
              <div className={styles.duelArena}>
                <div className={styles.duelist}>
                  <h3 style={{ color: initiator.color }}>{initiator.name}</h3>
                  <p className={styles.diceLabel}>Rolls 2 dice (2:1 advantage)</p>
                  {(diceResults.initiatorDice1 !== null || state.hasRolled) && (
                    <div className={styles.diceContainer}>
                      <div className={`${styles.dice} ${state.isRolling ? styles.rolling : ''}`}>
                        {diceResults.initiatorDice1 || '?'}
                      </div>
                      <div className={`${styles.dice} ${state.isRolling ? styles.rolling : ''}`}>
                        {diceResults.initiatorDice2 || '?'}
                      </div>
                    </div>
                  )}
                  {diceResults.initiatorTotal !== null && (
                    <div className={styles.total}>Total: {diceResults.initiatorTotal}</div>
                  )}
                </div>

                <div className={styles.vs}>VS</div>

                <div className={styles.duelist}>
                  <h3 style={{ color: selectedOpponent.color }}>{selectedOpponent.name}</h3>
                  <p className={styles.diceLabel}>Rolls 1 die</p>
                  {(diceResults.opponentDice !== null || state.hasRolled) && (
                    <div className={styles.diceContainer}>
                      <div className={`${styles.dice} ${styles.singleDice} ${state.isRolling ? styles.rolling : ''}`}>
                        {diceResults.opponentDice || '?'}
                      </div>
                    </div>
                  )}
                  {diceResults.opponentDice !== null && (
                    <div className={styles.total}>Roll: {diceResults.opponentDice}</div>
                  )}
                </div>
              </div>

              {state.hasRolled && (
                <div className={styles.result}>
                  {getResultMessage()}
                </div>
              )}

              {!state.hasRolled && !state.isRolling && (
                <div className={styles.actions}>
                  <button onClick={handleStartDuel} className={styles.duelButton}>
                    Start Duel!
                  </button>
                  <button onClick={() => setState(prev => ({ ...prev, opponentId: null }))} className={styles.backButton}>
                    Change Opponent
                  </button>
                </div>
              )}

              {state.isRolling && (
                <div className={styles.rollingText}>
                  🎲 Rolling...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DuelPopup
