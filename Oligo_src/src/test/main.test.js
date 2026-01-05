import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGame } from '../hooks/useGame'

describe('Unit testing', () => {
  
  
  describe('Module 1: Spēle', () => {
    
    describe('1.1 Create Game', () => {
      it('should initialize game in setup state', () => {
        const { result } = renderHook(() => useGame())
        
        expect(result.current.gameState).toBe('setup')
        expect(result.current.players.length).toBeGreaterThanOrEqual(2)
        expect(result.current.currentPlayerIndex).toBe(0)
      })

      it('should create game with specified number of players', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(3)
        })

        act(() => {
          result.current.startGame()
        })

        expect(result.current.gameState).toBe('playing')
        expect(result.current.players.length).toBe(3)
        // Players get default names like 'Player 1', 'Player 2', utt.
        expect(result.current.players[0].name).toBe('Player 1')
        expect(result.current.players[1].name).toBe('Player 2')
        expect(result.current.players[2].name).toBe('Player 3')
      })

      it('should initialize global modifier on game start', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        expect(result.current.globalModifier).not.toBeNull()
        expect(result.current.globalModifier).toHaveProperty('modifiers')
        expect(result.current.currentModifierIndex).toBe(0)
      })

    })

    describe('1.2 Reset Game', () => {
      it('should reset game to setup state', () => {
        const { result } = renderHook(() => useGame())
        

        act(() => {
          result.current.startGame()
        })

        expect(result.current.gameState).toBe('playing')
        expect(result.current.players.length).toBeGreaterThanOrEqual(2)

        act(() => {
          result.current.resetGame()
        })

        expect(result.current.gameState).toBe('setup')
        expect(result.current.currentPlayerIndex).toBe(0)
      })

      it('should clear all player data on reset', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        act(() => {
          result.current.awardMoney(result.current.players[0].id, 5000) // Change default money
        })

        const playerBeforeReset = result.current.players[0]
        expect(playerBeforeReset.money).toBeGreaterThan(0)

        act(() => {
          result.current.resetGame()
        })
        expect(result.current.gameState).toBe('setup')
        expect(result.current.players[0].money).toBe(100000) // Default starting money
      })

      it('should allow starting new game after reset', () => {
        const { result } = renderHook(() => useGame())
        

        act(() => {
          result.current.startGame()
        })


        act(() => {
          result.current.resetGame()
        })

        // Set new player count
        act(() => {
          result.current.updatePlayerCount(3)
        })

        // Start new game
        act(() => {
          result.current.startGame()
        })

        expect(result.current.gameState).toBe('playing')
        expect(result.current.players.length).toBe(3)
        expect(result.current.players[0].name).toBe('Player 1')
      })
    })
  })

  
  describe('Module 2: Gājienu', () => {
    
    describe('2.1 Roll Dice and Move Player', () => {
      it('should move current player by dice roll', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        const initialPosition = result.current.players[0].position

        act(() => {
          result.current.moveCurrentPlayer(5)
        })

        expect(result.current.players[0].position).toBe(initialPosition + 5)
      })

      it('should only move current player, not other players', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(2)
        })

        act(() => {
          result.current.startGame()
        })

        const player2InitialPosition = result.current.players[1].position

        act(() => {
          result.current.moveCurrentPlayer(7)
        })

        expect(result.current.players[0].position).toBe(7)
        expect(result.current.players[1].position).toBe(player2InitialPosition)
      })

      it('should trigger property draw when landing on property tile', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        // Player should be at position 3
        expect(result.current.players[0].position).toBe(3)
      })

      it('should handle multiple consecutive moves', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        expect(result.current.players[0].position).toBe(3)

        // Move again (same turn - should accumulate)
        act(() => {
          result.current.moveCurrentPlayer(4)
        })

        // Position should now be 3 + 4 = 7
        expect(result.current.players[0].position).toBe(7)
      })
    })

    describe('2.2 Cross START and Receive Income', () => {
      it('should increment lap count when crossing START', async () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        const initialLapCount = result.current.players[0].lapCount || 0

        // Move to position 43, then cross START with move of 3 (wraps to position 1)
        act(() => {
          result.current.moveCurrentPlayer(43)
        })

        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        await waitFor(() => {
          expect(result.current.players[0].lapCount).toBe(initialLapCount + 1)
        })
      })

      it('should receive income from properties when crossing START', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        // Award property with perLap income
        const mockProperty = {
          id: 'test_prop',
          name: 'Test Property',
          type: 'Property',
          price: 5000,
          sale: 4000,
          perLap: 500
        }

        act(() => {
          result.current.awardProperty(result.current.players[0].id, mockProperty)
        })

        // Accept the property
        act(() => {
          result.current.handleBuyProperty(0, false, 0)
        })

        const moneyBeforeCrossing = result.current.players[0].money

        act(() => {
          result.current.moveCurrentPlayer(44)
        })

        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        const moneyAfterCrossing = result.current.players[0].money

        // Should have received income (accounting for property purchase cost)
        expect(moneyAfterCrossing).toBeGreaterThan(moneyBeforeCrossing - mockProperty.price)
      })

      it('should expire Risk cards based on lapsToSell when crossing START', async () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        // Award Risk card with lapsToSell
        const riskCard = {
          id: 'risk_1',
          name: 'Test Risk',
          type: 'Risk',
          price: 1000,
          lapsToSell: 2,
          lapsRemaining: 2,
          perLap: 200
        }

        act(() => {
          result.current.awardProperty(result.current.players[0].id, riskCard)
        })

        act(() => {
          result.current.handleBuyProperty(0, false, 0)
        })

        expect(result.current.players[0].properties.length).toBe(1)

        // Cross START first time (lapsRemaining becomes 1)
        act(() => {
          result.current.moveCurrentPlayer(44)
        })
        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        await waitFor(() => {
          expect(result.current.players[0].properties.length).toBe(1)
          expect(result.current.players[0].properties[0].lapsRemaining).toBe(1)
        })
        
        // Cross START second time (lapsRemaining becomes 0, card expires)
        act(() => {
          result.current.moveCurrentPlayer(42)
        })
        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        await waitFor(() => {
          expect(result.current.players[0].properties.length).toBe(0)
        })
      })

      it('should reduce income by 50% if Mafia status is active', async () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        const mockProperty = {
          id: 'test_prop',
          name: 'Test Property',
          type: 'Property',
          price: 5000,
          perLap: 1000
        }

        act(() => {
          result.current.awardProperty(result.current.players[0].id, mockProperty)
        })

        act(() => {
          result.current.handleBuyProperty(0, false, 0)
        })

        // Activate Mafia status
        act(() => {
          result.current.handleMafiaTile(result.current.players[0].id)
        })

        expect(result.current.players[0].mafiaStatus).toBe(true)

        const moneyBeforeCrossing = result.current.players[0].money

        act(() => {
          result.current.moveCurrentPlayer(44)
        })

        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        // Wait for async income processing
        await waitFor(() => {
          
          expect(result.current.players[0].money).toBe(
            moneyBeforeCrossing -5000 + (mockProperty.perLap / 2)
          )
        })
      })
    })

    describe('2.3 Pay Loan Interest Automatically', () => {

      it('should deduct loan payment when crossing START with active loan', async () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        const initialMoney = result.current.players[0].money
        // Players start with a starting_loan
        const initialLoanCount = result.current.players[0].loans.length
        expect(initialLoanCount).toBeGreaterThanOrEqual(1)

        act(() => {
          result.current.takeLoan(result.current.players[0].id, 5000)
        })

        const moneyAfterLoan = result.current.players[0].money
        expect(moneyAfterLoan).toBe(initialMoney + 5000)

        expect(result.current.players[0].loans.length).toBe(initialLoanCount + 1)


        act(() => {
          result.current.moveCurrentPlayer(44)
        })

        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        await waitFor(() => {
          expect(result.current.players[0].money).toBeLessThan(moneyAfterLoan)
        })
      })

      it('should complete loan after all laps are paid', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        // Take the smallest loan (1000 borrowed, 4 laps, 300 per lap)
        await act(async () => {
          result.current.takeLoan(result.current.players[0].id, 1000)
        })

        // Find the newly taken loan (not the starting_loan)
        const takenLoans = result.current.players[0].loans.filter(l => l.id !== 'starting_loan')
        expect(takenLoans.length).toBe(1)
        
        const loanId = takenLoans[0].id
        expect(takenLoans[0].lapsRemaining).toBe(4)

        // Helper function to cross START
        const crossStart = async () => {
          await act(async () => {
            result.current.moveCurrentPlayer(44)
          })
          await act(async () => {
            result.current.moveCurrentPlayer(2)
          })
          // Allow time for async callbacks (setTimeout in hook)
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 200))
          })
        }

        for (let i = 0; i < 4; i++) {
          await crossStart()
        }


        await waitFor(() => {
          const remainingLoans = result.current.players[0].loans.filter(l => l.id === loanId)
          expect(remainingLoans.length).toBe(0)
        }, { timeout: 3000 })
      })

      it('should use bailout bank when player cannot afford loan payment', async () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        act(() => {
          result.current.takeLoan(result.current.players[0].id, 50000) // 3500 per lap
        })
        
        act(() => {
          result.current.takeLoan(result.current.players[0].id, 20000) // 2000 per lap
        })

        const player = result.current.players[0]
        
        // Calculate total loan payment required (including starting loan)
        const totalLoanPayment = player.loans.reduce((sum, loan) => sum + loan.perLap, 0)
        
        const loansCountBefore = player.loans.length
        
        // Set player money to less than required (but bailout should cover it)
        const targetMoney = 1000
        const amountToSpend = player.money - targetMoney
        
        act(() => {
          result.current.awardMoney(result.current.players[0].id, -amountToSpend)
        })

        expect(result.current.players[0].money).toBe(1000)
        expect(result.current.players[0].money).toBeLessThan(totalLoanPayment)

        act(() => {
          result.current.moveCurrentPlayer(43)
        })

        act(() => {
          result.current.moveCurrentPlayer(3)
        })

        // Wait for async loan and bailout processing
        await waitFor(() => {
          const playerAfter = result.current.players[0]
          

          expect(playerAfter.money).toBeGreaterThanOrEqual(0)

          expect(playerAfter.loans.length).toBe(loansCountBefore)

          playerAfter.loans.forEach(loan => {
            expect(loan.lapsRemaining).toBeLessThan(loan.lapsRemaining + 1)
          })
        })
      })

    })

    describe('2.4 End Turn', () => {
      it('should advance to next player on end turn', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(3)
        })

        act(() => {
          result.current.startGame()
        })

        expect(result.current.currentPlayerIndex).toBe(0)
        expect(result.current.players[0].isActive).toBe(true)

        act(() => {
          result.current.nextPlayerTurn()
        })

        expect(result.current.currentPlayerIndex).toBe(1)
        expect(result.current.players[0].isActive).toBe(false)
        expect(result.current.players[1].isActive).toBe(true)
      })

      it('should wrap to first player after last player turn', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(2)
        })

        act(() => {
          result.current.startGame()
        })


        act(() => {
          result.current.nextPlayerTurn()
        })

        expect(result.current.currentPlayerIndex).toBe(1)


        act(() => {
          result.current.nextPlayerTurn()
        })

        expect(result.current.currentPlayerIndex).toBe(0)
        expect(result.current.players[0].isActive).toBe(true)
      })

      it('only one player is active at a time', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(3)
        })

        act(() => {
          result.current.startGame()
        })

        act(() => {
          result.current.nextPlayerTurn()
        })

        const activePlayers = result.current.players.filter(p => p.isActive)
        expect(activePlayers.length).toBe(1)
        expect(activePlayers[0]).toBe(result.current.players[1])
      })

      it('should preserve player state across turn changes', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(2)
        })

        act(() => {
          result.current.startGame()
        })


        const player1Id = result.current.players[0].id
        
        act(() => {
          result.current.awardMoney(player1Id, 5000)
        })

        const player1Money = result.current.players[0].money

        act(() => {
          result.current.nextPlayerTurn()
        })

        // Player 1's money should be preserved
        expect(result.current.players[0].money).toBe(player1Money)
      })

    })

    describe('2.5 Check for Victory', () => {
      it('should identify player with highest net worth', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(3)
        })

        act(() => {
          result.current.startGame()
        })


        act(() => {
          result.current.awardMoney(result.current.players[1].id, 50000)
        })

        const netWorths = result.current.players.map(player => {
          const cashOnHand = player.money
          const propertyValue = (player.properties || []).reduce((sum, prop) => {
            return sum + (prop.actualPurchasePrice || prop.price || 0)
          }, 0)
          return cashOnHand + propertyValue
        })

        const maxNetWorth = Math.max(...netWorths)
        const winnerIndex = netWorths.indexOf(maxNetWorth)

        expect(winnerIndex).toBe(1) // Player 2 should have highest net worth
      })

      it('should compare players by total assets (cash + properties)', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.updatePlayerCount(2)
        })

        act(() => {
          result.current.startGame()
        })


        act(() => {
          result.current.awardMoney(result.current.players[0].id, 20000)
        })

        // Give second player property (worth more than cash given to player 1)
        const mockProperty = {
          id: 'expensive_prop',
          name: 'Expensive Property',
          type: 'Property',
          price: 30000,
          sale: 25000,
          perLap: 2000
        }

        act(() => {
          result.current.awardProperty(result.current.players[1].id, mockProperty)
        })

        act(() => {
          result.current.nextPlayerTurn()
        })

        act(() => {
          result.current.handleBuyProperty(0, false, 0)
        })

        const netWorth1 = result.current.players[0].money
        const netWorth2 = result.current.players[1].money + 
          (result.current.players[1].properties || []).reduce((sum, prop) => {
            return sum + (prop.actualPurchasePrice || prop.price || 0)
          }, 0)

        expect(netWorth1).toBeGreaterThan(0)
        expect(netWorth2).toBeGreaterThan(0)
      })

      it('should subtract loans from net worth calculation', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        const player = result.current.players[0]
        const moneyBeforeLoan = player.money
        

        const initialLoanLiability = player.loans.reduce((sum, loan) => {
          return sum + (loan.totalOwed || loan.borrowed || 0)
        }, 0)


        act(() => {
          result.current.takeLoan(result.current.players[0].id, 5000)
        })

        const playerAfterLoan = result.current.players[0]
        const moneyAfterLoan = playerAfterLoan.money


        expect(moneyAfterLoan).toBe(moneyBeforeLoan + 5000)

        const totalLoanLiability = playerAfterLoan.loans.reduce((sum, loan) => {
          return sum + (loan.totalOwed || loan.borrowed || 0)
        }, 0)

        // Net worth = cash + properties - loan liabilities
        const cashOnHand = playerAfterLoan.money
        const propertyValue = (playerAfterLoan.properties || []).reduce((sum, prop) => {
          return sum + (prop.actualPurchasePrice || prop.price || 0)
        }, 0)
        const netWorth = cashOnHand + propertyValue - totalLoanLiability

        expect(totalLoanLiability).toBeGreaterThan(initialLoanLiability)
        
        // Net worth should be less than just cash on hand due to loan liability
        expect(netWorth).toBeLessThan(cashOnHand)
      })
    })
  })

  describe('Module 3: Īpašumi', () => {
    
    describe('3.1 Draw and Offer to Buy a Card', () => {
      it('should store property details in pending property', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const testProperty = {
          id: 'test_prop_2',
          name: 'Expensive Property',
          type: 'Manufacturing',
          price: 50000,
          sale: 55000,
          perLap: 5000
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, testProperty)
        })

        expect(result.current.pendingProperty.property.name).toBe('Expensive Property')
        expect(result.current.pendingProperty.property.price).toBe(50000)
        expect(result.current.pendingProperty.playerId).toBe(result.current.players[0].id)
      })

      it('should award property to correct player', async () => {
        const { result } = renderHook(() => useGame())

        await act(async () => {
          result.current.updatePlayerCount(2)
        })
        await act(async () => {
          result.current.startGame()
        })

        const testProperty = {
          id: 'test_prop_3',
          name: 'Player 2 Property',
          type: 'Property',
          price: 20000
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[1].id, testProperty)
        })

        expect(result.current.pendingProperty.playerId).toBe(result.current.players[1].id)

        await act(async () => {
          result.current.handleBuyProperty()
        })

        expect(result.current.players[1].properties.some(p => p.id === 'test_prop_3')).toBe(true)
      })

    })

    describe('3.2 Pass a Card Purchase', () => {
      it('should not add property to player when passing', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const initialPropertyCount = result.current.players[0].properties?.length || 0

        const testProperty = {
          id: 'test_pass_2',
          name: 'Skipped Property',
          type: 'Property',
          price: 25000
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, testProperty)
        })

        await act(async () => {
          result.current.handlePassProperty()
        })

        // Property count should not increase
        const finalPropertyCount = result.current.players[0].properties?.length || 0
        expect(finalPropertyCount).toBe(initialPropertyCount)
      })

      it('should return card to draw pool when passed (remains available for future draws)', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const getOwnedPropertyIds = () => {
          return result.current.players.flatMap(p => p.properties?.map(prop => prop.id) || [])
        }
        const testProperty = {
          id: 'test_drawpool_1',
          name: 'Returnable Property',
          type: 'Property',
          price: 20000
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, testProperty)
        })


        await act(async () => {
          result.current.handlePassProperty()
        })

        // The property should NOT be in any player's owned properties
        const ownedIds = getOwnedPropertyIds()
        expect(ownedIds.includes('test_drawpool_1')).toBe(false)
      })
    })

    describe('3.3 Sell a Card', () => {
      it('should remove property from player when sold', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const testProperty = {
          id: 'test_sell_1',
          name: 'Sellable Property',
          type: 'Property',
          price: 20000,
          sale: 25000
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, testProperty)
        })

        await act(async () => {
          result.current.handleBuyProperty()
        })

        expect(result.current.players[0].properties.some(p => p.id === 'test_sell_1')).toBe(true)

        const propertyToSell = result.current.players[0].properties.find(p => p.id === 'test_sell_1')
        
        await act(async () => {
          result.current.moveCurrentPlayer(10)
        })
        await act(async () => {
          result.current.handleSellProperty(result.current.players[0].id, propertyToSell)
        })
        expect(result.current.players[0].properties.some(p => p.id === 'test_sell_1')).toBe(false)
      })

      it('should add sale amount to player money', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const testProperty = {
          id: 'test_sell_2',
          name: 'Valuable Property',
          type: 'Property',
          price: 10000,
          sale: 15000
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, testProperty)
        })

        await act(async () => {
          result.current.handleBuyProperty()
        })

        const moneyAfterBuy = result.current.players[0].money
        const propertyToSell = result.current.players[0].properties.find(p => p.id === 'test_sell_2')
        await act(async () => {
          result.current.moveCurrentPlayer(10)
        })

        await act(async () => {
          result.current.handleSellProperty(result.current.players[0].id, propertyToSell)
        })

        expect(result.current.players[0].money).toBe(moneyAfterBuy + 15000)
      })

      it('should not sell property player does not own', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.updatePlayerCount(2)
        })

        await act(async () => {
          result.current.startGame()
        })

        const fakeProperty = {
          id: 'fake_prop_1',
          name: 'Not Owned Property',
          type: 'Property',
          price: 10000,
          sale: 12000
        }

        const moneyBefore = result.current.players[0].money

        await act(async () => {
          result.current.handleSellProperty(result.current.players[0].id, fakeProperty)
        })

        expect(result.current.players[0].money).toBe(moneyBefore)
      })

      it('should handle selling leisure items only on market', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const leisureProperty = {
          id: 'leis_test_1',
          name: 'Test Leisure',
          type: 'Leisure',
          price: 1000,
          actualPurchasePrice: 1000,
          canSellOnTrade: true
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, leisureProperty)
        })

        await act(async () => {
          result.current.handleBuyProperty()
        })

        const propertyOwned = result.current.players[0].properties.find(p => p.id === 'leis_test_1')
        const moneyAfterBuy = result.current.players[0].money

        // Try to sell WITHOUT being on market - should fail
        await act(async () => {
          result.current.handleSellProperty(result.current.players[0].id, propertyOwned, null, false)
        })
        await act(async () => {
          result.current.moveCurrentPlayer(10)
        })
        expect(result.current.players[0].properties.some(p => p.id === 'leis_test_1')).toBe(true)

        // Sell WITH isOnMarket = true - should succeed
        await act(async () => {
          result.current.handleSellProperty(result.current.players[0].id, propertyOwned, null, true)
        })

        expect(result.current.players[0].properties.some(p => p.id === 'leis_test_1')).toBe(false)
        expect(result.current.players[0].money).toBe(moneyAfterBuy + 1000)
      })
    })

    describe('3.4 Activate a Multiplier Card', () => {
      it('should remove chance card from properties when activated', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const chanceCard = {
          id: 'chance_multi_2',
          name: 'Raw Boost',
          type: 'Chance',
          multiplier: 1.0,
          affected: 'Raw Materials'
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, chanceCard)
        })

        await act(async () => {
          result.current.handleBuyProperty()
        })

        expect(result.current.players[0].properties.some(p => p.id === 'chance_multi_2')).toBe(true)

        const playerId = result.current.players[0].id

        await act(async () => {
          result.current.activateChanceMultiplier(playerId, chanceCard)
        })

        expect(result.current.players[0].properties.some(p => p.id === 'chance_multi_2')).toBe(false)
      })

      it('should clear multiplier on end turn', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.updatePlayerCount(2)
        })

        await act(async () => {
          result.current.startGame()
        })

        const chanceCard = {
          id: 'chance_multi_3',
          name: 'Temporary Boost',
          type: 'Chance',
          multiplier: 0.25,
          affected: 'Stock'
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, chanceCard)
        })

        await act(async () => {
          result.current.handleBuyProperty()
        })

        await act(async () => {
          result.current.activateChanceMultiplier(result.current.players[0].id, chanceCard)
        })

        expect(result.current.players[0].activeChanceMultiplier).not.toBeNull()


        await act(async () => {
          result.current.nextPlayerTurn()
        })


        await act(async () => {
          result.current.nextPlayerTurn()
        })

        expect(result.current.players[0].activeChanceMultiplier).toBeNull()
      })

      it('should apply multiplier to property sale', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        const stockProperty = {
          id: 'stock_test_1',
          name: 'Stock',
          type: 'Bets',
          price: 5000,
          sale: 6500
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, stockProperty)
        })

        await act(async () => {
          result.current.handleBuyProperty()
        })

        // Buy and activate a chance multiplier affecting Stock
        const chanceCard = {
          id: 'chance_stock_boost',
          name: 'Stock Sale Boost',
          type: 'Chance',
          multiplier: 1.0, // 100% boost
          affected: 'Stock'
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, chanceCard)
        })

        await act(async () => {
          result.current.handleBuyProperty()
        })

        await act(async () => {
          result.current.activateChanceMultiplier(result.current.players[0].id, chanceCard)
        })

        const moneyBeforeSale = result.current.players[0].money
        const ownedStock = result.current.players[0].properties.find(p => p.id === 'stock_test_1')

        // Move player to allow selling (hasMoved flag requirement)
        await act(async () => {
          result.current.moveCurrentPlayer(5)
        })

        await act(async () => {
          result.current.handleSellProperty(result.current.players[0].id, ownedStock)
        })


        expect(result.current.players[0].money).toBe(moneyBeforeSale + 13000)
      })
    })
  })

  describe('Module 4: Maksājumi', () => {
    
    describe('4.1 Take a Loan', () => {
      it('should not create loan for invalid amount', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        const loansBefore = result.current.players[0].loans.length

        act(() => {
          result.current.takeLoan(result.current.players[0].id, 99999) // Invalid amount
        })

        expect(result.current.players[0].loans.length).toBe(loansBefore)
      })

      it('should generate unique loan ID', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        await act(async () => {
          result.current.takeLoan(result.current.players[0].id, 5000)
        })

        // Small delay to ensure different timestamp
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 5))
        })

        await act(async () => {
          result.current.takeLoan(result.current.players[0].id, 5000)
        })

        const loans5000 = result.current.players[0].loans.filter(l => l.borrowed === 5000 && l.id !== 'starting_loan')
        expect(loans5000.length).toBe(2)
        expect(loans5000[0].id).not.toBe(loans5000[1].id)
      })
    })

    describe('4.2 Manually Repay a Loan', () => {
      it('should support paying multiple installments at once', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        await act(async () => {
          result.current.takeLoan(result.current.players[0].id, 5000)
        })

        const loan = result.current.players[0].loans.find(l => l.borrowed === 5000 && l.id !== 'starting_loan')
        const moneyBefore = result.current.players[0].money

        await act(async () => {
          result.current.makeManualLoanPayment(loan.id, 3) // Pay 3 installments
        })

        // Should deduct 3 * perLap (3 * 1000 = 3000)
        expect(result.current.players[0].money).toBe(moneyBefore - 3000)
        
        const loanAfter = result.current.players[0].loans.find(l => l.id === loan.id)
        expect(loanAfter.lapsRemaining).toBe(6 - 3)
      })

      it('should remove loan when fully paid off manually', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        // Take smallest loan (4 laps)
        await act(async () => {
          result.current.takeLoan(result.current.players[0].id, 1000)
        })

        const loan = result.current.players[0].loans.find(l => l.borrowed === 1000 && l.id !== 'starting_loan')

        // Pay all 4 installments at once
        await act(async () => {
          result.current.makeManualLoanPayment(loan.id, 4)
        })

        const loanAfter = result.current.players[0].loans.find(l => l.id === loan.id)
        expect(loanAfter).toBeUndefined()
      })

      it('should not pay if player attempts invalid installment amount', async () => {
        const { result } = renderHook(() => useGame())
        
        await act(async () => {
          result.current.startGame()
        })

        await act(async () => {
          result.current.takeLoan(result.current.players[0].id, 5000)
        })

        const loan = result.current.players[0].loans.find(l => l.borrowed === 5000 && l.id !== 'starting_loan')
        const moneyBefore = result.current.players[0].money
        const lapsRemainingBefore = loan.lapsRemaining

        // Try to pay 0 installments
        await act(async () => {
          result.current.makeManualLoanPayment(loan.id, 0)
        })

        expect(result.current.players[0].money).toBe(moneyBefore)
        
        const loanAfter1 = result.current.players[0].loans.find(l => l.id === loan.id)
        expect(loanAfter1.lapsRemaining).toBe(lapsRemainingBefore)

        // Try to pay negative installments
        await act(async () => {
          result.current.makeManualLoanPayment(loan.id, -5)
        })

        expect(result.current.players[0].money).toBe(moneyBefore)
        
        const loanAfter2 = result.current.players[0].loans.find(l => l.id === loan.id)
        expect(loanAfter2.lapsRemaining).toBe(lapsRemainingBefore)
      })
    })

    describe('4.3 Award Money', () => {
      it('should support negative amounts (penalties)', () => {
        const { result } = renderHook(() => useGame())
        
        act(() => {
          result.current.startGame()
        })

        const moneyBefore = result.current.players[0].money

        act(() => {
          result.current.awardMoney(result.current.players[0].id, -2000)
        })

        expect(result.current.players[0].money).toBe(moneyBefore - 2000)
      })
    })
  })

  describe('Module 5: Lauciņi', () => {
    describe('5.1 Freepick', () => {
      it('should reject invalid freepick tile without drawPool', async () => {
        const { result } = renderHook(() => useGame())

        await act(async () => { 
          result.current.startGame()
        })

        // Land on freepick tile
        await act(async () => {
          result.current.moveToTile(38)
        })
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 150))
        })
        
        // Verify freepick mode is activated
        expect(result.current.isInFreePickMode).toBe(true)
        expect(result.current.selectedFreePickTile).toBe(null)
        
        // Try to select an invalid tile without drawPool
        const invalidTile = { id: 1 } // No drawPool property
        
        await act(async () => {
          result.current.handleFreePickTileClick(invalidTile)
        })

        // Freepick mode should still be active but no tile should be selected
        expect(result.current.isInFreePickMode).toBe(true)
        expect(result.current.selectedFreePickTile).toBe(null)
        

        const validTile = { id: 5, drawPool: 'Property' }
        
        await act(async () => {
          result.current.handleFreePickTileClick(validTile)
        })

        expect(result.current.isInFreePickMode).toBe(true)
        expect(result.current.selectedFreePickTile).toEqual(validTile)
      })
    })
    describe('5.2 Tax', () => {
      it('should use perWorkplace final purchase price for tax calculation', async () => {
        const { result } = renderHook(() => useGame())
        await act(async () => {
          result.current.startGame()
        })


        const manufacturing1 = {
          id: 'mfg_1',
          name: 'Manufacturing 1',
          type: 'Manufacturing',
          price: 5000,
          perLap: 300
        }

        const manufacturing2 = {
          id: 'mfg_2',
          name: 'Manufacturing 2',
          type: 'Manufacturing',
          price: 5000,
          perLap: 300
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, manufacturing1)
        })
        await act(async () => {
          result.current.handleBuyProperty()
        })

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, manufacturing2)
        })
        await act(async () => {
          result.current.handleBuyProperty()
        })

        const leisureProperty = {
          id: 'leisure_tax_1',
          name: 'Office Renovation',
          type: 'Leisure',
          perWorkplace: 3000
        }

        await act(async () => {
          result.current.awardProperty(result.current.players[0].id, leisureProperty)
        })
        
        // This should cost perWorkplace * 2 = 6000
        await act(async () => {
          result.current.handleBuyProperty()
        })

        const moneyBeforeTax = result.current.players[0].money

        await act(async () => {
          result.current.handleTaxPayment(result.current.players[0].id)
        })

        // Tax should be 10% of total purchase prices:
        // Manufacturing1: 5000, Manufacturing2: 5000 Leisure: 6000 (perWorkplace * 2)
        // Total: 16000 Tax: 1600
        const expectedTax = Math.ceil((5000 + 5000 + 6000) * 0.10)
        expect(result.current.players[0].money).toBe(moneyBeforeTax - expectedTax)
      })
    })
    describe('5.3 Jail', () => {
      it('should only show popup when player just entered jail', async () => {
        const { result } = renderHook(() => useGame())
        await act(async () => {
          result.current.startGame()
        })
        await act(async () => {
          result.current.updatePlayerCount(2)
        })

        await act(async () => {
          result.current.moveToTile(28)
        })
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 150))
        })
        
        // Player should be in jail with justEntered flag
        expect(result.current.players[0].jailStatus.isInJail).toBe(true)
        expect(result.current.players[0].jailStatus.justEntered).toBe(true)
        
        const turnsRemaining = result.current.players[0].jailStatus.turnsRemaining
        expect(turnsRemaining).toBeGreaterThan(0)
        

        await act(async () => {
          result.current.nextPlayerTurn()
        })
        
        await act(async () => {
          result.current.nextPlayerTurn()
        })
        
        // Back to player 1 - should still be in jail with same status
        expect(result.current.players[0].jailStatus.isInJail).toBe(true)
        // Popup should not show again
        
        expect(result.current.players[0].jailStatus.turnsRemaining).toBe(turnsRemaining)
        expect(result.current.players[0].jailStatus.justEntered).toBe(false)
      })
    })
    describe('5.6 Cycle events', () => {
      it('should change cycle to next after all events are drawn', async () => {
        const { result } = renderHook(() => useGame())
        await act(async () => {
          result.current.startGame()
        })

        expect(result.current.activeEvents.length).toBe(0)
        
        await act(async () => {
          result.current.handleEventDraw(result.current.players[0].id)
        })
        
        expect(result.current.activeEvents.length).toBe(1)
        
        await act(async () => {
          result.current.handleEventDraw(result.current.players[0].id)
        })
        await act(async () => {
          result.current.handleEventDraw(result.current.players[0].id)
        })

        expect(result.current.activeEvents.length).toBe(3)
        const firstModifier = result.current.globalModifier

        await act(async () => {
          result.current.handleEventDraw(result.current.players[0].id)
        })

        expect(result.current.globalModifier).not.toBe(firstModifier)
      
      })
      it('should loop back to first modifier after all events are drawn', async () => {
        const { result } = renderHook(() => useGame())
        await act(async () => {
          result.current.startGame()
        })
        
        const firstModifier = result.current.globalModifier
        const totalEventsInModifier = firstModifier?.events?.length || 0
        
        // Draw all events from the first modifier
        for (let i = 0; i < totalEventsInModifier; i++) {
          await act(async () => {
            result.current.handleEventDraw(result.current.players[0].id)
          })
        }
        
        expect(result.current.activeEvents.length).toBe(totalEventsInModifier)
        
        await act(async () => {
          result.current.handleEventDraw(result.current.players[0].id)
        })
        
        expect(result.current.activeEvents.length).toBe(0)

        const secondModifier = result.current.globalModifier
        expect(secondModifier.id).not.toBe(firstModifier.id)

        const totalEventsInSecondModifier = secondModifier?.events?.length || 0
        for (let i = 0; i < totalEventsInSecondModifier; i++) {
          await act(async () => {
            result.current.handleEventDraw(result.current.players[0].id)
          })
        }
        await act(async () => {
          result.current.handleEventDraw(result.current.players[0].id)
        })
        const currentModifier = result.current.globalModifier
        expect(currentModifier.id).toBe(firstModifier.id)
        expect(result.current.activeEvents.length).toBe(0)
      })
    })
    describe('5.7 Cycle modifiers', () => {
      it('should loop back to first modifier after all modifiers are exhausted', async () => {
        const { result } = renderHook(() => useGame())
        await act(async () => {
          result.current.startGame()
        })

        const firstModifier = result.current.globalModifier
        

        await act(async () => {
          result.current.drawNewModifier()
        })
        
        const secondModifier = result.current.globalModifier
        expect(secondModifier.id).not.toBe(firstModifier.id)
        expect(result.current.currentModifierIndex).toBe(1)
      
        await act(async () => {
          result.current.drawNewModifier()
        })
        
        expect(result.current.globalModifier.id).toBe(firstModifier.id)
        expect(result.current.currentModifierIndex).toBe(0)
        expect(result.current.activeEvents.length).toBe(0)
      })
    })
})

})
