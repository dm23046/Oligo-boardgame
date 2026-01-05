import styles from './Tile.module.css'
import { isStartTile } from '../utils/gameLogic'

/**
 * Individual tile component for the game board
 * @param {Object} props - Component props
 * @param {Object} props.tile - Tile data (id, x, y, label, color, drawPool)
 * @param {boolean} props.isHighlighted - Whether tile should be highlighted
 * @param {boolean} props.isInFreePickMode - Whether game is in FreePick mode
 * @param {boolean} props.isSelected - Whether this tile is selected for FreePick
 * @param {Function} props.onClick - Click handler for tile
 * @param {Function} props.onPickClick - Click handler for PICK button
 * @returns {JSX.Element} Tile component
 */
const Tile = ({ tile, isHighlighted = false, isInFreePickMode = false, isSelected = false, onClick, onPickClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(tile)
    }
  }

  const isJailTile = tile.actionTile && tile.actionTile.id === 'jail'

  const tileClasses = [
    styles.tile,
    isStartTile(tile.id) ? styles.startTile : isJailTile ? styles.jailTile : styles.regularTile,
    isHighlighted ? styles.highlighted : '',
    tile.drawPool ? styles.drawPoolTile : '',
    isInFreePickMode && tile.drawPool ? styles.freePickClickable : '',
    isSelected ? styles.selectedForPick : ''
  ].filter(Boolean).join(' ')

  const tileStyle = {
    left: `${tile.x}px`,
    top: `${tile.y}px`,
    backgroundColor: tile.color || '#3b82f6'
  }

  // Show PICK button when this tile is selected in FreePick mode
  const showPickButton = isSelected && isInFreePickMode && tile.drawPool

  return (
    <div
      className={tileClasses}
      style={tileStyle}
      onClick={handleClick}
      data-tile-id={tile.id}
      data-draw-pool={tile.drawPool || ''}
      role="button"
      tabIndex={0}
      aria-label={`Tile ${tile.label}${tile.drawPool ? ` - ${tile.drawPool} drawPool` : ''}${showPickButton ? ' - Selected for pick' : ''}`}
      title={`${tile.label}${showPickButton ? ' - Selected for pick from ' + tile.drawPool : ''}`}
    >
      <span className={styles.tileLabel}>
        {tile.label}
      </span>
      
      {/* PICK button overlay */}
      {showPickButton && (
        <button 
          className={styles.pickButton}
          onClick={(e) => {
            e.stopPropagation()
            if (onPickClick) onPickClick()
          }}
        >
          PICK
        </button>
      )}
    </div>
  )
}

export default Tile