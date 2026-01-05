import { useState, useCallback, useEffect } from 'react'
import { movePlayerPosition, getPlayerPosition, checkStartCrossing, getRandomPropertyFromDrawPool, roundMoneyUp, updatePlayer, updatePlayerMoney, updatePlayerProps, rollDie } from '../utils/gameLogic'
import { MODIFIER_DRAWPOOL, GAME_CONFIG, GAME_STATES, DEFAULT_PLAYER, LOAN_OPTIONS, DEFAULT_GLOBAL_MODIFIER, ACTION_TILES } from '../data/gameConfig'
import { checkTileDrawPool } from '../utils/gameLogic'
import { TILE_POSITIONS, MOVEMENT_SEQUENCE } from '../data/tilePositions'

export const useGame = () => {
  const [gameState, setGameState] = useState(GAME_STATES.SETUP)
  const [playerCount, setPlayerCount] = useState(GAME_CONFIG.MIN_PLAYERS)
  const [players, setPlayers] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [pendingProperty, setPendingProperty] = useState(null)
  const [showPropertyPopup, setShowPropertyPopup] = useState(false)
  const [freePick, setFreePick] = useState({ playerId: null, tile: null })
  const [moneyChanges, setMoneyChanges] = useState([])
  const [globalModifier, setGlobalModifier] = useState(null)
  const [currentModifierIndex, setCurrentModifierIndex] = useState(0)
  const [drawnEventIndices, setDrawnEventIndices] = useState([])
  const [activeEvents, setActiveEvents] = useState([]) // Global events active for all players
  const [popupState, setPopupState] = useState({ bingo: null, casino: null, duel: null })
  const [forcedSaleMode, setForcedSaleMode] = useState(null) // { playerId, percentage, reason }
  const [nextDiceRoll, setNextDiceRoll] = useState(null) // For debugging: force next dice roll outcome

  const getActiveEventByEffect = useCallback((effectType) => {
    return activeEvents.find(event => event.effect?.type === effectType) || null
  }, [activeEvents])

  // Debug: force next dice roll
  const setNextDiceRollDebug = useCallback((value) => {
    if (value < 2 || value > 12) {
      console.error('Invalid dice roll. Must be 2-12')
      return
    }
    setNextDiceRoll(value)
    console.log(`Next roll set to: ${value}`)
  }, [])

  // Debug: set active player money
  const setPlayerMoneyDebug = useCallback((amount) => {
    if (typeof amount !== 'number' || amount < 0) {
      console.error('Invalid money amount. Must be a positive number')
      return
    }
    setPlayers(prevPlayers => {
      const currentPlayerId = prevPlayers[currentPlayerIndex]?.id
      if (!currentPlayerId) {
        console.error('No active player found')
        return prevPlayers
      }
      
      return updatePlayer(prevPlayers, currentPlayerId, player => 
        updatePlayerProps(player, { money: roundMoneyUp(amount) })
      )
    })
    console.log(`Active player money set to: $${amount}`)
  }, [currentPlayerIndex])



  const getDiceRoll = useCallback(() => {
    if (nextDiceRoll !== null) {
      const value = nextDiceRoll
      setNextDiceRoll(null)
      console.log(`Using forced roll: ${value}`)
      return value
    }
    const dice1 = rollDie()
    const dice2 = rollDie()
    return dice1 + dice2
  }, [nextDiceRoll])

  const initializePlayers = useCallback((count) => {
    setPlayers(Array.from({ length: count }, (_, i) => ({
      ...DEFAULT_PLAYER,
      id: i + 1,
      name: `Player ${i + 1}`,
      color: GAME_CONFIG.PLAYER_COLORS[i],
      colorIndex: i,
      position: 0,
      isActive: i === 0
    })))
    setCurrentPlayerIndex(0)
  }, [])

  /**
   * Start the game with current player configuration
   */
  const startGame = useCallback(() => {
    if (players.length === 0) {
      initializePlayers(playerCount)
    }
    setGameState(GAME_STATES.PLAYING)
    
    setGlobalModifier(DEFAULT_GLOBAL_MODIFIER)
    setCurrentModifierIndex(0)
  }, [players.length, playerCount, initializePlayers])

  const triggerMoneyAnimation = useCallback((playerId, amount, reason = '') => {
    const playerElement = document.querySelector(`[data-player-id="${playerId}"]`)
    let x = '50%'
    let y = '50%'
    
    if (playerElement) {
      const rect = playerElement.getBoundingClientRect()
      x = rect.right - 50 + 'px'
      y = rect.top + rect.height / 2 + 'px'
    }

    const change = {
      playerId,
      amount,
      reason,
      x,
      y,
      timestamp: Date.now()
    }

    setMoneyChanges(prev => [...prev, change])

    setTimeout(() => {
      setMoneyChanges(prev => prev.filter(c => c.timestamp !== change.timestamp))
    }, 2500)
  }, [])

  const clearMoneyAnimations = useCallback(() => {
    setMoneyChanges([])
  }, [])

  // used to create a pending property for player to buy/pass
  const awardProperty = useCallback((playerId, property) => {
    const player = players.find(p => p.id === playerId)
    if (player?.isBankrupt) {
      console.log(`${player.name} is bankrupt and cannot receive properties`)
      return
    }
    console.log(`Offering ${property?.name} to ${player?.name}`)
    if (player) {
      setPendingProperty({ property, playerId })
      setShowPropertyPopup(true)
    }
  }, [players])




  const handleBuyProperty = useCallback((betAmount, betSuccess, rollValue) => {
    if (!pendingProperty) return
    
    const { property, playerId } = pendingProperty
    const player = players.find(p => p.id === playerId)
    
    console.log(`${player?.name} buying ${property?.name} for $${property?.price}`)
    
    if (property.type === 'Risk' && property.roll && betAmount !== undefined) {
      setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
        if (betSuccess) {
          const winnings = roundMoneyUp(betAmount)
          triggerMoneyAnimation(playerId, winnings, `Risk Win! (Rolled ${rollValue})`)
          return updatePlayerMoney(player, winnings)
        } else {
          triggerMoneyAnimation(playerId, -betAmount, `Risk Loss (Rolled ${rollValue})`)
          return updatePlayerMoney(player, -betAmount)
        }
      }))
      
      setShowPropertyPopup(false)
      setPendingProperty(null)
      return
    }
    
    let finalPrice = property.price || 0

    if (property.perWorkplace && property.type === 'Leisure') {
      const manufacturingCount = (player.properties || []).filter(
        prop => prop.type === 'Manufacturing'
      ).length
      
      finalPrice = property.perWorkplace * manufacturingCount
      
      if (manufacturingCount === 0) {
        setShowPropertyPopup(false)
        setPendingProperty(null)
        return
      }
    }

    const discountEvent = getActiveEventByEffect('propertyDiscount')
    if (discountEvent && property.type === 'Property') {
      finalPrice = Math.floor(finalPrice * (1 - discountEvent.effect.discount))
    }
    

    if (player.bingoDiscount) {
      finalPrice = Math.floor(finalPrice * (1 - player.bingoDiscount))
    }
    
    if (player && (finalPrice === 0 || player.money >= finalPrice)) {
      setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, p => {
        const propertyToAdd = {
          ...property,
          actualPurchasePrice: finalPrice
        }
        
        if (property.type === 'Risk' && property.lapsToSell) {
          propertyToAdd.lapsRemaining = property.lapsToSell
          propertyToAdd.acquiredOnLap = p.lapCount || 0
        }
        
        const updatedProperties = [...(p.properties || []), propertyToAdd]
        
        triggerMoneyAnimation(playerId, -finalPrice,
          property.perWorkplace ? 'Workplace Leisure' : 
          property.type === 'Risk' ? 'Risk Card Purchase' : 'Property Purchase')
        
        return updatePlayerProps(p, {
          properties: updatedProperties,
          money: roundMoneyUp(p.money - finalPrice),
          bingoDiscount: null,
          hasMoved: false,
          justPurchasedPropertyId: propertyToAdd.id
        })
      }))
    }
    
    setShowPropertyPopup(false)
    setPendingProperty(null)
  }, [pendingProperty, players, getActiveEventByEffect, triggerMoneyAnimation])

  const closePopupsForPlayer = useCallback((playerId) => {
    // Close any popups related to this player
    if (pendingProperty?.playerId === playerId) {
      setPendingProperty(null)
      setShowPropertyPopup(false)
    }
    if (freePick.playerId === playerId) {
      setFreePick({ playerId: null, tile: null })
    }
    if (popupState.bingo === playerId) {
      setPopupState(prev => ({ ...prev, bingo: null }))
    }
    if (popupState.casino === playerId) {
      setPopupState(prev => ({ ...prev, casino: null }))
    }
    if (popupState.duel === playerId) {
      setPopupState(prev => ({ ...prev, duel: null }))
    }
  }, [pendingProperty, freePick, popupState])

  const handlePassProperty = useCallback(() => {
    if (!pendingProperty) return
    const { property, playerId } = pendingProperty
    const player = players.find(p => p.id === playerId)
    
    console.log(`${player?.name} passed on ${property?.name}`)
    
    if (property.type === 'Leisure' && !property.trophy) {
      if (property.perWorkplace) {
        const player = players.find(p => p.id === pendingProperty.playerId)
        const manufacturingCount = (player?.properties || []).filter(
          prop => prop.type === 'Manufacturing'
        ).length
        
        // if player has manufacturing properties
        if (manufacturingCount > 0) {
          console.log('Cannot pass mandatory leisure card. You must purchase it or take a loan.')
          return 
        }
      } else {
        console.log('Cannot pass mandatory leisure card. You must purchase it or take a loan.')
        return 
      }
    }
    
    // allow passing
    setShowPropertyPopup(false)
    setPendingProperty(null)
  }, [pendingProperty, players])

  const handleLoanRepayment = useCallback((playerId, repaymentResult, bailoutInfo = null) => {
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
      // Player pays what they can from their money
      let newMoney = roundMoneyUp(Math.max(0, player.money - repaymentResult.totalPaid))
      
      if (repaymentResult.totalPaid > 0) {
        triggerMoneyAnimation(playerId, -repaymentResult.totalPaid, 'Loan Payment')
      }
      
      // Show bailout animation if used (but don't add to player money)
      if (bailoutInfo && bailoutInfo.canUseBailout && repaymentResult.bailoutUsed > 0) {
        triggerMoneyAnimation(playerId, -repaymentResult.bailoutUsed, `${bailoutInfo.label || 'Bailout'} (Loan Payment)`)
      }
      
      // Check if forced sale is needed
      if (bailoutInfo && bailoutInfo.needsForcedSale) {
        if (player.properties.length !== 0){
          console.log(`Player needs to sell properties worth $${bailoutInfo.forcedSaleAmount} for loan payment`)
          setForcedSaleMode({
            playerId: playerId,
            reason: bailoutInfo.forcedSaleReason,
            percentage: 0.5, // 50% sale price
            requiredAmount: bailoutInfo.forcedSaleAmount
          })
        } else {
          console.log('Player has no properties to sell for forced sale - resetting to bankruptcy state')
          triggerMoneyAnimation(playerId, DEFAULT_PLAYER.money - player.money, 'Bankruptcy Reset')
          // Reset player to fresh state (bankrupt)
          closePopupsForPlayer(playerId)
          return {
            ...player,
            money: DEFAULT_PLAYER.money,
            loans: [],
            position: 0,
            properties: [],
            lapCount: 0,
            mafiaStatus: false,
            jailStatus: null,
            activeChanceMultiplier: null,
            bingoDiscount: null,
            hasMoved: false,
            justPurchasedPropertyId: null,
            clearMafiaStatus: false,
            isBankrupt: true
          }
        }
      }
      
      return updatePlayerProps(player, {
        money: newMoney,
        loans: repaymentResult.updatedLoans
      })
    }))
  }, [triggerMoneyAnimation])

  /**
   * Handle property income when player crosses START
   * @param {number} playerId - ID of the player
   * @param {number} totalIncome - Total income amount
   * @param {string} reason - Reason for the income
   */
  const handlePropertyIncome = useCallback((playerId, totalIncome, reason = 'Property Income', newLapCount, updatedProperties, bailoutInfo = null) => {
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
      triggerMoneyAnimation(playerId, totalIncome, reason)
      
      return updatePlayerProps(player, {
        money: roundMoneyUp(player.money + totalIncome),
        lapCount: newLapCount !== undefined ? newLapCount : player.lapCount,
        properties: updatedProperties !== undefined ? updatedProperties : player.properties
      })
    }))
  }, [triggerMoneyAnimation])

  /**
   * Check if player landed on an action tile and handle it
   * @param {number} tileId - ID of the tile to check
   * @param {Object} player - Player object
   */
  const checkActionTile = (tileId, player) => {
    if (player.isBankrupt) {
      console.log(`${player.name} is bankrupt and cannot trigger action tiles`)
      return
    }
    
    const tile = TILE_POSITIONS.find(t => t.id === tileId)
    
    if (tile && tile.actionTile) {
      console.log(`${player.name} triggered ${tile.actionTile.name}`)
      
      if (tile.actionTile.id === 'freePick') {
        setFreePick({ playerId: player.id, tile: null })
      } else if (tile.actionTile.id === 'jail') {
        handleJailEntry(player.id)
      } else if (tile.actionTile.id === 'tax') {
        handleTaxPayment(player.id)
      } else if (tile.actionTile.id === 'event') {
        handleEventDraw(player.id)
      } else if (tile.actionTile.id === 'mafia') {
        handleMafiaTile(player.id)
      } else if (tile.actionTile.id === 'incomeTax') {
        handleIncomeTaxTile(player.id)
      } else if (tile.actionTile.id === 'cycle') {
        drawNewModifier()
      } else if (tile.actionTile.id === 'bingo') {
        handleBingoTile(player.id)
      }
    }
  }

  /**
   * Handle player landing on jail tile
   * @param {number} playerId - ID of the player
   */
  const handleJailEntry = useCallback((playerId) => {
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
      // only process if not already in jail
      if (player.jailStatus?.isInJail) {
        return player
      }
      
      const jailConfig = ACTION_TILES.jail
      const penaltyAmount = roundMoneyUp(player.money * jailConfig.penaltyPercent)
      
      triggerMoneyAnimation(playerId, -penaltyAmount, 'Jail Penalty (10%)')
      
      return updatePlayerProps(player, {
        money: roundMoneyUp(player.money - penaltyAmount),
        jailStatus: {
          isInJail: true,
          turnsRemaining: jailConfig.turnsToSkip,
          penaltyPaid: true,
          penaltyAmount: penaltyAmount,
          justEntered: true // flag to show popup only once
        }
      })
    }))
  }, [triggerMoneyAnimation])

  /**
   * Handle player landing on tax tile
   * @param {number} playerId - ID of the player
   */
  const handleTaxPayment = useCallback((playerId) => {
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
      const taxConfig = ACTION_TILES.tax
      
      // Tax 10% of total card purchase prices (not including cash)
      const totalCardPurchasePrice = (player.properties || []).reduce((sum, prop) => {
        return sum + (prop.actualPurchasePrice || prop.price || 0)
      }, 0)
      
      const taxAmount = roundMoneyUp(totalCardPurchasePrice * taxConfig.taxPercent)
      
      triggerMoneyAnimation(playerId, -taxAmount, 'Tax (10% Card Value)')
      
      return updatePlayerProps(player, {
        money: roundMoneyUp(Math.max(0, player.money - taxAmount))
      })
    }))
  }, [triggerMoneyAnimation])

  /**
   * Handle player landing on event tile
   * Draws the next event card from current modifier cycle
   * Events are global and stay active for all players until a new modifier cycle is drawn
   * @param {number} playerId - ID of the player who landed on the event tile
   */
  const handleEventDraw = useCallback((playerId) => {
    
    if (!globalModifier) {
      return // no modifier available
    }
    
    const events = globalModifier.events || []
    
    if (events.length === 0) {
      return // no events in this modifier
    }
    
    // Check if all events for current modifier have been drawn
    if (drawnEventIndices.length >= events.length) {
      // all events are drawn, draw next cycle
      const allModifiers = MODIFIER_DRAWPOOL.modifier
      const nextIndex = (currentModifierIndex + 1) % allModifiers.length
      
      const newModifier = allModifiers[nextIndex]
      setGlobalModifier(newModifier)
      setCurrentModifierIndex(nextIndex)
      setActiveEvents([])
      setDrawnEventIndices([])
      return
    }
    
    // draw next event from current modifier
    const nextEventIndex = drawnEventIndices.length
    const nextEvent = events[nextEventIndex]
    if (nextEvent) {
      setDrawnEventIndices(prev => [...prev, nextEventIndex])
      setActiveEvents(prev => [...prev, nextEvent])
    }
  }, [globalModifier, drawnEventIndices, currentModifierIndex])

  /**
   * Handle jail escape attempt
   * @param {number} playerId - ID of the player
   * @param {number} diceRoll - Total dice roll value
   * @returns {boolean} True if escape successful
   */
  const handleJailEscapeAttempt = useCallback((playerId, diceRoll) => {
    const player = players.find(p => p.id === playerId)
    if (!player || !player.jailStatus.isInJail) return false
    
    const jailConfig = ACTION_TILES.jail
    
    if (player.money < jailConfig.escapeAttemptCost) {
      return false
    }
    
    const escapeSuccessful = diceRoll >= jailConfig.escapeRollTarget
    
    setPlayers(prevPlayers => {
      return prevPlayers.map(p => {
        if (p.id === playerId) {
          triggerMoneyAnimation(playerId, -jailConfig.escapeAttemptCost, 
            escapeSuccessful ? 'Jail Escape (Success)' : 'Jail Escape (Failed)')
          
          return {
            ...p,
            money: p.money - jailConfig.escapeAttemptCost,
            jailStatus: escapeSuccessful ? {
              isInJail: false,
              turnsRemaining: 0
            } : {
              ...p.jailStatus,
              justEntered: false
            }
          }
        }
        return p
      })
    })
    
    return escapeSuccessful
  }, [players, triggerMoneyAnimation])

  /**
   * Decrease jail turns at the start of player's turn
   * @param {number} playerId - ID of the player
   */
  const decreaseJailTurns = useCallback((playerId) => {
    setPlayers(prevPlayers => prevPlayers.map(player => {
      if (player.id === playerId && player.jailStatus.isInJail) {
        const newTurnsRemaining = player.jailStatus.turnsRemaining - 1
        return {
          ...player,
          jailStatus: {
            isInJail: newTurnsRemaining > 0,
            turnsRemaining: newTurnsRemaining,
            justEntered: false
          }
        }
      }
      return player
    }))
  }, [])

  /**
   * Manage FreePick mode - handles tile selection, execution, and exit
   * @param {string} action - Action to perform ('selectTile', 'execute', 'exit')
   * @param {Object} tile - Tile data (only for 'selectTile' action)
   */
  const freePickAction = useCallback((action, tile = null) => {
    switch (action) {
      case 'selectTile':
        if (!freePick.playerId || !tile?.drawPool) return
        setFreePick(prev => ({ ...prev, tile }))
        break
      
      case 'execute':
        if (!freePick.playerId || !freePick.tile?.drawPool) return
        const player = players.find(p => p.id === freePick.playerId)
        if (!player) return
        const property = getRandomPropertyFromDrawPool(
          freePick.tile.drawPool, 
          players.flatMap(p => p.properties?.map(prop => prop.id) || [])
        )
        if (property) {
          setPendingProperty({ property, playerId: freePick.playerId })
          setShowPropertyPopup(true)
        }
        setFreePick({ playerId: null, tile: null })
        break
      
      case 'exit':
        setFreePick({ playerId: null, tile: null })
        break
      
      default:
        console.warn(`Unknown FreePick action: ${action}`)
    }
  }, [freePick, players])

  // Legacy aliases for backward compatibility
  const handleFreePickTileClick = useCallback((tile) => freePickAction('selectTile', tile), [freePickAction])
  const executeFreePick = useCallback(() => freePickAction('execute'), [freePickAction])
  const exitFreePickMode = useCallback(() => freePickAction('exit'), [freePickAction])

  /**
   * Move current player by specified steps
   * @param {number} steps - Number of steps to move
   */
  const moveCurrentPlayer = useCallback((steps) => {
    if (gameState !== GAME_STATES.PLAYING || players.length === 0) return

    const currentPlayer = players[currentPlayerIndex]
    const oldPosition = currentPlayer.position
    const newPosition = movePlayerPosition(currentPlayer.position, steps)
    
    const oldTileId = MOVEMENT_SEQUENCE[oldPosition]
    const newTileId = MOVEMENT_SEQUENCE[newPosition]
    const oldTile = TILE_POSITIONS.find(t => t.id === oldTileId)
    const newTile = TILE_POSITIONS.find(t => t.id === newTileId)
    
    console.log(`${currentPlayer.name} moved ${steps} to ${newTile?.label}`)
    
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers]
      const updatedPlayer = {
        ...currentPlayer,
        position: newPosition,
        hasMoved: true,
        justPurchasedPropertyId: null
      }
      updatedPlayers[currentPlayerIndex] = updatedPlayer
      
      setTimeout(() => {
        // Skip tile landing logic for bankrupt players
        if (updatedPlayer.isBankrupt) {
          console.log(`${updatedPlayer.name} is bankrupt - skipping tile landing logic`)
          return
        }
        
        const tileId = MOVEMENT_SEQUENCE[newPosition]
        
        const playerAfterStart = checkStartCrossing(oldPosition, newPosition, updatedPlayer, handleLoanRepayment, handlePropertyIncome, globalModifier)
        
        checkTileDrawPool(
          tileId, 
          updatedPlayer, 
          TILE_POSITIONS, 
          updatedPlayers, 
          awardProperty
        )
        
        // check for action tiles (like freePick)
        checkActionTile(tileId, updatedPlayer)
        
        // Set clearMafiaStatus flag if needed
        if (playerAfterStart.clearMafiaStatus) {
          setPlayers(prevPlayers => updatePlayer(prevPlayers, updatedPlayer.id, p => 
            updatePlayerProps(p, { clearMafiaStatus: true })
          ))
        }
      }, 100)
      
      return updatedPlayers
    })

  }, [gameState, players, currentPlayerIndex, awardProperty, handleLoanRepayment, handlePropertyIncome, checkActionTile, globalModifier])

  /**
   * Award money to a specific player
   * @param {number} playerId - ID of the player to award money to
   * @param {number} amount - Amount of money to award
   */
  const awardMoney = useCallback((playerId, amount) => {
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
      triggerMoneyAnimation(playerId, amount, amount > 0 ? 'Bonus' : 'Penalty')
      return updatePlayerMoney(player, amount)
    }))
  }, [triggerMoneyAnimation])

  /**
   * Update player status properties generically
   * @param {number} playerId - ID of the player
   * @param {Object} updates - Object with property updates
   */
  const updatePlayerStatus = useCallback((playerId, updates) => {
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => 
      updatePlayerProps(player, updates)
    ))
  }, [])

  /**
   * Clear active chance multiplier (called on end turn)
   * @param {number} playerId - ID of the player
   */
  const clearChanceMultiplier = useCallback((playerId) => {
    updatePlayerStatus(playerId, { activeChanceMultiplier: null })
  }, [updatePlayerStatus])

  /**
   * Activate a chance card multiplier
   * @param {number} playerId - ID of the player
   * @param {Object} chanceCard - The chance card to activate
   */
  const activateChanceMultiplier = useCallback((playerId, chanceCard) => {
    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.id === playerId) {
          // remove the chance card from properties
          const updatedProperties = player.properties.filter(prop => prop.id !== chanceCard.id)
          
          return {
            ...player,
            properties: updatedProperties,
            activeChanceMultiplier: {
              cardId: chanceCard.id,
              multiplier: chanceCard.multiplier,
              affected: chanceCard.affected,
              cardName: chanceCard.name
            }
          }
        }
        return player
      })
    })
  }, [])

  /**
   * Advance to next player's turn
   */
  const nextPlayerTurn = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || players.length === 0) return

    // clear chance multiplier and mafia for current player when turn ends
    const currentPlayerId = players[currentPlayerIndex]?.id
    const currentPlayer = players[currentPlayerIndex]
    if (currentPlayerId) {
      clearChanceMultiplier(currentPlayerId)
      if (currentPlayer?.clearMafiaStatus) {
        updatePlayerStatus(currentPlayerId, { mafiaStatus: false, clearMafiaStatus: false })
      }
      // Clear justEntered flag for player in jail when their turn ends
      if (currentPlayer?.jailStatus?.justEntered) {
        updatePlayerStatus(currentPlayerId, { jailStatus: { ...currentPlayer.jailStatus, justEntered: false } })
      }
    }

    setPlayers(prevPlayers => 
      prevPlayers.map((player, index) => ({
        ...player,
        isActive: index === (currentPlayerIndex + 1) % players.length
      }))
    )
    
    setCurrentPlayerIndex(prev => (prev + 1) % players.length)
  }, [gameState, players, currentPlayerIndex, clearChanceMultiplier])

  /**
   * Reset game to setup state
   */
  const resetGame = useCallback(() => {
    setGameState(GAME_STATES.SETUP)
    setPlayers([])
    setCurrentPlayerIndex(0)
    setPlayerCount(GAME_CONFIG.MIN_PLAYERS)
    setPendingProperty(null)
    setShowPropertyPopup(false)
    setFreePick({ playerId: null, tile: null })
    setMoneyChanges([])
    setGlobalModifier(null)
    setCurrentModifierIndex(0)
    setDrawnEventIndices([])
    setActiveEvents([])
    setPopupState({ bingo: null, casino: null, duel: null }) // used for bingo popup and casino popup
    setForcedSaleMode(null)
    setNextDiceRoll(null)
  }, [])

  /**
   * Update player count (only in setup mode)
   * @param {number} count - New player count
   */
  const updatePlayerCount = useCallback((count) => {
    if (gameState === GAME_STATES.SETUP) {
      const validCount = Math.max(
        GAME_CONFIG.MIN_PLAYERS, 
        Math.min(GAME_CONFIG.MAX_PLAYERS, count)
      )
      setPlayerCount(validCount)
      initializePlayers(validCount)
    }
  }, [gameState, initializePlayers])

  /**
   * Get current player object
   * @returns {Object|null} Current player or null
   */
  const getCurrentPlayer = useCallback(() => {
    return players[currentPlayerIndex] || null
  }, [players, currentPlayerIndex])

  /**
   * Get player positions for rendering
   * @returns {Array} Array of player position data
   */
  const getPlayerPositions = useCallback(() => {
    return players.map(player => ({
      ...player,
      visualPosition: getPlayerPosition(player, players)
    }))
  }, [players])

  /**
   * Check if game is in specific state
   * @param {string} state - State to check
   * @returns {boolean} True if in specified state
   */
  const isGameState = useCallback((state) => {
      return gameState === state
    }, [gameState])

    //Initialize players when player count changes in setup mode
    useEffect(() => {
      if (gameState === GAME_STATES.SETUP && playerCount > 0) {
        initializePlayers(playerCount)
      }
    }, [gameState, playerCount, initializePlayers])

  const movePlayerToPosition = useCallback((playerId, steps) => {
      const playerIndex = players.findIndex(p => p.id === playerId)
      if (playerIndex !== -1 && playerIndex === currentPlayerIndex) {
        moveCurrentPlayer(steps)
        return movePlayerPosition(players[playerIndex].position, steps)
      }
      return players.find(p => p.id === playerId)?.position || 0
  }, [players, currentPlayerIndex, moveCurrentPlayer])


    /**
     * Check if a player has won the game (first to reach winning money amount)
     */
  
  const checkWinCondition = useCallback((playerId) => {
      const player = players.find(p => p.id === playerId)
      if (player && player.money >= GAME_CONFIG.WINNING_MONEY) {
        setGameState(GAME_STATES.FINISHED)
        setPlayers(prevPlayers => 
          prevPlayers.map(p => ({
            ...p,
            hasWon: p.id === playerId
          }))
        )
        return true
      }
      return false
    }, [players])

    /** * Take a loan for a player
     * @param {number} playerId - ID of the player taking the loan
     * @param {number} loanAmount - Amount of money to borrow
     */
  
    const takeLoan = useCallback((playerId, loanAmount) => {
      const player = players.find(p => p.id === playerId)
      console.log(`${player?.name} took loan of $${loanAmount}`)
      
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          if (player.id === playerId) {
            const loanOption = LOAN_OPTIONS.find(option => option.borrowed === loanAmount)
            if (!loanOption) return player

            const loan = {
              id: `loan_${Date.now()}_${playerId}`,
              borrowed: loanOption.borrowed,
              totalRepaid: loanOption.totalRepaid,
              remaining: loanOption.totalRepaid,
              lapsRemaining: loanOption.laps,
              perLap: loanOption.perLap
            }

            const updatedLoans = [...(player.loans || []), loan]
            const updatedMoney = player.money + loanAmount

            return {
              ...player,
              money: updatedMoney,
              loans: updatedLoans
            }
          }
          return player
        })
      })
    }, [])

    /**
     * Make a manual loan repayment
     * @param {string} loanId - ID of the loan to repay
     * @param {number} installments - Number of installments to pay
     */
  
    const makeManualLoanPayment = useCallback((loanId, installments = 1) => {
    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        // Only allow the current active player to make loan payments
        if (player.id !== currentPlayerIndex + 1) return player

        const loan = player.loans?.find(l => l.id === loanId)
        if (!loan) return player

        const totalPayment = loan.perLap * installments

        if (player.money < totalPayment) {
          return player
        }

        // Calculate updated values after payment
        const newMoney = roundMoneyUp(player.money - totalPayment)
        const newRemaining = Math.max(0, loan.remaining - totalPayment)
        const newLapsRemaining = Math.max(0, loan.lapsRemaining - installments)

        triggerMoneyAnimation(player.id, -totalPayment, 'Manual Payment')

        // Update the loans array
        const updatedLoans = player.loans.map(l => {
          if (l.id === loanId) {
            // if loan is fully paid off return null to remove it
            if (newRemaining <= 0 || newLapsRemaining <= 0) {
              return null
            }
            // otherwise update
            return {
              ...l,
              remaining: newRemaining,
              lapsRemaining: newLapsRemaining
            }
          }
          return l
        }).filter(Boolean) // removes paid loans

        // return updated player
        return {
          ...player,
          money: newMoney,
          loans: updatedLoans
        }
      })
    })
  }, [currentPlayerIndex, triggerMoneyAnimation])

   /**
   * Handle selling a property
   * @param {string} playerId - ID of the player selling
   * @param {Object} property - Property to sell
   * @param {number} customSalePrice - Optional custom sale price
   * @param {boolean} isOnMarket - Whether the player is on a market tile
   */

  const handleSellProperty = useCallback((playerId, property, customSalePrice = null, isOnMarket = false) => {
    const player = players.find(p => p.id === playerId)
    
    // Can't sell non-owned property
    if (!player || !player.properties?.some(p => p.id === property.id)) {
      return
    }
    if (player.justPurchasedPropertyId === property.id) {
      console.log('Cannot sell property on the same tile where it was just purchased')
      return
    }

    if (property.type === 'Leisure') {
      // all leisure items can only be sold on market
      if (!isOnMarket) {
        return
      }
      customSalePrice = property.actualPurchasePrice || property.price
    }

    setPlayers(prevPlayers => {
      return prevPlayers.map(p => {
        if (p.id === playerId) {
          const updatedProperties = p.properties.filter(prop => prop.id !== property.id)
          let saleAmount = customSalePrice !== null ? customSalePrice : property.sale

          
          if (property.type !== 'Leisure' && customSalePrice === null) {
            const boostEvent = getActiveEventByEffect('stockBoost')
            if (boostEvent && property.type === 'Bets' && property.name === 'Stock') {
              const boost = saleAmount * (boostEvent.effect.multiplier - 1)
              saleAmount = Math.floor(saleAmount + boost)
            }

            const rawBoostEvent = getActiveEventByEffect('rawBoost')
            if (rawBoostEvent && property.type === 'Bets' && property.name === 'Raw Materials') {
              const boost = saleAmount * (rawBoostEvent.effect.multiplier - 1)
              saleAmount = Math.floor(saleAmount + boost)
            }

            // apply active chance card multiplier if it affects this property
            if (p.activeChanceMultiplier && (p.activeChanceMultiplier.affected === property.name || p.activeChanceMultiplier.affected === property.type)) {
              saleAmount = Math.floor(saleAmount * (1 + p.activeChanceMultiplier.multiplier))
            }
          }

          const updatedMoney = roundMoneyUp(p.money + saleAmount)
          
          triggerMoneyAnimation(playerId, saleAmount,
            isOnMarket ? 'Market Sale' :
            property.trophy ? 'Trophy Sale' : 'Property Sale')
          
          return {
            ...p,
            properties: updatedProperties,
            money: updatedMoney
          }
        }
        return p
      })
    })
  }, [players, triggerMoneyAnimation, getActiveEventByEffect])

  /**
   * Draw a new modifier from the modifier drawpool
   * This clears all active events and resets event drawing
   */


  const drawNewModifier = useCallback(() => {
    const allModifiers = MODIFIER_DRAWPOOL.modifier
    const nextIndex = (currentModifierIndex + 1) % allModifiers.length
    
    const newModifier = allModifiers[nextIndex]
    setGlobalModifier(newModifier)
    setCurrentModifierIndex(nextIndex)
    setActiveEvents([])
    setDrawnEventIndices([])
    return newModifier
  }, [currentModifierIndex])

  /**   * Handle landing on Mafia action tile
   * @param {number} playerId - ID of the player
   */


  const handleMafiaTile = useCallback((playerId) => {
    updatePlayerStatus(playerId, { mafiaStatus: true })
  }, [updatePlayerStatus])

  /**
   * Handle landing on Income Tax action tile
   * @param {number} playerId - ID of the player
   */
  const handleIncomeTaxTile = useCallback((playerId) => {
    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.id === playerId) {
          const incomeTaxConfig = ACTION_TILES.incomeTax
          
          // Calculate total perLap income from all cards
          let totalPerLapIncome = (player.properties || []).reduce((sum, prop) => {
            return sum + (prop.perLap || 0)
          }, 0)
          
          if (player.mafiaStatus) {
            totalPerLapIncome = totalPerLapIncome * (1 - ACTION_TILES.mafia.incomeReduction)
          }
          
          const taxAmount = totalPerLapIncome * incomeTaxConfig.taxPercent
          
          // Only tax if has income
          if (taxAmount > 0) {
            const message = player.mafiaStatus 
              ? `Income Tax 30% of Mafia-reduced Lap Income`
              : `Income Tax 30% of Total Lap Income`
            
            triggerMoneyAnimation(playerId, -taxAmount, message)
            
            return {
              ...player,
              money: roundMoneyUp(player.money - taxAmount)
            }
          }
          
          return player
        }
        return player
      })
    })
  }, [triggerMoneyAnimation])

  /**
   * Handle landing on Bingo tile - opens popup with dice roll
   * @param {number} playerId - ID of the player
   */
  const handleBingoTile = useCallback((playerId) => {
    setPopupState(prev => ({ ...prev, bingo: playerId }))
  }, [])

  /**
   * Close any popup by type
   * @param {string} popupType - Type of popup to close ('bingo', 'casino', 'duel')
   */
  const closePopup = useCallback((popupType) => {
    setPopupState(prev => ({ ...prev, [popupType]: null }))
  }, [])

  // Legacy aliases for backward compatibility
  const handleCloseBingoPopup = useCallback(() => closePopup('bingo'), [closePopup])
  const handleCloseCasinoPopup = useCallback(() => closePopup('casino'), [closePopup])
  const handleCloseDuelPopup = useCallback(() => closePopup('duel'), [closePopup])

  /**
   * Handle Bingo outcome: Forced sale at 50% of purchase price (dice roll 2-3)
   * @param {number} percentage - Sale percentage (0.5 for 50%)
   */
  const handleBingoForcedSale = useCallback((percentage) => {
    const playerId = popupState.bingo
    if (!playerId) return
    const player = players.find(p => p.id === playerId)
    if (!player?.properties?.length) {
      setPopupState(prev => ({ ...prev, bingo: null }))
      return
    }
    setPopupState(prev => ({ ...prev, bingo: null }))
    setForcedSaleMode({ playerId, percentage, reason: `Bingo Forced Sale (${Math.round(percentage * 100)}%)` })
  }, [popupState.bingo, players])

  /**
   * Handle Bingo outcome: Casino bet (dice roll 4-5)
   * Opens casino interface with minimum $1000 bet
   */
  const handleBingoCasino = useCallback(() => {
    changePopup('bingo', 'casino')
  }, [])

  /**
   * Handle Bingo outcome: 2:1 Dice Duel (dice roll 6-7)
   * Player chooses opponent, both roll, loser pays difference × $1000
   */
  const handleBingoDuel = useCallback(() => {
    changePopup('bingo', 'duel')
  }, [])

  /**
   * Transition from one popup to another
   * @param {string} fromPopup - Popup to close
   * @param {string} toPopup - Popup to open
   */
  const changePopup = useCallback((fromPopup, toPopup) => {
    setPopupState(prev => {
      const playerId = prev[fromPopup]
      return playerId ? { ...prev, [fromPopup]: null, [toPopup]: playerId } : prev
    })
  }, [])

  /**
   * Handle Bingo outcome: 50% discount on any card purchase (dice roll 8-9)
   * @param {number} discount - Discount percentage (0.5 for 50%)
   */
  const handleBingoDiscountPurchase = useCallback((discount) => {
    const playerId = popupState.bingo
    if (!playerId) return
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, p => ({ ...p, bingoDiscount: discount })))
    setFreePick({ playerId, tile: null })
    setPopupState(prev => ({ ...prev, bingo: null }))
  }, [popupState.bingo])

  /**
   * Handle Bingo outcome: Collect percentage from all other players (dice roll 10-11)
   * @param {number} percentage - Collection percentage (0.1 for 10%)
   */
  const handleBingoCollectFromAll = useCallback((percentage) => {
    const playerId = popupState.bingo
    if (!playerId) return
    let totalCollected = 0
    setPlayers(prevPlayers => prevPlayers.map(player => {
      if (player.id === playerId) return player
      const amountToTake = roundMoneyUp(player.money * percentage)
      totalCollected += amountToTake
      triggerMoneyAnimation(player.id, -amountToTake, `Bingo Tax (${Math.round(percentage * 100)}%)`)
      return updatePlayerMoney(player, -amountToTake)
    }))
    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
      triggerMoneyAnimation(playerId, totalCollected, 'Bingo Collection')
      return updatePlayerMoney(player, totalCollected)
    }))
    setPopupState(prev => ({ ...prev, bingo: null }))
  }, [popupState.bingo, triggerMoneyAnimation])

  /**
   * Handle Bingo outcome: Forced double sale at 200% (dice roll 12)
   * @param {number} multiplier - Sale multiplier (2 for 200%)
   */
  const handleBingoDoubleSale = useCallback((multiplier) => {
    const playerId = popupState.bingo
    if (!playerId) return
    const player = players.find(p => p.id === playerId)
    if (!player?.properties?.length) {
      setPopupState(prev => ({ ...prev, bingo: null }))
      return
    }
    setPopupState(prev => ({ ...prev, bingo: null }))
    setForcedSaleMode({ playerId, percentage: multiplier, reason: `Bingo Lucky Sale (${Math.round(multiplier * 100)}%)` })
  }, [popupState.bingo, players])

  /**
   * Handle casino bet result from CasinoPopup
   * @param {number} betAmount - Amount bet
   * @param {number} rollValue - Dice roll result
   * @param {boolean} won - Whether player won
   */
  const handleCasinoBet = useCallback((betAmount, rollValue, won) => {
    const playerId = popupState.casino
    if (!playerId) return
    const amount = won ? roundMoneyUp(betAmount) : -betAmount

    const msg = won ? `Casino Win! (Rolled ${rollValue})` : `Casino Loss (Rolled ${rollValue})`

    setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
      triggerMoneyAnimation(playerId, amount, msg)
      return updatePlayerMoney(player, amount)
    }))

    setPopupState(prev => ({ ...prev, casino: null }))

  }, [popupState.casino, triggerMoneyAnimation])

  /**
   * Handle duel completion with rolls
   * @param {number} initiatorId - ID of the initiator
   * @param {number} opponentId - ID of the opponent
   * @param {number} initiatorRoll - Initiator's dice total (2 dice)
   * @param {number} opponentRoll - Opponent's dice roll (1 die)
   */
  const handleDuelComplete = useCallback((initiatorId, opponentId, initiatorRoll, opponentRoll) => {
    if (initiatorRoll === opponentRoll) {
      setPopupState(prev => ({ ...prev, duel: null }))
      return
    }
    const payment = roundMoneyUp(Math.abs(initiatorRoll - opponentRoll) * 1000)
    const winnerId = initiatorRoll > opponentRoll ? initiatorId : opponentId
    const loserId = winnerId === initiatorId ? opponentId : initiatorId
    const winnerRoll = winnerId === initiatorId ? initiatorRoll : opponentRoll
    const loserRoll = winnerId === initiatorId ? opponentRoll : initiatorRoll
    
    setPlayers(prevPlayers => updatePlayer(prevPlayers, loserId, player => {
      triggerMoneyAnimation(loserId, -payment, `Duel Lost: ${loserRoll} vs ${winnerRoll}`)
      return updatePlayerMoney(player, -payment)
    }))
    setPlayers(prevPlayers => updatePlayer(prevPlayers, winnerId, player => {
      triggerMoneyAnimation(winnerId, payment, `Duel Won: ${winnerRoll} vs ${loserRoll}`)
      return updatePlayerMoney(player, payment)
    }))
    setPopupState(prev => ({ ...prev, duel: null }))
  }, [triggerMoneyAnimation])

  /**
   * Handle forced sale property selection
   * @param {number} playerId - ID of the player
   * @param {Object} property - Property to sell
   */
  const handleForcedSale = useCallback((playerId, property) => {
    if (!forcedSaleMode || forcedSaleMode.playerId !== playerId) return

    const purchasePrice = property.actualPurchasePrice || property.price || 0
    const salePrice = roundMoneyUp(purchasePrice * forcedSaleMode.percentage)

    console.log(`Forced sale: ${property.name} for $${salePrice}`)

    // Sell the property first
    handleSellProperty(playerId, property, salePrice, false)
    
    // Deduct the loan payment amount from the sale proceeds
    if (forcedSaleMode.requiredAmount) {
      const amountToDeduct = Math.min(salePrice, forcedSaleMode.requiredAmount)
      const netProceeds = salePrice - amountToDeduct
      
      console.log(`Deducting $${amountToDeduct} from sale proceeds for loan payment. Net: $${netProceeds}`)
      
      setPlayers(prevPlayers => updatePlayer(prevPlayers, playerId, player => {
        return updatePlayerMoney(player, -amountToDeduct)
      }))
      
      triggerMoneyAnimation(playerId, -amountToDeduct, 'Loan Payment from Sale')
      
      // Update required amount or clear forced sale mode
      const remainingAmount = forcedSaleMode.requiredAmount - amountToDeduct
      if (remainingAmount <= 0) {
        console.log('Forced sale requirement fulfilled')
        setForcedSaleMode(null)
      } else {
        console.log(`Still need to raise $${remainingAmount}`)
        setForcedSaleMode(prev => ({
          ...prev,
          requiredAmount: remainingAmount
        }))
      }
    } else {
      // No required amount, just clear forced sale mode
      setForcedSaleMode(null)
    }
  }, [forcedSaleMode, handleSellProperty, triggerMoneyAnimation])

  /**
   * DEBUG: Move current player directly to a specific tile ID (for testing)
   * @param {number} tileId - The tile ID to move to
   */
  const moveToTile = useCallback((tileId) => {
    if (gameState !== GAME_STATES.PLAYING || players.length === 0) {
      console.warn('Game must be in PLAYING state to use moveToTile')
      return
    }

    const currentPlayer = players[currentPlayerIndex]
    const tile = TILE_POSITIONS.find(t => t.id === tileId)
    
    if (!tile) {
      console.error(`Tile with ID ${tileId} not found`)
      return
    }

    // find the position in MOVEMENT_SEQUENCE for this tile ID
    const newPosition = MOVEMENT_SEQUENCE.indexOf(tileId)
    
    if (newPosition === -1) {
      console.error(`Tile ID ${tileId} not found in movement sequence`)
      return
    }

    const oldPosition = currentPlayer.position
    
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers]
      const updatedPlayer = {
        ...currentPlayer,
        position: newPosition
      }
      updatedPlayers[currentPlayerIndex] = updatedPlayer
      
      setTimeout(() => {
        checkStartCrossing(oldPosition, newPosition, updatedPlayer, handleLoanRepayment, handlePropertyIncome, globalModifier)
        
        checkTileDrawPool(
          tileId,
          updatedPlayer,
          TILE_POSITIONS, 
          updatedPlayers, 
          awardProperty
        )
        
        // check for action tiles
        checkActionTile(tileId, updatedPlayer)
      }, 100)
      
      return updatedPlayers
    })

  }, [gameState, players, currentPlayerIndex, awardProperty, handleLoanRepayment, handlePropertyIncome, checkActionTile])

  return {
    // State
    gameState,
    playerCount,
    players,
    currentPlayerIndex,
    pendingProperty,
    showPropertyPopup,
    isInFreePickMode: !!freePick.playerId,
    freePickPlayerId: freePick.playerId,
    selectedFreePickTile: freePick.tile,
    moneyChanges,
    globalModifier,
    currentModifierIndex,
    activeEvents,
    showBingoPopup: !!popupState.bingo,
    bingoPlayerId: popupState.bingo,
    showCasinoPopup: !!popupState.casino,
    casinoPlayerId: popupState.casino,
    showDuelPopup: !!popupState.duel,
    duelInitiatorId: popupState.duel,
    forcedSaleMode,
    
    // Actions
    updatePlayerStatus,
    changePopup,
    initializePlayers,
    startGame,
    resetGame,
    moveCurrentPlayer,
    movePlayerToPosition,
    moveToTile,
    nextPlayerTurn,
    updatePlayerCount,
    checkWinCondition,
    awardMoney,
    awardProperty,
    clearMoneyAnimations,
    handleBuyProperty,
    handleSellProperty,
    handlePassProperty,
    freePickAction,
    handleFreePickTileClick,
    executeFreePick,
    exitFreePickMode,
    takeLoan,
    makeManualLoanPayment,
    drawNewModifier,
    handleJailEscapeAttempt,
    handleEventDraw,
    decreaseJailTurns,
    activateChanceMultiplier,
    clearChanceMultiplier,
    handleMafiaTile,
    handleIncomeTaxTile,
    handleTaxPayment,
    closePopup,
    handleCloseBingoPopup,
    handleCloseCasinoPopup,
    handleCloseDuelPopup,
    handleBingoForcedSale,
    handleBingoCasino,
    handleBingoDuel,
    handleBingoDiscountPurchase,
    handleBingoCollectFromAll,
    handleBingoDoubleSale,
    handleCasinoBet,
    handleDuelComplete,
    handleForcedSale,
    
    // Getters
    getCurrentPlayer,
    getPlayerPositions,
    isGameState,
    getDiceRoll,
    
    // Computed values
    currentPlayer: getCurrentPlayer(),
    isSetup: gameState === GAME_STATES.SETUP,
    isPlaying: gameState === GAME_STATES.PLAYING,
    isFinished: gameState === GAME_STATES.FINISHED,
    
    // Debug functions
    setNextDiceRoll: setNextDiceRollDebug,
    setPlayerMoney: setPlayerMoneyDebug
  }
}

export default useGame