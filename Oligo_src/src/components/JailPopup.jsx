import React, { useState } from 'react'
import { rollDie } from '../utils/gameLogic'
import styles from './JailPopup.module.css'
import { ACTION_TILES } from '../data/gameConfig'

/**
 * JailPopup component displays jail status and escape options
 * @param {Object} props - Component props
 * @param {Object} props.player - Player in jail
 * @param {Function} props.onEscapeAttempt - Handler for escape attempt
 * @param {Function} props.onWaitTurn - Handler for waiting in jail
 * @param {boolean} props.isVisible - Whether popup is visible
 * @returns {JSX.Element} JailPopup component
 */
const JailPopup = ({ player, onEscapeAttempt, onWaitTurn, isVisible }) => {
  const [diceRoll, setDiceRoll] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [attemptMade, setAttemptMade] = useState(false)

  if (!isVisible || !player || !player.jailStatus.isInJail) return null

  const jailConfig = ACTION_TILES.jail
  const canAffordEscape = player.money >= jailConfig.escapeAttemptCost

  const handleEscapeAttempt = () => {
    if (!canAffordEscape || attemptMade) return

    setIsRolling(true)
    
    setTimeout(() => {
      const die1 = rollDie() // 1-6
      const die2 = rollDie() // 1-6
      const roll = die1 + die2 // 2-12
      setDiceRoll(roll)
      setIsRolling(false)
      setAttemptMade(true)
      
      setTimeout(() => {
        onEscapeAttempt(roll)
        setDiceRoll(null)
        setAttemptMade(false)
      }, 2000)
    }, 1000)
  }

  const handleWaitTurn = () => {
    onWaitTurn()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.jailPopup}>
        <div className={styles.header}>
          <div className={styles.icon}>🚔</div>
          <h2 className={styles.title}>In Jail!</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.playerName}>{player.name}</p>
          
          <div className={styles.statusInfo}>
            <p className={styles.infoText}>
              You must skip <strong>{player.jailStatus.turnsRemaining}</strong> more turn{player.jailStatus.turnsRemaining !== 1 ? 's' : ''}
            </p>
            {player.jailStatus.penaltyAmount > 0 && (
              <p className={styles.infoText}>
                10% of your net: <strong>${player.jailStatus.penaltyAmount.toLocaleString()}</strong> paid
              </p>
            )}
          </div>

          <div className={styles.divider}></div>

          <div className={styles.options}>
            <div className={styles.optionCard}>
              <h3 className={styles.optionTitle}>Wait It Out</h3>
              <p className={styles.optionDescription}>
                Skip this turn and wait for your sentence to end
              </p>
              <button 
                className={`${styles.button} ${styles.waitButton}`}
                onClick={handleWaitTurn}
                disabled={isRolling}
              >
                Wait Turn
              </button>
            </div>

            <div className={styles.optionCard}>
              <h3 className={styles.optionTitle}>Attempt Escape</h3>
              <p className={styles.optionDescription}>
                Pay ${jailConfig.escapeAttemptCost.toLocaleString()} and roll dice
                <br />
                <small>Roll {jailConfig.escapeRollTarget}+ to escape</small>
              </p>
              
              {diceRoll !== null && (
                <div className={styles.rollResult}>
                  <div className={`${styles.diceDisplay} ${diceRoll >= jailConfig.escapeRollTarget ? styles.success : styles.failure}`}>
                    🎲 {diceRoll}
                  </div>
                  <p className={styles.resultText}>
                    {diceRoll >= jailConfig.escapeRollTarget 
                      ? '✅ Escape Successful!' 
                      : '❌ Failed! Stay in jail'}
                  </p>
                </div>
              )}
              
              <button 
                className={`${styles.button} ${styles.escapeButton}`}
                onClick={handleEscapeAttempt}
                disabled={!canAffordEscape || isRolling || diceRoll !== null || attemptMade}
              >
                {isRolling ? 'Rolling...' : `Pay $${jailConfig.escapeAttemptCost.toLocaleString()} & Roll`}
              </button>
              
              {!canAffordEscape && (
                <p className={styles.warning}>Insufficient funds</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JailPopup
