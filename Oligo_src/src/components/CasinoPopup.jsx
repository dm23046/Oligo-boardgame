import React, { useState } from 'react'
import { rollDie } from '../utils/gameLogic'
import styles from './CasinoPopup.module.css'

/**
 * CasinoPopup component for Bingo casino outcome
 * @param {Object} props - Component props
 * @param {Object} props.player - The player who triggered casino
 * @param {Function} props.onClose - Handler to close the popup
 * @param {Function} props.onPlaceBet - Handler when bet is placed (betAmount, rollValue, won)
 * @returns {JSX.Element} CasinoPopup component
 */
const CasinoPopup = ({ player, onClose, onPlaceBet, getDiceRoll }) => {
  const [betAmount, setBetAmount] = useState(1000)
  const [showRollResult, setShowRollResult] = useState(false)
  const [rollValue, setRollValue] = useState(0)
  const [betSuccess, setBetSuccess] = useState(false)
  const [isRolling, setIsRolling] = useState(false)

  const minBet = 1000
  const targetRoll = 6
  const multiplier = 2.0

  const handleRiskBet = () => {
    if (betAmount < minBet || betAmount > player.money) {
      return
    }

    setIsRolling(true)
    
    setTimeout(() => {
      const total = getDiceRoll ? getDiceRoll() : (() => {
        const dice1 = rollDie()
        const dice2 = rollDie()
        return dice1 + dice2
      })()
      setRollValue(total)
      
      const success = total >= targetRoll
      setBetSuccess(success)
      setShowRollResult(true)
      setIsRolling(false)
      
      setTimeout(() => {
        onPlaceBet(betAmount, total, success)
        setShowRollResult(false)
      }, 2000)
    }, 300)
  }

  const canAffordBet = player.money >= betAmount

  return (
    <div className={styles.overlay}>
      <div className={styles.cardContainer}>
        <div className={styles.cardFlip}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.propertyTitle}>🎰 Casino</h2>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.propertyDetails}>
                <div className={styles.propertyName}>
                  Bingo Casino Challenge
                </div>

                <div className={styles.propertyDescription}>
                  Bingo has forced you to the casino! Roll {targetRoll} or higher to win {multiplier}x your bet!
                </div>
                
                {/* Casino betting UI */}
                <div className={styles.riskBetting}>
                  <h3 className={styles.riskTitle}>Place Your Bet</h3>
                  <div className={styles.riskInfo}>
                    <p>Roll {targetRoll}+ to win {multiplier}x your bet!</p>
                  </div>
                  
                  <div className={styles.betAmountSelector}>
                    <label className={styles.betLabel}>Bet Amount:</label>
                    <input
                      type="range"
                      min={minBet}
                      max={player.money}
                      step="100"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className={styles.betSlider}
                    />
                    <input 
                      type="number"
                      min={minBet}
                      max={player.money}
                      step="100"
                      value={betAmount}
                      onChange={(e) => {
                        let val = Number(e.target.value)
                        if (val < minBet) val = minBet
                        if (val > player.money) val = player.money
                        setBetAmount(val)
                      }}
                      className={styles.betInput}
                    />
                    <div className={styles.betDisplay}>
                      ${betAmount.toLocaleString()}
                    </div>
                    <div className={styles.betRange}>
                      <span>Min: ${minBet.toLocaleString()}</span>
                      <span>Max: ${player.money.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {(showRollResult || isRolling) && (
                    <div className={`${styles.rollResult} ${showRollResult ? (betSuccess ? styles.success : styles.failure) : ''}`}>
                      <div className={styles.rollValue}>
                        {isRolling ? '🎲 Rolling...' : `🎲 ${rollValue}`}
                      </div>
                      {showRollResult && (
                        <div className={styles.resultText}>
                          {betSuccess 
                            ? `You won $${(betAmount).toLocaleString()}!` 
                            : `You lost $${betAmount.toLocaleString()}`
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className={styles.priceSection}>
                  <span className={styles.priceLabel}>Minimum Bet</span>
                  <span className={styles.priceValue}>${minBet.toLocaleString()}</span>
                </div>
                
                <div className={styles.playerInfo}>
                  <div className={styles.playerMoney}>
                    <span className={styles.moneyLabel}>Your Money:</span>
                    <span className={`${styles.moneyValue} ${canAffordBet ? styles.canAfford : styles.cantAfford}`}>
                      ${player.money.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.cardFooter}>
              <button 
                className={`${styles.actionButton} ${styles.buyButton}`}
                onClick={handleRiskBet}
                disabled={!canAffordBet || showRollResult || isRolling}
              >
                {isRolling ? 'Rolling...' : `Roll & Bet $${betAmount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CasinoPopup
