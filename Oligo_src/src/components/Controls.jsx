import React, { useState, useEffect } from 'react'
import styles from './Controls.module.css'
import { GAME_CONFIG, COLORS, LOAN_OPTIONS } from '../data/gameConfig'
import { calculateBorrowingLimit } from '../utils/gameLogic'

const Controls = ({ 
  gameState = 'setup',
  players = [],
  currentPlayer,
  onPlayerCountChange,
  onStartGame,
  onResetGame,
  gameInProgress = false,
  onTakeLoan,
  onRepayLoan,
  pendingProperty,
  globalModifier
}) => {
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(GAME_CONFIG.MIN_PLAYERS)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [repaymentAmounts, setRepaymentAmounts] = useState({}) // installments per loan
  const [sessionBorrowedAmount, setSessionBorrowedAmount] = useState(0) // total borrowed in current property session
  
  // reset borrowed amount when property changes or popup closes
  useEffect(() => {
    if (!pendingProperty) {
      setSessionBorrowedAmount(0)
    }
  }, [pendingProperty])
  
  const handlePlayerCountChange = (count) => {
    setSelectedPlayerCount(count)
    onPlayerCountChange?.(count)
  }
  
  const handleStartGame = () => onStartGame?.()
  
  const handleResetGame = () => {
    onResetGame?.()
    setShowConfirmReset(false)
  }
  
  const handleLoanClick = (loanAmount) => {
    if (onTakeLoan && currentPlayer) {
      onTakeLoan(currentPlayer.id, loanAmount)
      setSessionBorrowedAmount(prev => prev + loanAmount)
    }
  }

  const updateRepaymentAmount = (loanId, change) => 
    setRepaymentAmounts(prev => ({ ...prev, [loanId]: Math.max(1, (prev[loanId] || 1) + change) }))

  const handleRepayLoan = (loanId, installments) => {
    onRepayLoan?.(loanId, installments)
    setRepaymentAmounts(prev => ({ ...prev, [loanId]: 1 }))
  }

  const getRepaymentAmount = (loanId) => repaymentAmounts[loanId] || 1

  const renderSetupControls = () => (
    <div className={styles.setupSection}>
      <h3 className={styles.sectionTitle}>Game Setup</h3>
      
      <div className={styles.playerCountSelector}>
        <label className={styles.label}>Number of Players:</label>
        <div className={styles.playerButtons}>
          {Array.from(
            { length: GAME_CONFIG.MAX_PLAYERS - GAME_CONFIG.MIN_PLAYERS + 1 },
            (_, i) => GAME_CONFIG.MIN_PLAYERS + i
          ).map((count) => (
            <button
              key={count}
              className={`${
                styles.playerButton
              } ${selectedPlayerCount === count ? styles.selected : ''}`}
              onClick={() => handlePlayerCountChange(count)}
              aria-pressed={selectedPlayerCount === count}
            >
              <span className={styles.playerIcon}></span>
              {count}
            </button>
          ))}
        </div>
      </div>
      
      {players.length > 0 && (
        <div className={styles.playerPreview}>
          <h4 className={styles.previewTitle}>Players:</h4>
          <div className={styles.playerList}>
            {players.map((player, index) => (
              <div 
                key={player.id}
                className={styles.playerPreviewItem}
                style={{ 
                  backgroundColor: COLORS[player.colorIndex],
                  color: '#eeefde'
                }}
              >
                <span className={styles.playerNumber}>P{index + 1}</span>
                <span className={styles.playerName}>{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        className={`${styles.startButton} ${players.length >= GAME_CONFIG.MIN_PLAYERS ? styles.ready : ''}`}
        onClick={handleStartGame}
        disabled={players.length < GAME_CONFIG.MIN_PLAYERS}
      >
        <span className={styles.buttonIcon}></span>
        Start Game
      </button>
    </div>
  )
  
  const renderGameControls = () => {
    let borrowingLimit = null
    if (pendingProperty && pendingProperty.property && globalModifier) {
      const property = pendingProperty.property
      
      // chance cards without a price (free cards) should not let borrowing
      if (property.type === 'Chance' && (!property.price || property.price === 0)) {
        borrowingLimit = 0
      } else {
        // map property types to modifier borrowing categories
        const drawPoolType = property.type === 'Property' ? 'property' : 
                            property.type === 'Factory' ? 'manufacturing' : 'bets' // include Bets, Risk, and Chance with price specified
        
        const borrowingInfo = calculateBorrowingLimit(globalModifier, drawPoolType, property.price)
        if (borrowingInfo.canBorrow) {
          borrowingLimit = borrowingInfo.maxBorrowAmount
        }
      }
    }

    return (
      <div className={styles.gameSection}>
        <div className={styles.gameStatus}>
          <div className={styles.currentPlayerInfo}>
            <h4 className={styles.currentPlayerTitle}>Current Turn:</h4>
            {currentPlayer && (
              <div 
                className={styles.currentPlayerDisplay}
                style={{ 
                  backgroundColor: COLORS[currentPlayer.colorIndex],
                  color: '#eeefde'
                }}
              >
                <span className={styles.playerIcon}></span>
                {currentPlayer.name}
              </div>
            )}
          </div>
          
          <div className={styles.gameStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Players:</span>
              <span className={styles.statValue}>{players.length}</span>
            </div>
          </div>
        </div>
        
        {/* Loan Section - Only show during property purchase decisions */}
        {gameInProgress && currentPlayer && pendingProperty && (
          <div className={styles.loanSection}>
            <h4 className={styles.loanTitle}>
              {`Borrow Money`}
            </h4>
            <h3 className={styles.loanSubtitle}>
              {borrowingLimit ? `(Max: ${(borrowingLimit / 1000).toFixed(0)}k for ${pendingProperty.property.type})` : '(No borrowing available)'}
            </h3>
            <div className={styles.loanOptions}>
              {LOAN_OPTIONS.map((option) => {
                const remainingBorrowingLimit = borrowingLimit !== null ? borrowingLimit - sessionBorrowedAmount : 0
                const isDisabledByGlobalLimit = pendingProperty && borrowingLimit !== null && option.borrowed > borrowingLimit
                const isDisabledBySessionLimit = pendingProperty && borrowingLimit !== null && option.borrowed > remainingBorrowingLimit
                const isDisabledByGame = gameState !== 'playing'
                const isDisabled = isDisabledByGame || isDisabledByGlobalLimit || isDisabledBySessionLimit
                
                return (
                  <button
                    key={option.borrowed}
                    className={`${styles.loanButton} ${isDisabled ? styles.limitedByModifier : ''}`}
                    onClick={() => handleLoanClick(option.borrowed)}
                    disabled={isDisabled}
                    title={
                      isDisabledByGlobalLimit ? `Exceeds ${((borrowingLimit / pendingProperty.property.price) * 100).toFixed(0)}% borrowing limit` :
                      isDisabledBySessionLimit ? `Only ${(remainingBorrowingLimit / 1000).toFixed(0)}k remaining` :
                      ''
                    }
                  >
                    <div className={styles.loanAmount}>
                      ${(option.borrowed / 1000).toFixed(0)}k
                    </div>
                    <div className={styles.loanDetails}>
                      Pay ${(option.perLap / 1000).toFixed(1)}k/lap
                    </div>  
                  </button>
                )
              })}
            </div>
            {borrowingLimit !== null && pendingProperty && (
              <div className={styles.borrowingInfo}>
                <small>
                  Borrow up to {((borrowingLimit / pendingProperty.property.price || 0) * 100).toFixed(0)}% of buying price
                  <br />
                  {sessionBorrowedAmount > 0 && (
                    <><>Borrowed this session: ${(sessionBorrowedAmount / 1000).toFixed(0)}k </><br />
                    <>Remaining: ${((borrowingLimit - sessionBorrowedAmount) / 1000).toFixed(0)}k</></>
                  )}
                </small>
              </div>
            )}
          </div>
        )}
            
        {/* Current Loans Display */}
        {gameInProgress && currentPlayer && currentPlayer.loans && currentPlayer.loans.length > 0 && (
          <div className={styles.currentLoans}>
            <h5 className={styles.loansTitle}>Current Loans</h5>
            {currentPlayer.loans.map((loan) => {
              const installments = getRepaymentAmount(loan.id)
              const totalPayment = loan.perLap * installments
              const canAfford = currentPlayer.money >= totalPayment
              
              return (
                <div key={loan.id} className={styles.loanItem}>
                  <div className={styles.loanInfo}>
                    <span className={styles.loanRemaining}>
                      ${(loan.remaining / 1000).toFixed(1)}k left
                    </span>
                    <span className={styles.loanLaps}>
                      {loan.lapsRemaining} laps
                    </span>
                  </div>
                  
                  <div className={styles.repaymentControls}>
                    <div className={styles.installmentSelector}>
                      <button 
                        className={styles.repaymentButton}
                        onClick={() => updateRepaymentAmount(loan.id, -1)}
                        disabled={installments <= 1}
                      >
                        -
                      </button>
                      <span className={styles.installmentAmount}>
                        {installments} × ${(loan.perLap / 1000).toFixed(1)}k = ${(totalPayment / 1000).toFixed(1)}k
                      </span>
                      <button 
                        className={styles.repaymentButton}
                        onClick={() => updateRepaymentAmount(loan.id, 1)}
                        disabled={installments >= loan.lapsRemaining || !canAfford}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className={`${styles.confirmPayment} ${!canAfford ? styles.disabled : ''}`}
                      onClick={() => handleRepayLoan(loan.id, installments)}
                      disabled={!canAfford}
                      title={!canAfford ? `Need $${(totalPayment / 1000).toFixed(1)}k` : `Pay $${(totalPayment / 1000).toFixed(1)}k`}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
  
  const renderResetControls = () => (
    <div className={styles.resetSection}>
      {!showConfirmReset ? (
        <button
          className={`${styles.resetButton} ${styles.warning}`}
          onClick={() => setShowConfirmReset(true)}
        >
          <span className={styles.buttonIcon}></span>
          Reset Game
        </button>
      ) : (
        <div className={styles.confirmReset}>
          <p className={styles.confirmText}>Reset the entire game?</p>
          <div className={styles.confirmActions}>
            <button
              className={`${styles.confirmButton} ${styles.danger}`}
              onClick={handleResetGame}
            >
              <span className={styles.buttonIcon}></span>
              Yes, Reset
            </button>
            <button
              className={`${styles.confirmButton} ${styles.cancel}`}
              onClick={() => setShowConfirmReset(false)}
            >
              <span className={styles.buttonIcon}></span>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
  
  return (
    <div className={styles.controlsContainer}>
      <div className={styles.controlsHeader}>
        <h2 className={styles.title}>Game Controls</h2>
      </div>
      
      <div className={styles.controlsContent}>
        {gameState === 'setup' && renderSetupControls()}
        {gameState === 'playing' && renderGameControls()}
        {gameInProgress && renderResetControls()}
      </div>
    </div>
  )
}

export default Controls