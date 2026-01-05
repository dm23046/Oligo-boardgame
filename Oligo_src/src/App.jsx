import React, { useState, useEffect } from 'react'
import GameSetup from './pages/GameSetup'
import GamePlay from './pages/GamePlay'
import useGame from './hooks/useGame'
import useDice from './hooks/useDice'
import { GAME_CONFIG, GAME_STATES } from './data/gameConfig'
import { TILE_POSITIONS } from './data/tilePositions'
import './index.css'

function App() {
  const {
    gameState,
    players,
    currentPlayer,
    initializePlayers,
    movePlayerToPosition,
    moveToTile,
    nextPlayerTurn,
    startGame,
    resetGame,
    checkWinCondition,
    awardMoney,
    pendingProperty,
    showPropertyPopup,
    isInFreePickMode,
    freePickPlayerId,
    selectedFreePickTile,
    handleBuyProperty,
    handleSellProperty,
    handlePassProperty,
    handleFreePickTileClick,
    executeFreePick,
    takeLoan,
    makeManualLoanPayment,
    moneyChanges,
    clearMoneyAnimations,
    globalModifier,
    activeEvents,
    drawNewModifier,
    handleJailEscapeAttempt,
    decreaseJailTurns,
    activateChanceMultiplier,
    clearChanceMultiplier,
    showBingoPopup,
    bingoPlayerId,
    handleCloseBingoPopup,
    handleBingoForcedSale,
    handleBingoCasino,
    handleBingoDuel,
    handleBingoDiscountPurchase,
    handleBingoCollectFromAll,
    handleBingoDoubleSale,
    showCasinoPopup,
    casinoPlayerId,
    handleCasinoBet,
    handleCloseCasinoPopup,
    showDuelPopup,
    duelInitiatorId,
    handleDuelComplete,
    handleCloseDuelPopup,
    forcedSaleMode,
    handleForcedSale,
    getDiceRoll,
    setNextDiceRoll,
    setPlayerMoney
  } = useGame()

  const {
    dice,
    isRolling,
    rollResult,
    rollDice,
    resetDice
  } = useDice()

  const [canEndTurn, setCanEndTurn] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const [rolledDoubles, setRolledDoubles] = useState(false)

  const handlePlayerCountChange = (count) => {
    if (gameState === GAME_STATES.SETUP) {
      initializePlayers(count)
    }
  }

  const handleStartGame = () => {
    if (players.length >= GAME_CONFIG.MIN_PLAYERS && players.length <= GAME_CONFIG.MAX_PLAYERS) {
      startGame()
      setCanEndTurn(false)
      setHasMoved(false)
      setRolledDoubles(false)
    }
  }

  const handleRollDice = () => {
    if (gameState === GAME_STATES.PLAYING && currentPlayer && !isRolling && (!hasMoved || rolledDoubles)) {
      // Check if player is in jail
      if (currentPlayer.jailStatus && currentPlayer.jailStatus.isInJail) {
        // Don't allow normal dice jail popup will handle it
        return
      }
      
      rollDice((diceValues) => {
        const total = diceValues[0] + diceValues[1]
        const isDoubles = diceValues[0] === diceValues[1]
        const isSixSix = diceValues[0] === 6 && diceValues[1] === 6
        
        console.log('dice:', diceValues, total, isDoubles && 'doubles!')
        
        movePlayerToPosition(currentPlayer.id, total)
        setHasMoved(true)
        
        if (isSixSix) {
          setTimeout(() => {
            awardMoney(currentPlayer.id, 500)
          }, 100)
        }
        
        if (isDoubles) {
          setRolledDoubles(true)
          setCanEndTurn(false)
        } else {
          setRolledDoubles(false)
          setCanEndTurn(true)
        }
        
        setTimeout(() => {
          if (checkWinCondition(currentPlayer.id)) {
            setCanEndTurn(false)
            setHasMoved(false)
            setRolledDoubles(false)
          }
        }, 1000)
      })
    }
  }

  const handleEndTurn = () => {
    if (pendingProperty && pendingProperty.property) {
      const property = pendingProperty.property
      const isLeisure = property.type === 'Leisure'
      const isTrophy = property.trophy
      
      if (isLeisure && !isTrophy) {
        if (property.perWorkplace) {
          const player = players.find(p => p.id === pendingProperty.playerId)
          const manufacturingCount = (player?.properties || []).filter(
            prop => prop.type === 'Manufacturing'
          ).length
          
          if (manufacturingCount > 0) {
            return
          }
        } else {
          return
        }
      }
    }
    
    const isJailedPlayer = currentPlayer?.jailStatus?.isInJail
    
    if ((canEndTurn && hasMoved) || isJailedPlayer) {
      clearMoneyAnimations()
      
      if (isJailedPlayer && !currentPlayer?.jailStatus?.justEntered) {
        decreaseJailTurns(currentPlayer.id)
        setTimeout(() => {
          nextPlayerTurn()
          setCanEndTurn(false)
          setHasMoved(false)
          resetDice()
        }, 50)
      } else {
        nextPlayerTurn()
        setCanEndTurn(false)
        setHasMoved(false)
        setRolledDoubles(false)
        resetDice()
      }
    }
  }

  const handleResetGame = () => {
    resetGame()
    setCanEndTurn(false)
    setHasMoved(false)
    setRolledDoubles(false)
    resetDice()
  }

  useEffect(() => {
    if (gameState === GAME_STATES.SETUP || gameState === GAME_STATES.FINISHED) {
      setCanEndTurn(false)
      setHasMoved(false)
      setRolledDoubles(false)
    }
  }, [gameState])

  useEffect(() => {
    if (players.length === 0) {
      initializePlayers(GAME_CONFIG.MIN_PLAYERS)
    }
  }, [players.length, initializePlayers])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.TILE_POSITIONS = TILE_POSITIONS
      
      window.moveTo = (tileNumber) => {
        if (gameState !== GAME_STATES.PLAYING) {
          console.warn('Game must be started first! Start a game to use moveTo()')
          return
        }
        if (!currentPlayer) {
          console.warn('No active player found')
          return
        }
        moveToTile(tileNumber)
      }
      
      window.setNextDiceRoll = (value) => {
        setNextDiceRoll(value)
      }
      
      window.setPlayerMoney = (amount) => {
        setPlayerMoney(amount)
      }
  
      window.listTiles = () => {
        console.table(
          TILE_POSITIONS.map(tile => ({
            ID: tile.id,
            Label: tile.label,
            DrawPool: tile.drawPool || '-',
            Action: tile.actionTile?.name || '-'
          }))
        )
      }
      
      console.log('debug: moveTo(n), setNextDiceRoll(n), listTiles()')
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.moveTo
        delete window.listTiles
        delete window.TILE_POSITIONS
      }
    }
  }, [gameState, currentPlayer, moveToTile])

  if (gameState === GAME_STATES.SETUP) {
    return (
      <GameSetup 
        gameState={gameState}
        players={players}
        onPlayerCountChange={handlePlayerCountChange}
        onStartGame={handleStartGame}
        onResetGame={handleResetGame}
      />
    )
  }

  return (
    <GamePlay 
      gameState={gameState}
      players={players}
      currentPlayer={currentPlayer}
      dice={dice}
      isRolling={isRolling}
      rollResult={rollResult}
      canEndTurn={canEndTurn}
      onRollDice={handleRollDice}
      onEndTurn={handleEndTurn}
      onResetGame={handleResetGame}
      pendingProperty={pendingProperty}
      showPropertyPopup={showPropertyPopup}
      isInFreePickMode={isInFreePickMode}
      freePickPlayerId={freePickPlayerId}
      selectedFreePickTile={selectedFreePickTile}
      onBuyProperty={handleBuyProperty}
      onSellProperty={handleSellProperty}
      onPassProperty={handlePassProperty}
      onFreePickTileClick={handleFreePickTileClick}
      onExecuteFreePick={executeFreePick}
      onTakeLoan={takeLoan}
      onRepayLoan={makeManualLoanPayment}
      moneyChanges={moneyChanges}
      globalModifier={globalModifier}
      activeEvents={activeEvents}
      onDrawNewModifier={drawNewModifier}
      onJailEscapeAttempt={handleJailEscapeAttempt}
      onDecreaseJailTurns={decreaseJailTurns}
      onActivateChanceMultiplier={activateChanceMultiplier}
      showBingoPopup={showBingoPopup}
      bingoPlayerId={bingoPlayerId}
      onCloseBingoPopup={handleCloseBingoPopup}
      onBingoForcedSale={handleBingoForcedSale}
      onBingoCasino={handleBingoCasino}
      onBingoDuel={handleBingoDuel}
      onBingoDiscountPurchase={handleBingoDiscountPurchase}
      onBingoCollectFromAll={handleBingoCollectFromAll}
      onBingoDoubleSale={handleBingoDoubleSale}
      showCasinoPopup={showCasinoPopup}
      casinoPlayerId={casinoPlayerId}
      onCasinoBet={handleCasinoBet}
      onCloseCasinoPopup={handleCloseCasinoPopup}
      showDuelPopup={showDuelPopup}
      duelInitiatorId={duelInitiatorId}
      onDuelComplete={handleDuelComplete}
      onCloseDuelPopup={handleCloseDuelPopup}
      forcedSaleMode={forcedSaleMode}
      onForcedSale={handleForcedSale}
      getDiceRoll={getDiceRoll}
    />
  )
}

export default App