import { MOVEMENT_SEQUENCE, TILE_POSITIONS } from '../data/tilePositions'
import { GAME_CONFIG } from '../data/gameConfig'
import { PROPERTY_DRAWPOOL, ACTION_TILES, LOAN_OPTIONS} from '../data/gameConfig'

export const getPlayerPosition = (player, allPlayers) => {
  const tileId = MOVEMENT_SEQUENCE[player.position]
  const tile = TILE_POSITIONS.find(t => t.id === tileId)
  if (!tile) return { left: 0, top: 0 }
  
  // offset players on same tile
  const playersOnSameTile = allPlayers.filter(p => MOVEMENT_SEQUENCE[p.position] === tileId)
  const playerOffset = playersOnSameTile.indexOf(player)
  const offsetX = (playerOffset % 2) * 12 - 6
  const offsetY = Math.floor(playerOffset / 2) * 12 - 6
  
  const tileCenter = GAME_CONFIG.TILE_SIZE / 2
  
  return {
    left: tile.x + tileCenter + offsetX,
    top: tile.y + tileCenter + offsetY
  }
}

export const movePlayerPosition = (currentPosition, steps) => {
  return (currentPosition + steps) % MOVEMENT_SEQUENCE.length
}

export const getTileLabel = (position) => {
  return MOVEMENT_SEQUENCE[position] === 0 ? 'START' : MOVEMENT_SEQUENCE[position]
}

export const roundMoneyUp = (amount) => {
  return Math.ceil(amount / 100) * 100
}

// Target a specific player for update type
export const updatePlayer = (players, playerId, updateFn) => {
  //players is array of all players, usually prevPlayers
  //playerId is target
  //updateFn is the fn that applies update to player
  return players.map(player => {
    if (player.id === playerId) {
      return updateFn(player)
    }
    return player
  })
}
// update type
export const updatePlayerMoney = (player, amount) => {
  return {
    ...player,
    money: Math.max(0, roundMoneyUp(player.money + amount))
  }
}
// update type
export const updatePlayerProps = (player, updates) => {
  return {
    ...player,
    ...updates
  }
}

export const rollDie = (sides = 6) => {
  const randomIndex = getRandomInt(sides)
  return randomIndex + 1
}

export const isStartTile = (tileId) => {
  return tileId === 0
}

export const getTileById = (tileId) => {
  return TILE_POSITIONS.find(tile => tile.id === tileId) || null
}

export const getRandomInt = (max) => {
  return Math.floor(Math.random() * max)
}
export const getRandomPropertyFromDrawPool = (drawPoolType, ownedProperties = []) => {
  const availableProperties = PROPERTY_DRAWPOOL[drawPoolType]?.filter(
    property => !ownedProperties.includes(property.id)
  ) || []
  
  if (availableProperties.length === 0) {
    console.warn(`No ${drawPoolType} properties available`)
    return null
  }

  const randomIndex = getRandomInt(availableProperties.length)
  const selectedProperty = availableProperties[randomIndex]
  console.log(`Drew ${selectedProperty.name} from ${drawPoolType}`)
  return selectedProperty
}

// actually award a random property
export const awardPropertyFromDrawPool = (drawPoolType, player, allPlayers) => {
  const allOwnedProperties = allPlayers.flatMap(p => p.properties?.map(prop => prop.id) || [])
  

  const property = getRandomPropertyFromDrawPool(drawPoolType, allOwnedProperties)
  
  if (property) {
    return property
  } else {
    return null
  }
}

export const checkTileDrawPool = (tileId, player, tilePositions, allPlayers, onPropertyAwarded) => {
  const tile = tilePositions.find(t => t.id === tileId)
  
  if (tile && tile.drawPool) {
    const awardedProperty = awardPropertyFromDrawPool(tile.drawPool, player, allPlayers)

    if (awardedProperty && onPropertyAwarded) {
      console.log(`${player.name} landed on ${tile.label}`)
      onPropertyAwarded(player.id, awardedProperty)
    } else if (!awardedProperty) {
      console.warn(`No ${tile.drawPool} properties left`)
    }

    return tile.drawPool
  }
  
  return null
}

export const takeLoan = (player, loanAmount) => {
  const loanOption = LOAN_OPTIONS.find(option => option.borrowed === loanAmount)
  if (!loanOption) return null

  const loan = {
    id: `loan_${Date.now()}_${player.id}`,
    borrowed: loanOption.borrowed,
    totalRepaid: loanOption.totalRepaid,
    remaining: loanOption.totalRepaid,
    lapsRemaining: loanOption.laps,
    perLap: loanOption.perLap
  }

  
  return loan
}

export const processLoanRepayment = (player, totalAvailableFunds, bailoutAmount = 0) => {
  if (!player.loans || player.loans.length === 0) {
    return { totalPaid: 0, loansCompleted: [], updatedLoans: [], bailoutUsed: 0 }
  }

  let remainingFunds = totalAvailableFunds
  let remainingBailout = bailoutAmount
  const loansCompleted = []
  const updatedLoans = []

  player.loans.forEach(loan => {
    if (loan.lapsRemaining > 0) {
      // Try to pay from available funds first
      const fromFunds = Math.min(loan.perLap, remainingFunds)
      remainingFunds -= fromFunds
      
      // Pay the rest from bailout if needed
      const shortfall = loan.perLap - fromFunds
      const fromBailout = Math.min(shortfall, remainingBailout)
      remainingBailout -= fromBailout
      
      const totalPayment = fromFunds + fromBailout
      const newRemaining = loan.remaining - totalPayment
      const newLapsRemaining = loan.lapsRemaining - 1

      if (newRemaining <= 0 || newLapsRemaining <= 0) {
        loansCompleted.push(loan.id)
      } else {
        updatedLoans.push({
          ...loan,
          remaining: newRemaining,
          lapsRemaining: newLapsRemaining
        })
      }
    }
  })

  return {
    totalPaid: totalAvailableFunds - remainingFunds,
    loansCompleted,
    updatedLoans,
    bailoutUsed: bailoutAmount - remainingBailout
  }
}

export const calculatePropertyIncome = (player) => {
  if (!player.properties || player.properties.length === 0) {
    return { totalIncome: 0, incomeProperties: [] }
  }

  let totalIncome = 0
  const incomeProperties = []

  player.properties.forEach(property => {
    if (property.perLap && property.perLap > 0) {
      totalIncome += property.perLap
      incomeProperties.push({
        name: property.name,
        income: property.perLap
      })
    }
  })


  return {
    totalIncome,
    incomeProperties
  }
}

export const checkStartCrossing = (oldPosition, newPosition, player, onLoanRepayment, onPropertyIncome, globalModifier = null) => {
  const TOTAL_POSITIONS = MOVEMENT_SEQUENCE.length;
  const didCrossStart = (oldPosition > newPosition) || 
                        (newPosition === 0 && oldPosition !== 0) ||
                        (oldPosition < TOTAL_POSITIONS && newPosition >= TOTAL_POSITIONS)
  

  if (didCrossStart) {

    const newLapCount = (player.lapCount || 0) + 1
    
    // Decrement lapsToSell for risk cards and remove expired ones
    const updatedProperties = (player.properties || []).filter(property => {
      if (property.type === 'Risk' && property.lapsToSell && property.lapsRemaining !== undefined) {
        const newLapsRemaining = property.lapsRemaining - 1
        if (newLapsRemaining <= 0) {
          console.log(`Risk card ${property.name} expired and was removed`)
          return false
        }
        property.lapsRemaining = newLapsRemaining
      }
      return true
    })
    
    // Calculate income first (accounting for mafia)
    let totalIncome = updatedProperties.reduce((sum, property) => {
      return sum + (property.perLap || 0)
    }, 0) || 0

    let incomeMessage = 'Lap income'
    let shouldClearMafia = false
  
    if (player.mafiaStatus && totalIncome > 0) {
      totalIncome = Math.floor(totalIncome * (1 - ACTION_TILES.mafia.incomeReduction))
      incomeMessage = `Lap income 50% less due to Mafia`
      shouldClearMafia = true
    }

    // Apply income first
    if (onPropertyIncome) {
      onPropertyIncome(player.id, totalIncome, incomeMessage, newLapCount, updatedProperties)
    }

    if (player.loans && player.loans.length > 0) {
      // Calculate total required payment (sum of all installments)
      const totalRequired = player.loans.reduce((sum, loan) => {
        return sum + (loan.lapsRemaining > 0 ? loan.perLap : 0)
      }, 0)
      
      // Calculate available funds (money + income)
      const availableFunds = player.money + totalIncome
      
      let bailoutInfo = null
      let repaymentResult = null
      
      if (availableFunds < totalRequired) {
        // Player can't afford full payment
        const shortage = totalRequired - availableFunds
        
        if (globalModifier) {
          bailoutInfo = calculateBailoutAmount(globalModifier, player, shortage)
          
          if (bailoutInfo.bailoutAmount >= shortage) {
            
            repaymentResult = processLoanRepayment(player, availableFunds, bailoutInfo.bailoutAmount)
          } else {
            
            const remainingShortage = shortage - bailoutInfo.bailoutAmount
            
            // Add forced sale requirement to bailoutInfo
            bailoutInfo.needsForcedSale = true
            bailoutInfo.forcedSaleAmount = remainingShortage
            bailoutInfo.forcedSaleReason = 'Must sell properties to cover loan payment shortage'
            
            
            repaymentResult = processLoanRepayment(player, availableFunds, bailoutInfo.bailoutAmount)
          }
        } else {
          // No bailout available - check if forced sale is needed
          const shortage = totalRequired - availableFunds
          if (shortage > 0 && player.properties && player.properties.length > 0) {
            bailoutInfo = {
              canUseBailout: false,
              bailoutAmount: 0,
              needsForcedSale: true,
              forcedSaleAmount: shortage,
              forcedSaleReason: 'Must sell properties to cover loan payment'
            }
            
            repaymentResult = processLoanRepayment(player, availableFunds, 0)
          } else {

            repaymentResult = processLoanRepayment(player, availableFunds, 0)
          }
        }
      } else {
        repaymentResult = processLoanRepayment(player, totalRequired, 0)
      }
      
      console.log(`Processing loan repayment: $${repaymentResult.totalPaid}, bailout: $${repaymentResult.bailoutUsed || 0}, remaining loans:`, repaymentResult.updatedLoans.length)
      
      if (onLoanRepayment) {
        onLoanRepayment(player.id, repaymentResult, bailoutInfo)
      }
    }
    
    return {
      ...player,
      lapCount: newLapCount,
      properties: updatedProperties,
      clearMafiaStatus: shouldClearMafia
    }
  }

  return player
}



export const calculateBorrowingLimit = (currentModifier, drawPoolType, purchasePrice) => {
  if (!currentModifier || !currentModifier.modifiers[drawPoolType]) {
    return {
      canBorrow: false,
      maxBorrowAmount: 0,
      limitPercentage: 0,
      reason: "No modifier or invalid drawpool type"
    }
  }

  const limitPercentage = currentModifier.modifiers[drawPoolType].limit
  const maxBorrowAmount = Math.floor(purchasePrice * (limitPercentage / 100))

  return {
    canBorrow: maxBorrowAmount > 0,
    maxBorrowAmount,
    limitPercentage,
    reason: currentModifier.modifiers[drawPoolType].description
  }
}

export const calculateBailoutAmount = (currentModifier, player, shortage) => {
  if (!currentModifier || !currentModifier.modifiers.bailout) {
    return {
      canUseBailout: false,
      bailoutAmount: 0,
      maxBailoutAmount: 0,
      reason: 'No bailout available'
    }
  }

  const maxBailoutAmount = currentModifier.modifiers.bailout.amount
  const bailoutAmount = Math.min(shortage, maxBailoutAmount)

  return {
    canUseBailout: bailoutAmount > 0,
    bailoutAmount,
    maxBailoutAmount,
    reason: currentModifier.modifiers.bailout.description,
    label: currentModifier.modifiers.bailout.label
  }
}


