import React from 'react'
import Controls from '../components/Controls'
import styles from './GameSetup.module.css'

/**
 * GameSetup page component for initial game config
 * @param {Object} props - Component props
 * @param {string} props.gameState - Curr game state
 * @param {Array} props.players - Array of player objects
 * @param {Function} props.onPlayerCountChange - Handler for changing number of players
 * @param {Function} props.onStartGame - Handler for starting the game
 * @param {Function} props.onResetGame - Handler for resetting the game
 * @returns {JSX.Element} GameSetup component
 */
const GameSetup = ({ 
  gameState,
  players,
  onPlayerCountChange,
  onStartGame,
  onResetGame
}) => {
  return (
    <div className={styles.setupContainer}>
      <div className={styles.setupHeader}>
        <h1 className={styles.title}>Oligo boardgame</h1>
        <p className={styles.subtitle}>
          Introduction/Rules
        </p>
      </div>
      
      <div className={styles.setupContent}>
        <div className={styles.rulesSection}>
          <div className={styles.rulesCard}>
            <h3 className={styles.rulesTitle}>How to Play</h3>
            <ul className={styles.rulesList}>
              <li className={styles.ruleItem}>
                <span className={styles.ruleIcon}></span>
                Take turns rolling 2 dice, moving the corresponding number of spaces around the board!
              </li>
              <li className={styles.ruleItem}>
                <span className={styles.ruleIcon}></span>
                Pick up cards from a variety of different types of tiles and act accordingly!
              </li>
              <li className={styles.ruleItem}>
                <span className={styles.ruleIcon}></span>
                Complete laps around board and pay taxes, gain income, and complete other events!
              </li>
              <li className={styles.ruleItem}>
                <span className={styles.ruleIcon}></span>
                Invest in properties to earn income, sell them, or take loans for more purchases!
              </li>
              <li className={styles.ruleItem}>
                <span className={styles.ruleIcon}></span>
                First to 1M$ wins!
              </li>
            </ul>
          </div>
        </div>
        
        <div className={styles.controlsSection}>
          <Controls 
            gameState={gameState}
            players={players}
            onPlayerCountChange={onPlayerCountChange}
            onStartGame={onStartGame}
            onResetGame={onResetGame}
            gameInProgress={false}
          />
        </div>
      </div>
    </div>
  )
}

export default GameSetup