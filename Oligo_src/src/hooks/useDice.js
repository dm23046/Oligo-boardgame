import { useState, useCallback } from 'react'
import { rollDie } from '../utils/gameLogic'
import { GAME_CONFIG } from '../data/gameConfig'

export const useDice = () => {
  const [dice, setDice] = useState([1, 1])
  const [isRolling, setIsRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState(null)

  const rollDice = useCallback(async (callback, onDoubleRoll) => {
    if (isRolling) return { dice: dice, total: dice[0] + dice[1], isDouble: false }

    setIsRolling(true)
    
    const rollingInterval = setInterval(() => {
      setDice([
        rollDie(GAME_CONFIG.DICE_SIDES),
        rollDie(GAME_CONFIG.DICE_SIDES)
      ])
    }, 100)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(rollingInterval)
        
        const newDice = [
          rollDie(GAME_CONFIG.DICE_SIDES),
          rollDie(GAME_CONFIG.DICE_SIDES)
        ]
        
        const total = newDice[0] + newDice[1]
        const isDouble = newDice[0] === newDice[1]
        const rollResult = { dice: newDice, total, isDouble }

        setDice(newDice)
        setLastRoll(rollResult)
        setIsRolling(false)
        
        if (isDouble && onDoubleRoll && typeof onDoubleRoll === 'function') {
          onDoubleRoll(GAME_CONFIG.DOUBLE_ROLL_BONUS)
        }
        
        if (callback && typeof callback === 'function') {
          callback(rollResult.dice)
        }
        
        resolve(rollResult)
      }, GAME_CONFIG.DICE_ROLL_DURATION)
    })
  }, [isRolling, dice])

  /**
   * Reset dice to initial state
   */
  const resetDice = useCallback(() => {
    setDice([1, 1])
    setLastRoll(null)
    setIsRolling(false)
  }, [])

  /**
   * Formatted dice display string
   * @returns {string} Formatted dice result
   */
  const getDiceDisplay = useCallback(() => {
    if (!lastRoll) return ''
    
    return GAME_CONFIG.UI_TEXT.DICE_RESULT
      .replace('{0}', lastRoll.dice[0])
      .replace('{1}', lastRoll.dice[1])
      .replace('{2}', lastRoll.total)
  }, [lastRoll])

  return {
    dice,
    isRolling,
    lastRoll,
    rollDice,
    resetDice,
    getDiceDisplay,
    rollResult: lastRoll ? `${lastRoll.total}` : '',
    total: dice[0] + dice[1]
  }
}

export default useDice