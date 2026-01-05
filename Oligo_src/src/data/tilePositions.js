
import {GAME_CONFIG, TILE_COLORS, ACTION_TILES } from './gameConfig'




const BASE_TILE_POSITIONS = [
  //Bottom
  { id: 5, x: 70, y: 620, label: '🔀 Event', color: TILE_COLORS.freePick, actionTile: ACTION_TILES.event },
  { id: 1, x: 110, y: 570, label: '🌴 Leisure', color: TILE_COLORS.leisure, drawPool: 'leisure'},
  { id: 2, x: 150, y: 520, label: '⚖️ Income Tax (30%)', color: TILE_COLORS.tax, actionTile: ACTION_TILES.incomeTax },
  { id: 3, x: 190, y: 470, label: '💰 Chance', color: TILE_COLORS.chance, drawPool: 'chance'},
  { id: 4, x: 230, y: 420, label: '🏠 Property', color: TILE_COLORS.property, drawPool: 'property'},
  { id: 0, x: 275, y: 370, label: '🏁', color: TILE_COLORS.default}, //CENTER START

  { id: 40, x: 480, y: 620, label: '🔀 Event', color: TILE_COLORS.freePick, actionTile: ACTION_TILES.event },
  { id: 41, x: 440, y: 570, label: '🏭 Factory', color: TILE_COLORS.manufacturing, drawPool: 'manufacturing'},
  { id: 42, x: 400, y: 520, label: '📈 Bets', color: TILE_COLORS.bets, drawPool: 'bets'},
  { id: 43, x: 360, y: 470, label: '🎰 Risk', color: TILE_COLORS.risk, drawPool: 'risk' },
  { id: 44, x: 320, y: 420, label: '🚬 Mafia', color: TILE_COLORS.mafia, actionTile: ACTION_TILES.mafia},
  //Leftside
  { id: 6, x: 25, y: 620, label: '📊 Market', color: TILE_COLORS.market, actionTile: ACTION_TILES.market},
  { id: 7, x: 25, y: 575, label: '📈 Bets', color: TILE_COLORS.bets, drawPool: 'bets'},
  { id: 8, x: 25, y: 530, label: '🏭 Factory', color: TILE_COLORS.manufacturing, drawPool: 'manufacturing'},
  { id: 9, x: 25, y: 485, label: '🎰 Risk', color: TILE_COLORS.risk, drawPool: 'risk' },
  { id: 10, x: 25, y: 440, label: '🏠 Property', color: TILE_COLORS.property, drawPool: 'property'},
  { id: 11, x: 25, y: 395, label: '🔮 Bingo', color: TILE_COLORS.default, actionTile: ACTION_TILES.bingo},
  { id: 12, x: 25, y: 350, label: '🔀 Cycle', color: TILE_COLORS.freePick, actionTile: ACTION_TILES.cycle },
  { id: 13, x: 25, y: 305, label: '📈 Bets & Production', color: TILE_COLORS.bets, drawPool: 'bets'},
  { id: 14, x: 25, y: 260, label: '💰 Chance', color: TILE_COLORS.chance, drawPool: 'chance'},
  { id: 15, x: 25, y: 215, label: '🏭 Factory', color: TILE_COLORS.manufacturing, drawPool: 'manufacturing'},
  { id: 16, x: 25, y: 170, label: '🌴 Leisure', color: TILE_COLORS.leisure, drawPool: 'leisure'},
  { id: 17, x: 25, y: 125, label: '💼 Tax (10%)', color: TILE_COLORS.tax, actionTile: ACTION_TILES.tax},
  { id: 18, x: 25, y: 80, label: '📊 Market', color: TILE_COLORS.market, actionTile: ACTION_TILES.market}, //Top-left corner

  //Top
  { id: 19, x: 82, y: 80, label: '🔀 Event', color: TILE_COLORS.freePick, actionTile: ACTION_TILES.event },
  { id: 20, x: 137, y: 80, label: '🏠 Property', color: TILE_COLORS.property, drawPool: 'property'},
  { id: 21, x: 192, y: 80, label: '🎰 Risk', color: TILE_COLORS.risk, drawPool: 'risk' },
  { id: 22, x: 247, y: 80, label: '💰 Chance', color: TILE_COLORS.chance, drawPool: 'chance' },
  { id: 23, x: 302, y: 80, label: '📈 Bets', color: TILE_COLORS.bets, drawPool: 'bets' },
  { id: 24, x: 357, y: 80, label: '🏭 Factory', color: TILE_COLORS.manufacturing, drawPool: 'manufacturing'},
  { id: 25, x: 412, y: 80, label: '🌴 Leisure', color: TILE_COLORS.leisure, drawPool: 'leisure'},
  { id: 26, x: 467, y: 80, label: '🔀 Event', color: TILE_COLORS.freePick, actionTile: ACTION_TILES.event },

  //Rightside
  { id: 27, x: 525, y: 80, label: '📊 Market', color: TILE_COLORS.market, actionTile: ACTION_TILES.market}, //Top-right corner
  { id: 28, x: 525, y: 125, label: '🚨 Jail', color: TILE_COLORS.jail, actionTile: ACTION_TILES.jail},
  { id: 29, x: 525, y: 170, label: '🎰 Risk', color: TILE_COLORS.risk, drawPool: 'risk' },
  { id: 30, x: 525, y: 215, label: '🏠 Property', color: TILE_COLORS.property, drawPool: 'property'},
  { id: 31, x: 525, y: 260, label: '🏭 Factory', color: TILE_COLORS.manufacturing, drawPool: 'manufacturing'},
  { id: 32, x: 525, y: 305, label: '🔮 Bingo', color: TILE_COLORS.default, actionTile: ACTION_TILES.bingo},
  { id: 33, x: 525, y: 350, label: '🔀 Cycle', color: TILE_COLORS.freePick, actionTile: ACTION_TILES.cycle },
  { id: 34, x: 525, y: 395, label: '📈 Bets', color: TILE_COLORS.bets, drawPool: 'bets' },
  { id: 35, x: 525, y: 440, label: '💰 Chance', color: TILE_COLORS.chance, drawPool: 'chance' },
  { id: 36, x: 525, y: 485, label: '🏠 Property', color: TILE_COLORS.property, drawPool: 'property'},
  { id: 37, x: 525, y: 530, label: '🌴 Leisure', color: TILE_COLORS.leisure, drawPool: 'leisure'},
  { id: 38, x: 525, y: 575, label: '💲 Free Pick!', color: TILE_COLORS.freePick, actionTile: ACTION_TILES.freePick},
  { id: 39, x: 525, y: 620, label: '📊 Market', color: TILE_COLORS.market, actionTile: ACTION_TILES.market},//Bottom-right corner
]

//default base dimensions for tile position calculations
const BASE_WIDTH = 600
const BASE_HEIGHT = 700
const BASE_TILE_SIZE = 60

/**
 * Scale tile positions based on current game config
 * Adjusts positions based on board size and tile size changes
 * @returns {Array} Scaled tile positions
 */
const getScaledTilePositions = () => {
  const scaleX = GAME_CONFIG.BOARD_WIDTH / BASE_WIDTH
  const scaleY = GAME_CONFIG.BOARD_HEIGHT / BASE_HEIGHT
  const tileSizeScale = GAME_CONFIG.TILE_SIZE / BASE_TILE_SIZE
  
  return BASE_TILE_POSITIONS.map(tile => ({
    ...tile,
    x: Math.round(tile.x * scaleX * tileSizeScale),
    y: Math.round(tile.y * scaleY * tileSizeScale),
    // Add calculated tile size from config
    size: GAME_CONFIG.TILE_SIZE
  }))
}


export const TILE_POSITIONS = getScaledTilePositions()


export const MOVEMENT_SEQUENCE = [
  0,  //START (index 0)
  4, 3, 2, 1, 5,  //Bottom left diagonal
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,  //Left side
  19, 20, 21, 22, 23, 24, 25, 26,  //Top side
  27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,  //Right side (FIXED: added 27)
  40, 41, 42, 43, 44,  //Bottom right diagonal (FIXED: added 40)
]

/**
 * Get tile position by ID
 * @param {number} tileId - The ID of the tile
 * @returns {Object|null} Tile position object or null if not found
 */
export const getTilePosition = (tileId) => {
  return TILE_POSITIONS.find(tile => tile.id === tileId) || null
}

/**
 * Get tile ID by movement position
 * @param {number} position - Position in movement sequence
 * @returns {number} Tile ID
 */
export const getTileIdByPosition = (position) => {
  return MOVEMENT_SEQUENCE[position % MOVEMENT_SEQUENCE.length]
}

/**
 * Check if a position is the START tile
 * @param {number} position - Position in movement sequence
 * @returns {boolean} True if position is START
 */
export const isStartPosition = (position) => {
  return MOVEMENT_SEQUENCE[position] === 0
}