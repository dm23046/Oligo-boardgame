import React, { useState } from 'react'
import { rollDie } from '../utils/gameLogic'
import styles from './CardPopup.module.css'

const CardPopup = ({ property, player, activeEvents, onBuy, onPass, isVisible }) => {
  const [betAmount, setBetAmount] = useState(property?.price || 0)
  const [showRollResult, setShowRollResult] = useState(false)
  const [rollValue, setRollValue] = useState(0)
  const [betSuccess, setBetSuccess] = useState(false)
  
  if (!isVisible || !property) return null

  //calculate manufacturing count for perWorkplace leisure cards
  const manufacturingCount = (player.properties || []).filter(
    p => p.type === 'Manufacturing'
  ).length

  // calculate final price with potential discounts
  let finalPrice = property.price || 0
  const hasWorkplaceMultiplier = property.perWorkplace && property.type === 'Leisure'
  
  if (hasWorkplaceMultiplier) {
    finalPrice = property.price * manufacturingCount
  }
  
  const discountEvent = activeEvents?.find(event => event.effect?.type === 'propertyDiscount')
  if (discountEvent && property.type === 'Property') {
    finalPrice = Math.ceil((property.price * (1 - discountEvent.effect.discount)) / 100) * 100
  }
  
  const boostEvent = activeEvents?.find(event => event.effect?.type === 'propertyBoost')
  if (boostEvent && property.type === 'Property') {
    finalPrice = Math.ceil((property.price * boostEvent.effect.multiplier) / 100) * 100
  }
  
  if (player.bingoDiscount) {
    finalPrice = Math.floor(finalPrice * (1 - player.bingoDiscount))
  }
  
  const isFree = finalPrice === 0
  const hasDiscount = discountEvent || player.bingoDiscount
  const hasBoost = boostEvent

  const canAfford = isFree || player.money >= finalPrice
  const cannotBuyDueToNoManufacturing = hasWorkplaceMultiplier && manufacturingCount === 0
  const isTrophy = property.trophy
  const mustBuyLeisure = property.type === 'Leisure' && !isTrophy && !cannotBuyDueToNoManufacturing
  const canPassTrophy = isTrophy && !canAfford // Can only pass trophy if player can't afford it
  const showPassButton = !mustBuyLeisure && !isTrophy || canPassTrophy
  const isRiskCard = property.type === 'Risk'
  const hasRoll = isRiskCard && property.roll
  const canAffordBet = player.money >= betAmount

  const handleRiskBet = () => {
    const dice1 = rollDie()
    const dice2 = rollDie()
    const total = dice1 + dice2
    setRollValue(total)
    
    const success = total >= property.roll
    setBetSuccess(success)
    setShowRollResult(true)
    
    // call onBuy with bet amount and result
    setTimeout(() => {
      onBuy(betAmount, success, total)
      setShowRollResult(false)
    }, 2000)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.cardContainer}>
        <div className={styles.cardFlip}>
          <div className={styles.card}>
            <div className={styles.cardHeader} style={{ background: property.color }}>
              <h2 className={styles.propertyTitle}>{property.type}</h2>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.propertyDetails}>
                <div className={styles.propertyName}>
                  {property.name}
                </div>

                <div className={styles.propertyDescription}>
                    {property.description || 'No description available.'}
                </div>
                
                {/* Risk card betting UI */}
                {isRiskCard && hasRoll && (
                  <div className={styles.riskBetting}>
                    <h3 className={styles.riskTitle}>Place Your Bet</h3>
                    <div className={styles.riskInfo}>
                      <p>Roll {property.roll}+ to win 2x your bet!</p>
                    </div>
                    
                    <div className={styles.betAmountSelector}>
                      <label className={styles.betLabel}>Bet Amount:</label>
                      <input
                        type="range"
                        min={property.price}
                        max={player.money}
                        step="100"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className={styles.betSlider}
                      />
                      <input 
                        type="number"
                        min={property.price}
                        max={player.money}
                        step="100"
                        value={betAmount}
                        onChange={(e) => {
                          let val = Number(e.target.value)
                          if (val < property.price) val = property.price
                          if (val > player.money) val = player.money
                          setBetAmount(val)
                        }}
                        className={styles.betInput}
                      />
                      <div className={styles.betDisplay}>
                        ${betAmount.toLocaleString()}
                      </div>
                      <div className={styles.betRange}>
                        <span>Min: ${property.price.toLocaleString()}</span>
                        <span>Max: ${player.money.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {showRollResult && (
                      <div className={`${styles.rollResult} ${betSuccess ? styles.success : styles.failure}`}>
                        <div className={styles.rollValue}>🎲 {rollValue}</div>
                        <div className={styles.resultText}>
                          {betSuccess 
                            ? `You won $${(betAmount).toLocaleString()}!` 
                            : `You lost $${betAmount.toLocaleString()}`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={styles.priceSection}>
                  <span className={styles.priceLabel}>Purchase Price</span>
                  {isFree ? (
                    <span className={styles.priceValue} style={{ color: '#27ae60', fontWeight: 'bold' }}>FREE</span>
                  ) : hasWorkplaceMultiplier ? (
                    <>
                      <span className={styles.priceFormula}>
                        {manufacturingCount} Workplaces × ${property.price}
                      </span>
                      <span className={styles.priceValue}>${finalPrice}</span>
                      {manufacturingCount === 0 && (
                        <span className={styles.insufficientFunds}>
                          No workplaces owned!
                        </span>
                      )}
                    </>
                  ) : hasDiscount ? (
                    <>
                      <span className={styles.priceValueStrike}>${property.price}</span>
                      <span className={styles.priceValue}>${finalPrice}</span>
                      <span className={styles.discountLabel}>50% EVENT DISCOUNT!</span>
                    </>
                  ) : hasBoost ? (
                    <>
                      <span className={styles.priceValueStrike}>${property.price}</span>
                      <span className={styles.priceValue}>${finalPrice}</span>
                      <span className={styles.discountLabel} style={{ color: '#dc2626' }}>100% INCREASE!</span>
                    </>
                  ) : (
                    <span className={styles.priceValue}>${finalPrice}</span>
                  )}
                  {property.lapsToSell && (
                    <div className={styles.lapsWarning}>
                      ⚠️ Must sell within {property.lapsToSell} laps or card expires
                    </div>
                  )}
                  {property.type === 'Leisure' && (
                    <>
                      <span className={styles.leisureInfo}>
                        Can be sold for purchase price on Market tiles
                        {property.trophy && ' 🏆'}
                      </span>
                    </>
                  )}
                {property.type !== 'Leisure' && property.type !== 'Risk' && (
                  <>
                    <span className={styles.priceLabel}>Sale Price</span>
                    <span className={styles.priceSale}>${property.sale}</span>
                  </>
                )}                  {property.perLap && (
                    <>
                      <span className={styles.priceLabel}>Per Lap Income</span>
                      <span className={styles.perLap}>${property.perLap}</span>
                    </>
                  )}
                </div>
                
                <div className={styles.playerInfo}>
                  <div className={styles.playerMoney}>
                    <span className={styles.moneyLabel}>Your Money:</span>
                    <span className={`${styles.moneyValue} ${canAfford ? styles.canAfford : styles.cantAfford}`}>
                      ${player.money}
                    </span>
                  </div>
                  {mustBuyLeisure && !canAfford && (
                    <div className={styles.leisureRequirement}>
                      <span className={styles.requirementIcon}>⚠️</span>
                      <span className={styles.requirementText}>
                        This leisure purchase is mandatory. Take a loan if needed.
                      </span>
                    </div>
                  )}
                  {mustBuyLeisure && canAfford && (
                    <div className={styles.leisureRequirement}>
                      <span className={styles.requirementIcon}>📋</span>
                      <span className={styles.requirementText}>
                        This leisure purchase is mandatory.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.cardFooter}>
              {isRiskCard && hasRoll && canAffordBet ? (
                <>
                  <button 
                    className={`${styles.actionButton} ${styles.buyButton}`}
                    onClick={handleRiskBet}
                    disabled={!canAffordBet || showRollResult}
                  >
                    Roll & Bet ${betAmount.toLocaleString()}
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.passButton}`}
                    onClick={onPass}
                  >
                    Pass
                  </button>
                </>
              ) : (
                <>
                  {!cannotBuyDueToNoManufacturing && (
                    <>
                      {/* For trophy cards: only show buy button if player can afford it */}
                      {isTrophy ? (
                        canAfford && (
                          <button 
                            className={`${styles.actionButton} ${styles.buyButton}`}
                            onClick={onBuy}
                          >
                            Buy Property
                          </button>
                        )
                      ) : (
                        <button 
                          className={`${styles.actionButton} ${styles.buyButton}`}
                          onClick={onBuy}
                          disabled={!canAfford}
                        >
                          {isFree ? 'Take for Free' : (canAfford ? (mustBuyLeisure ? 'Buy Leisure (Required)' : 'Buy Property') : 'Take Loan to Buy')}
                        </button>
                      )}
                    </>
                  )}
                  
                  {showPassButton && (
                    <button 
                      className={`${styles.actionButton} ${styles.passButton}`}
                      onClick={onPass}
                    >
                      Pass
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardPopup