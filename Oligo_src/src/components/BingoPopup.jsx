import React, { useState } from 'react'
import { rollDie } from '../utils/gameLogic'
import styles from './BingoPopup.module.css'

const BingoPopup = ({ 
  player, 
  allPlayers,
  onClose, 
  onForcedSale,
  onCasinoBet,
  onDuel,
  onDiscountPurchase,
  onCollectFromAll,
  onDoubleSale,
  getDiceRoll
}) => {
  const [diceRoll, setDiceRoll] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [showOutcome, setShowOutcome] = useState(false)

  const outcomes = [
    { range: '2-3', title: 'Forced Sale (50%)', description: 'You must sell one of your cards for 50% of its purchase price', color: '#e74c3c', min: 2, max: 3 },
    { range: '4-5', title: 'Casino Time!', description: 'Forced casino play - minimum bet $1,000 (you can bet more)', color: '#e67e22', min: 4, max: 5 },
    { range: '6-7', title: '2:1 Duel', description: 'Pick a player to duel! You roll 2 dice, they roll 1. Loser pays difference × $1,000', color: '#f39c12', min: 6, max: 7 },
    { range: '8-9', title: '50% Discount!', description: 'Pick any card from the drawpool for 50% off (free cards remain free)', color: '#27ae60', min: 8, max: 9 },
    { range: '10-11', title: 'Tax Collection', description: 'Every player pays you 10% of their money on hand', color: '#2ecc71', min: 10, max: 11 },
    { range: '12', title: 'Jackpot Sale!', description: 'You must sell one of your cards for DOUBLE its purchase price', color: '#9b59b6', min: 12, max: 12 }
  ]

  const getOutcomeForRoll = (roll) => outcomes.find(o => roll >= o.min && roll <= o.max)

  const handleRollDice = () => {
    setIsRolling(true)
    
    //dice rolling animation
    let rollCount = 0
    const rollInterval = setInterval(() => {
      const dice1 = rollDie()
      const dice2 = rollDie()
      setDiceRoll(dice1 + dice2)
      rollCount++
      
      if (rollCount >= 10) {
        clearInterval(rollInterval)
        // final roll sets the result (use getDiceRoll if provided)
        const finalRoll = getDiceRoll ? getDiceRoll() : (() => {
          const dice1 = rollDie()
          const dice2 = rollDie()
          return dice1 + dice2
        })()
        setDiceRoll(finalRoll)
        setIsRolling(false)
        setShowOutcome(true)
      }
    }, 100)
  }

  const handleProceed = () => {
    const actions = { 2: () => onForcedSale(0.5), 4: onCasinoBet, 6: onDuel, 8: () => onDiscountPurchase(0.5), 10: () => onCollectFromAll(0.1), 12: () => onDoubleSale(2.0) }
    const key = diceRoll <= 3 ? 2 : diceRoll <= 5 ? 4 : diceRoll <= 7 ? 6 : diceRoll <= 9 ? 8 : diceRoll <= 11 ? 10 : 12
    actions[key]?.()
  }

  const currentOutcome = diceRoll ? getOutcomeForRoll(diceRoll) : null

  return (
    <div className={styles.overlay}>
      <div className={styles.bingoContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>🎰 BINGO TILE 🎰</h2>
          <p className={styles.subtitle}>Roll the dice to determine your fate!</p>
        </div>

        {!diceRoll && (
          <div className={styles.outcomesPreview}>
            <h3 className={styles.previewTitle}>Possible Outcomes:</h3>
            <div className={styles.outcomesList}>
              {outcomes.map(o => (
                <div key={o.range} className={styles.outcomeItem} style={{ borderLeftColor: o.color }}>
                  <div className={styles.outcomeRange}>{o.range}</div>
                  <div className={styles.outcomeInfo}>
                    <div className={styles.outcomeTitle}>{o.title}</div>
                    <div className={styles.outcomeDesc}>{o.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.diceSection}>
          {diceRoll && (
            <div className={styles.diceResult}>
              <div className={styles.diceValue} style={{ 
                animation: isRolling ? 'spin 0.1s linear' : 'none' 
              }}>
                🎲 {diceRoll}
              </div>
            </div>
          )}

          {showOutcome && currentOutcome && (
            <div className={styles.outcomeResult} style={{ backgroundColor: currentOutcome.color + '20', borderColor: currentOutcome.color }}>
              <h3 className={styles.resultTitle} style={{ color: currentOutcome.color }}>
                {currentOutcome.title}
              </h3>
              <p className={styles.resultDescription}>{currentOutcome.description}</p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {!diceRoll ? (
            <button 
              className={`${styles.actionButton} ${styles.rollButton}`}
              onClick={handleRollDice}
              disabled={isRolling}
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </button>
          ) : (
            <button 
              className={`${styles.actionButton} ${styles.proceedButton}`}
              onClick={handleProceed}
            >
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BingoPopup
