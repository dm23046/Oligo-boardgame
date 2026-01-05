import React from 'react'
import styles from './Dice.module.css'

/**
 * Dice component for displaying dice values and rolling state
 * @param {Object} props - Component props
 * @param {Array} props.dice - Array of two dice values [die1, die2]
 * @param {boolean} props.isRolling - Whether dice are currently rolling
 * @param {Function} props.onRoll - Handler for rolling dice
 * @param {boolean} props.disabled - Whether rolling is disabled
 * @param {string} props.rollResult - Formatted string showing last roll result
 * @returns {JSX.Element} Dice component
 */
const Dice = ({ 
  dice = [1, 1], 
  isRolling = false, 
  onRoll, 
  disabled = false,
  rollResult = ''
}) => {
  const handleRoll = () => {
    if (onRoll && !isRolling && !disabled) {
      onRoll()
    }
  }

  const getDiceDisplay = (value) => {
    //dice visual dots
    const dots = []
    for (let i = 0; i < value; i++) {
      dots.push(<div key={i} className={styles.dot} />)
    }
    return dots
  }

  return (
    <div className={styles.diceContainer}>
      <div className={styles.diceDisplay}>
        <div className={`${styles.die} ${isRolling ? styles.rolling : ''}`}>
          <div className={styles.dieInner}>
            <div className={`${styles.dieFace} ${styles[`face${dice[0]}`]}`}>
              {getDiceDisplay(dice[0])}
            </div>
            <span className={styles.dieNumber}>{dice[0]}</span>
          </div>
        </div>
        
        <div className={`${styles.die} ${isRolling ? styles.rolling : ''}`}>
          <div className={styles.dieInner}>
            <div className={`${styles.dieFace} ${styles[`face${dice[1]}`]}`}>
              {getDiceDisplay(dice[1])}
            </div>
            <span className={styles.dieNumber}>{dice[1]}</span>
          </div>
        </div>
      </div>
      {rollResult && (
        <div className={styles.rollResult}>
          {rollResult}
        </div>
      )}
      <button 
        className={`${styles.rollButton} ${isRolling ? styles.rolling : ''}`}
        onClick={handleRoll}
        disabled={disabled || isRolling}
        aria-label={isRolling ? 'Rolling dice...' : 'Roll dice'}
      >
        {isRolling ? (
          <>
            <span className={styles.spinner}></span>
            Rolling...
          </>
        ) : (
          'Roll Dice'
        )}
      </button>
      
    </div>
  )
}

export default Dice