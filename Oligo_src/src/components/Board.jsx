import React from 'react'
import Tile from './Tile'
import Player from './Player'
import { TILE_POSITIONS } from '../data/tilePositions'
import { getPlayerPosition } from '../utils/gameLogic'
import { GAME_CONFIG } from '../data/gameConfig'
import styles from './Board.module.css'

/**
 * Board component renders tiles and players
 * @param {Object} props - Component props
 * @param {Array} props.players - Array of player objects
 * @param {boolean} props.isInFreePickMode - Whether game is in FreePick mode
 * @param {Object} props.selectedFreePickTile - Currently selected tile for FreePick
 * @param {Function} props.onTileClick - Handler for tile clicks
 * @param {Function} props.onPickClick - Handler for PICK button clicks
 * @param {Function} props.onPlayerClick - Handler for player clicks
 * @param {Array} props.highlightedTiles - Array of tile IDs to highlight
 * @returns {JSX.Element} Board component
 */
const Board = ({ 
  players = [], 
  isInFreePickMode = false,
  selectedFreePickTile = null,
  onTileClick, 
  onPickClick,
  onPlayerClick, 
  highlightedTiles = [] 
}) => {
  //css from config
  const boardStyle = {
    '--board-width': `${GAME_CONFIG.BOARD_WIDTH}px`,
    '--board-height': `${GAME_CONFIG.BOARD_HEIGHT}px`,
    '--tile-size': `${GAME_CONFIG.TILE_SIZE}px`,
    '--tile-border': `${GAME_CONFIG.TILE_BORDER}px`
  }

  return (
    <div className={styles.board} style={boardStyle}>
      {/* tiles */}
      {TILE_POSITIONS.map(tile => (
        <Tile
          key={tile.id}
          tile={tile}
          isHighlighted={highlightedTiles.includes(tile.id)}
          isInFreePickMode={isInFreePickMode}
          isSelected={selectedFreePickTile && selectedFreePickTile.id === tile.id}
          onClick={onTileClick}
          onPickClick={onPickClick}
        />
      ))}
      
      {/* players + pos */}
      {players.map(player => {
        const visualPosition = getPlayerPosition(player, players)
        return (
          <Player
            key={player.id}
            player={player}
            visualPosition={visualPosition}
            onClick={onPlayerClick}
          />
        )
      })}
    </div>
  )
}

export default Board