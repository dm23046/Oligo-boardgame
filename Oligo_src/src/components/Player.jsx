import React, { useState, useEffect } from 'react'
import styles from './Player.module.css'

/**
 * Individual player piece component
 * @param {Object} props - Component props
 * @param {Object} props.player - Player data (id, name, color, position, isActive)
 * @param {Object} props.visualPosition - Position coordinates {left, top}
 * @param {Function} props.onClick - Click handler for player
 * @returns {JSX.Element} Player component
 */
const Player = ({ player, visualPosition, onClick }) => {
  const [isMoving, setIsMoving] = useState(false)
  const [prevPosition, setPrevPosition] = useState(visualPosition)
  
  useEffect(() => {
    if (visualPosition.left !== prevPosition.left || visualPosition.top !== prevPosition.top) {
      setIsMoving(true)
      setPrevPosition(visualPosition)
      
      const timer = setTimeout(() => {
        setIsMoving(false)
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [visualPosition, prevPosition])

  const handleClick = () => {
    if (onClick) {
      onClick(player)
    }
  }

  // safety
  const safeVisualPosition = visualPosition || { left: 0, top: 0 }

  const playerClasses = [
    styles.player,
    player.isActive ? styles.active : '',
    isMoving ? styles.moving : '',
    styles[`player${player.id}`]
  ].filter(Boolean).join(' ')

  return (
    <div
      className={playerClasses}
      style={{
        left: `${safeVisualPosition.left}px`,
        top: `${safeVisualPosition.top}px`,
        backgroundColor: player.color
      }}
      onClick={handleClick}
      data-player-id={player.id}
      role="button"
      tabIndex={0}
      aria-label={`${player.name} at position ${player.position}`}
      title={`${player.name} - Position ${player.position}`}
    >
      <div className={styles.playerInner}>
        <span className={styles.playerNumber}>
          {player.id}
        </span>
      </div>
      
      {player.isActive && (
        <div className={styles.activeIndicator}>
          <div className={styles.activeRing}></div>
        </div>
      )}
    </div>
  )
}

export default Player