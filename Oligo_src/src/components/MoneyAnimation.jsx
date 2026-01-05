import React, { useState, useEffect } from 'react'
import styles from './MoneyAnimation.module.css'

/**
 * MoneyAnimation component for showing money change bubbles
 * @param {Object} props - Component props
 * @param {Array} props.moneyChanges - Array of money change objects
 * @param {Function} props.onAnimationComplete - Callback when animation completes
 * @returns {JSX.Element} MoneyAnimation component
 */
const MoneyAnimation = ({ moneyChanges = [], onAnimationComplete }) => {
  const [visibleChanges, setVisibleChanges] = useState([])

  useEffect(() => {
    if (moneyChanges.length > 0) {
      const newChanges = moneyChanges.map(change => ({
        ...change,
        id: `${change.playerId}_${Date.now()}_${Math.random()}`,
        visible: true
      }))
      
      setVisibleChanges(prev => [...prev, ...newChanges])

      const timer = setTimeout(() => {
        setVisibleChanges(prev => 
          prev.filter(change => !newChanges.some(newChange => newChange.id === change.id))
        )
        if (onAnimationComplete) {
          onAnimationComplete(moneyChanges)
        }
      }, 2000)

      return () => clearTimeout(timer)
    } else if (moneyChanges.length === 0) {
      // Clear all visible changes when moneyChanges is cleared
      setVisibleChanges([])
    }
  }, [moneyChanges, onAnimationComplete])

  return (
    <div className={styles.moneyAnimationContainer}>
      {visibleChanges.map((change, index) => (
        <div
          key={change.id}
          className={`${styles.moneyBubble} ${change.amount > 0 ? styles.positive : styles.negative}`}
          style={{
            left: change.x || '50%',
            top: change.y || '50%',
            transform: `translate(-50%, calc(-50% + ${index * 60}px))`
          }}
        >
          <div className={styles.bubbleContent}>
            {change.amount > 0 ? '+' : ''}${Math.abs(change.amount).toLocaleString()}
          </div>
          <div className={styles.bubbleReason}>
            {change.reason || ''}
          </div>
        </div>
      ))}
    </div>
  )
}

export default MoneyAnimation