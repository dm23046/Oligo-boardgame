import React from 'react'
import Board from '../components/Board'
import Dice from '../components/Dice'
import Controls from '../components/Controls'
import MoneyAnimation from '../components/MoneyAnimation'
import ModifierDisplay from '../components/ModifierDisplay'
import JailPopup from '../components/JailPopup'
import BingoPopup from '../components/BingoPopup'
import CasinoPopup from '../components/CasinoPopup'
import DuelPopup from '../components/DuelPopup'
import styles from './GamePlay.module.css'
import CardPopup from '../components/CardPopup'
import { TILE_POSITIONS, MOVEMENT_SEQUENCE } from '../data/tilePositions'
import { ACTION_TILES } from '../data/gameConfig'

const roundMoneyUp = (amount) => {
  return Math.ceil(amount / 100) * 100
}

const GamePlay = ({ 
  gameState,
  players,
  currentPlayer,
  dice,
  isRolling,
  rollResult,
  canEndTurn,
  onRollDice,
  onEndTurn,
  onResetGame,
  onTakeLoan,
  onRepayLoan,
  moneyChanges,
  globalModifier,
  activeEvents,
  onDrawNewModifier,
  pendingProperty,
  showPropertyPopup,
  isInFreePickMode,
  freePickPlayerId,
  selectedFreePickTile,
  onBuyProperty,
  onSellProperty,
  onPassProperty,
  onFreePickTileClick,
  onExecuteFreePick,
  onJailEscapeAttempt,
  onDecreaseJailTurns,
  onActivateChanceMultiplier,
  showBingoPopup,
  bingoPlayerId,
  onCloseBingoPopup,
  onBingoForcedSale,
  onBingoCasino,
  onBingoDuel,
  onBingoDiscountPurchase,
  onBingoCollectFromAll,
  onBingoDoubleSale,
  showCasinoPopup,
  casinoPlayerId,
  onCasinoBet,
  onCloseCasinoPopup,
  showDuelPopup,
  duelInitiatorId,
  onDuelComplete,
  onCloseDuelPopup,
  forcedSaleMode,
  onForcedSale,
  getDiceRoll,
}) => {
  const getGameStatusMessage = () => {
    if (gameState === 'finished') {
      const winner = players.find(player => player.hasWon)
      return winner ? `${winner.name} Wins!` : 'Game Complete!'
    }
    if (currentPlayer) {
      return `${currentPlayer.name}'s Turn`
    }
    return 'Game in Progress'
  }
  
  const getGameStatusClass = () => {
    switch (gameState) {
      case 'finished': return styles.finished
      default: return styles.playing
    }
  }
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameLayout}>
        {/* Side pnel for game info */}
        <div className={styles.sidePanel}>
          <div className={styles.gameInfo}>
            <div className={styles.statusSection}>
              <h1 className={`${styles.statusTitle} ${getGameStatusClass()}`}>
                {getGameStatusMessage()}
              </h1>
              {gameState === 'playing' && currentPlayer && (
                <div className={styles.turnIndicator}>
                  <div 
                    className={styles.turnDot}
                    style={{ backgroundColor: `var(--player-${currentPlayer.colorIndex}-color)` }}
                  ></div>
                  <span className={styles.turnText}>Roll the dice to move!</span>
                </div>
              )}
            </div>
            
            {/* Player list */}
            <div className={styles.playersSection}>
              <h3 className={styles.playersTitle}>Players</h3>
              <div className={styles.playersList}>
                {players.map((player) => (
                  <div 
                    key={player.id}
                    data-player-id={player.id}
                    className={`${styles.playerItem} ${player.isActive ? styles.activePlayer : ''} ${player.jailStatus?.isInJail ? styles.jailedPlayer : ''}`}
                  >
                    <div 
                      className={styles.playerColor}
                      style={{ backgroundColor: `var(--player-${player.colorIndex}-color)` }}
                    ></div>
                    <span className={styles.playerName}>
                      {player.name}
                      {player.jailStatus?.isInJail && <span className={styles.jailIcon}> 🚓</span>}
                      {player.mafiaStatus && <span className={styles.mafiaIcon}> 🕵️‍♂️</span>}
                      {player.activeChanceMultiplier && <span className={styles.chanceIcon} title={`Active: +${player.activeChanceMultiplier.multiplier * 100}% for ${player.activeChanceMultiplier.affected}`}> ⚡</span>}
                    </span>
                    <span className={styles.playerPosition}>
                      ${player.money}
                      {player.jailStatus?.isInJail && (
                        <span className={styles.jailTurns}> ({player.jailStatus.turnsRemaining})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Game controls */}
            <div className={styles.controlsSection}>
              <Controls 
                gameState={gameState}
                players={players}
                currentPlayer={currentPlayer}
                onResetGame={onResetGame}
                gameInProgress={true}
                onTakeLoan={onTakeLoan}
                onRepayLoan={onRepayLoan}
                pendingProperty={pendingProperty}
                globalModifier={globalModifier}
                onSellProperty={onSellProperty}
                onActivateChanceMultiplier={onActivateChanceMultiplier}
                forcedSaleMode={forcedSaleMode}
                onForcedSale={onForcedSale}
              />
            </div>
          </div>
        </div>
        
        {/* Main board */}
        <div className={styles.boardArea}>
          <div className={styles.gameBoard}>
            <Board 
              players={players} 
              isInFreePickMode={isInFreePickMode}
              selectedFreePickTile={selectedFreePickTile}
              onTileClick={isInFreePickMode ? onFreePickTileClick : undefined}
              onPickClick={onExecuteFreePick}
            />
            {/* Center dice container */}
            <div className={styles.diceContainer}>
              <Dice 
                dice={dice}
                isRolling={isRolling}
                onRoll={onRollDice}
                disabled={gameState !== 'playing' || !currentPlayer || canEndTurn || (currentPlayer?.jailStatus?.isInJail && !currentPlayer?.jailStatus?.justEntered)}
                rollResult={rollResult}
              />
              
              {/* End turn btn*/}
              {(canEndTurn || currentPlayer?.jailStatus?.isInJail) && (() => {
                let hasMandatoryLeisure = false
                if (pendingProperty && pendingProperty.property) {
                  const property = pendingProperty.property
                  const isLeisure = property.type === 'Leisure'
                  const isTrophy = property.trophy
                  
                  if (isLeisure && !isTrophy) {
                    // check if it's perWorkplace with 0 manufacturing (can be skipped)
                    if (property.perWorkplace) {
                      const player = players.find(p => p.id === pendingProperty.playerId)
                      const manufacturingCount = (player?.properties || []).filter(
                        prop => prop.type === 'Manufacturing'
                      ).length
                      hasMandatoryLeisure = manufacturingCount > 0
                    } else {
                      hasMandatoryLeisure = true
                    }
                  }
                }
                
                const isInForcedSaleMode = forcedSaleMode && forcedSaleMode.playerId === currentPlayer?.id
                const isDisabled = gameState !== 'playing' || hasMandatoryLeisure || isInForcedSaleMode
                
                return (
                  <button 
                    className={styles.endTurnButton}
                    onClick={onEndTurn}
                    disabled={isDisabled}
                    title={
                      hasMandatoryLeisure 
                        ? 'Must purchase mandatory leisure card first!' 
                        : isInForcedSaleMode
                        ? `Must sell properties worth $${forcedSaleMode.requiredAmount} to cover loan payment!`
                        : 'End your turn'
                    }
                  >
                    End Turn
                  </button>
                )
              })()}
            </div>
            {/* Property purchase popup */}
            {showPropertyPopup && pendingProperty && currentPlayer && (
              <CardPopup
                property={pendingProperty?.property}
                player={players.find(p => p.id === pendingProperty?.playerId)}
                activeEvents={activeEvents}
                onBuy={onBuyProperty}
                onPass={onPassProperty}
                isVisible={showPropertyPopup}
              /> 
            )}  
            
            {/* FreePick mode indicator */}
            {isInFreePickMode && freePickPlayerId && (
              <div className={styles.freePickIndicator}>
                <div className={styles.freePickMessage}>
                  <h3>Free Pick Mode!</h3>
                  <p>
                    {selectedFreePickTile 
                      ? `${players.find(p => p.id === freePickPlayerId)?.name || 'Player'}, click the PICK button to draw from ${selectedFreePickTile.drawPool} cards!`
                      : `${players.find(p => p.id === freePickPlayerId)?.name || 'Player'}, click on any tile with cards to select it for picking!`
                    }
                  </p>
                </div>
              </div>
            )}  
          </div>
        </div>
        {/* Property panel */}
        <div className={styles.propertyPanel}>
          <div className={styles.propertyInfo}>
            <div className={styles.propertiesSection}>
              <h3 className={styles.propertyTitle}>Cards Owned</h3>
              <div className={styles.propertyList}>
                {/* has cards*/}
                {currentPlayer?.properties?.length > 0 ? (
                  currentPlayer.properties.map(property => {
                    const isInForcedSaleMode = forcedSaleMode && forcedSaleMode.playerId === currentPlayer.id
                    
                    const currentTile = TILE_POSITIONS.find(tile => tile.id === MOVEMENT_SEQUENCE[currentPlayer.position])
                    const isOnPropertyTile = currentTile && currentTile.drawPool === 'property'
                    const isOnBetsTile = currentTile && currentTile.drawPool === 'bets'
                    const isOnManufacturingTile = currentTile && currentTile.drawPool === 'manufacturing'
                    const isOnMarket = currentTile && currentTile.actionTile && currentTile.actionTile.id === 'market'
                    
                    const hasMandatoryLeisure = pendingProperty && 
                      pendingProperty.property?.type === 'Leisure' && 
                      !pendingProperty.property?.trophy &&
                      currentPlayer.money < (pendingProperty.property?.actualPurchasePrice || pendingProperty.property?.price)
                    
                    //if player can sell this property on current tile
                    let canSellOnThisTile = false
                    let salePrice = property.sale
                    let isEmergencySale = false
                    
                    // Check if this property was just purchased (cannot sell on same tile)
                    const isJustPurchased = currentPlayer.justPurchasedPropertyId === property.id
                    
                    // if in forced sale mode can always sell any property
                    if (isInForcedSaleMode) {
                      canSellOnThisTile = true
                      const purchasePrice = property.actualPurchasePrice || property.price || 0
                      salePrice = roundMoneyUp(purchasePrice * forcedSaleMode.percentage)
                    } else {
                      // Helper to set emergency sale (50% off)
                      const setEmergencySale = () => {
                        canSellOnThisTile = true
                        isEmergencySale = true
                        salePrice = roundMoneyUp((property.actualPurchasePrice || property.price) * 0.5)
                      }
                      
                      // Helper to set market sale (10% above buy price)
                      const setMarketSale = () => {
                        canSellOnThisTile = true
                        salePrice = roundMoneyUp((property.actualPurchasePrice || property.price) * 1.1)
                      }
    
                      // Helper to set specific tile sale (at sale price)
                      const setSpecificTileSale = () => {
                        canSellOnThisTile = true
                        salePrice = property.sale
                      }
                      
                      switch (property.type) {
                        case 'Leisure':
                          if (isOnMarket) {
                            canSellOnThisTile = true
                            salePrice = property.actualPurchasePrice || property.price
                          }
                          break
                          
                        case 'Property':
                          if (isOnPropertyTile) setSpecificTileSale()
                          else if (isOnMarket) setMarketSale()
                          else if (hasMandatoryLeisure) setEmergencySale()
                          break
                          
                        case 'Bets':
                        case 'Manufacturing':
                          const onMatchingTile = (property.type === 'Bets' && isOnBetsTile) || 
                                                 (property.type === 'Manufacturing' && isOnManufacturingTile)
                          if (onMatchingTile) setSpecificTileSale()
                          else if (isOnMarket) setMarketSale()
                          else if (hasMandatoryLeisure) setEmergencySale()
                          break
                          
                        case 'Risk':
                          if (isOnMarket) {
                            canSellOnThisTile = true
                            salePrice = property.sale || (property.actualPurchasePrice || property.price)
                          } else if (hasMandatoryLeisure) {
                            setEmergencySale()
                          }
                          break
                          
                        case 'Chance':
                          if (property.sale && isOnMarket) setSpecificTileSale()
                          break
                      }
                    }
                    
                    //if is a chance card with multiplier
                    const isChanceMultiplier = property.type === 'Chance' && property.multiplier
                    const canActivateChance = isChanceMultiplier && currentPlayer.properties?.some(p => p.name === property.affected || p.type === property.affected)
                    
                    // Apply all sale price modifiers
                    let displaySalePrice = salePrice
                    
                    // Check for event boosts (Stock or Raw Materials)
                    if (property.type === 'Bets' && activeEvents) {
                      const boostEvent = activeEvents.find(event => 
                        (event.effect?.type === 'stockBoost' && property.name === 'Stock') ||
                        (event.effect?.type === 'rawBoost' && property.name === 'Raw Materials')
                      )
                      if (boostEvent) {
                        displaySalePrice = roundMoneyUp(salePrice * boostEvent.effect.multiplier)
                      }
                    }

                    // Apply active chance multiplier
                    if (currentPlayer.activeChanceMultiplier?.affected === property.name || currentPlayer.activeChanceMultiplier?.affected === property.type) {
                      displaySalePrice = roundMoneyUp(displaySalePrice * (1 + currentPlayer.activeChanceMultiplier.multiplier))
                    }
                    
                    // Update actual sale price
                    if (displaySalePrice !== salePrice) {
                      salePrice = displaySalePrice
                    }
                    
                    return (
                      <div key={property.id} className={styles.propertyItem}>
                        <span className={styles.propertyName} style={{color: property.color}}>{property.name}</span>
                        <span className={styles.propertyType}>{property.type}</span>
                        <span className={styles.propertyDescription}>{property.description}</span>
                        <div className={styles.propertyPrices}>
                          <span className={styles.propertyValue}>B ${property.price}</span>
                          <span className={styles.propertySale}>S ${property.sale}</span>
                          {property.perLap && <span className={styles.propertyPerLap}>L${property.perLap}</span>}
                        </div>
                        <div className={styles.propertyActions}>
                          <span className={styles.propertyOwner}>Owner: {currentPlayer.name}</span>
                          {property.type === 'Leisure' && property.trophy && (
                            <span className={styles.trophyBadge} title="Trophy leisure item">🏆</span>
                          )}
                          {property.type === 'Risk' && property.lapsToSell && property.lapsRemaining !== undefined && (
                            <span className={styles.lapsRemainingBadge} title={`Must sell within ${property.lapsRemaining} lap${property.lapsRemaining !== 1 ? 's' : ''}`}>
                              {property.lapsRemaining} lap{property.lapsRemaining !== 1 ? 's' : ''}
                            </span>
                          )}
                          
                          {/* Chance card multiplier - Activate button */}
                          {isChanceMultiplier && (
                            <button 
                              className={`${styles.activateButton} ${!canActivateChance ? styles.disabled : ''}`}
                              onClick={() => canActivateChance && onActivateChanceMultiplier && onActivateChanceMultiplier(currentPlayer.id, property)}
                              disabled={!canActivateChance}
                              title={
                                canActivateChance
                                  ? `Activate +${property.multiplier * 100}% bonus for selling ${property.affected} cards this turn`
                                  : `You need ${property.affected} cards to activate this bonus`
                              }
                            >
                              ⚡ Activate
                            </button>
                          )}
                          
                          {/* Sell button - only for cards with sale price or sellable on market */}
                          {(!isChanceMultiplier || property.sale) && (
                            <button 
                              className={`${styles.sellButton} ${(!canSellOnThisTile || isJustPurchased) ? styles.disabled : ''} ${isInForcedSaleMode ? styles.forcedSale : ''}`}
                              onClick={() => {
                                if (canSellOnThisTile && !isJustPurchased) {
                                  if (isInForcedSaleMode && onForcedSale) {
                                    onForcedSale(currentPlayer.id, property)
                                  } else if (onSellProperty) {
                                    onSellProperty(currentPlayer.id, property, salePrice, isOnMarket)
                                  }
                                }
                              }}
                              disabled={!canSellOnThisTile || isJustPurchased}
                              title={
                                isJustPurchased
                                  ? 'Cannot sell a property on the same tile where it was just purchased - move first!'
                                  : isInForcedSaleMode
                                  ? `${forcedSaleMode.reason} - Sell for $${salePrice} (${Math.round(forcedSaleMode.percentage * 100)}%)`
                                  : canSellOnThisTile 
                                    ? isEmergencySale
                                    ? `🚨 EMERGENCY SALE: Sell for $${salePrice} (50% off) - You need funds to purchase the mandatory leisure card!`
                                    : property.type === 'Leisure'
                                      ? `Sell for $${displaySalePrice} (purchase price)`
                                      : property.type === 'Property' && isOnMarket
                                        ? `Sell for $${displaySalePrice} (10% above buy price)`
                                        : property.type === 'Bets' && isOnMarket
                                          ? `Sell for $${displaySalePrice} (10% above buy price)`
                                        : property.type === 'Manufacturing' && isOnMarket
                                          ? `Sell for $${displaySalePrice} (10% above buy price)`
                                        : property.type === 'Risk' && isOnMarket
                                          ? property.sale 
                                            ? `Sell for $${displaySalePrice} (sale price)`
                                            : `Sell for $${displaySalePrice} (purchase price)`
                                          : `Sell for $${displaySalePrice}`
                                  : property.type === 'Leisure'
                                    ? 'Must be on Market tile to sell leisure items'
                                    : property.type === 'Property' 
                                      ? 'Must be on Property tile or Market to sell'
                                      : property.type === 'Bets'
                                        ? 'Must be on Bets tile or Market to sell'
                                      : property.type === 'Manufacturing'
                                        ? 'Must be on Manufacturing tile or Market to sell'
                                        : property.type === 'Risk'
                                          ? 'Must be on Market to sell'
                                          : property.type === 'Chance'
                                            ? 'Must be on Market to sell Chance cards (only if they have sale price)'
                                            : `Must be on Market to sell ${property.type} cards`
                              }
                            >
                              {isInForcedSaleMode ? `⚠️ Forced Sell $${salePrice}` : `Sell $${salePrice}`}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className={styles.propertyItem}>
                    <span className={styles.propertyName}>No properties owned</span>
                  </div>
                )}
              </div>
            </div>

            {/* Global modifier and active events */}
            <ModifierDisplay 
              modifier={globalModifier}
              activeEvents={activeEvents}
              onDrawNewModifier={onDrawNewModifier}
            />

          </div>
        </div>
      </div>
      
      {gameState === 'finished' && (
        <div className={styles.gameOverlay}>
          <div className={styles.victoryCard}>
            <div className={styles.victoryHeader}>
              <span className={styles.trophyIcon}></span>
              <h2 className={styles.victoryTitle}>Game Complete!</h2>
            </div>
            
{(() => {
              const winner = players.find(player => player.hasWon)
              return winner ? (
                <div className={styles.winnerSection}>
                  <div 
                    className={styles.winnerDisplay}
                    style={{ 
                      backgroundColor: `var(--player-${winner.colorIndex}-color)`,
                      color: '#eeefde'
                    }}
                  >
                    <span className={styles.crownIcon}></span>
                    <span className={styles.winnerName}>{winner.name}</span>
                    <span className={styles.winnerTitle}>Champion!</span>
                  </div>
                  
                  <div className={styles.gameStats}>
                    <h3 className={styles.statsTitle}>Final Standings</h3>
                    <div className={styles.playerRankings}>
                      {players
                        .sort((a, b) => b.money - a.money)
                        .map((player, index) => (
                          <div 
                            key={player.id}
                            className={`${styles.playerRank} ${
                              player.hasWon ? styles.winner : ''
                            }`}
                          >
                            <span className={styles.rankNumber}>#{index + 1}</span>
                            <div 
                              className={styles.rankColor}
                              style={{ backgroundColor: `var(--player-${player.colorIndex}-color)` }}
                            ></div>
                            <span className={styles.rankName}>{player.name}</span>
                            <span className={styles.rankPosition}>${player.money}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <p className={styles.noWinnerText}>Great game everyone!</p>
              )
            })()}
          </div>
        </div>
      )}
      
      {/* Money Change Animations */}
      <MoneyAnimation moneyChanges={moneyChanges} />
      
      {/* Jail Popup - only show when player just entered jail this turn */}
      {gameState === 'playing' && currentPlayer && currentPlayer.jailStatus && currentPlayer.jailStatus.isInJail && currentPlayer.jailStatus.justEntered && (
        <JailPopup
          player={currentPlayer}
          onEscapeAttempt={(diceRoll) => {
            if (onJailEscapeAttempt) {
              const escapeSuccessful = onJailEscapeAttempt(currentPlayer.id, diceRoll)
              // if escape failed or successful popup will close
              // failed escape: player stays in jail turn ends
              if (!escapeSuccessful) {
                // end turn after failed escape
                setTimeout(() => {
                  if (onEndTurn) {
                    onEndTurn()
                  }
                }, 100)
              }
            }
          }}
          onWaitTurn={() => {
            if (onDecreaseJailTurns) {
              onDecreaseJailTurns(currentPlayer.id)
            }
            // end turn after waiting
            setTimeout(() => {
              if (onEndTurn) {
                onEndTurn()
              }
            }, 100)
          }}
          isVisible={true}
        />
      )}

      {/* Bingo Popup - show when player lands on bingo tile */}
      {showBingoPopup && bingoPlayerId !== null && (
        <BingoPopup
          player={players.find(p => p.id === bingoPlayerId)}
          allPlayers={players}
          onClose={onCloseBingoPopup}
          onForcedSale={onBingoForcedSale}
          onCasinoBet={onBingoCasino}
          onDuel={onBingoDuel}
          onDiscountPurchase={onBingoDiscountPurchase}
          onCollectFromAll={onBingoCollectFromAll}
          onDoubleSale={onBingoDoubleSale}
          getDiceRoll={getDiceRoll}
        />
      )}

      {/* Casino Popup - show when player gets casino from bingo */}
      {showCasinoPopup && casinoPlayerId !== null && (
        <CasinoPopup
          player={players.find(p => p.id === casinoPlayerId)}
          onClose={onCloseCasinoPopup}
          onPlaceBet={onCasinoBet}
          getDiceRoll={getDiceRoll}
        />
      )}

      {/* Duel Popup - show when player gets duel from bingo */}
      {showDuelPopup && duelInitiatorId !== null && (
        <DuelPopup
          initiator={players.find(p => p.id === duelInitiatorId)}
          allPlayers={players}
          onClose={onCloseDuelPopup}
          onDuelComplete={onDuelComplete}
        />
      )}
    </div>
  )
}


export default GamePlay
