import React from 'react'
import styles from './ModifierDisplay.module.css'

/**
 * ModifierDisplay component shows the current global modifier and active events
 * @param {Object} props - Component props
 * @param {Object} props.modifier - Current global modifier object
 * @param {Array} props.activeEvents - Array of active event objects
 * @param {Function} props.onDrawNewModifier - Function to draw new modifier
 * @returns {JSX.Element} ModifierDisplay component
 */
const ModifierDisplay = ({ modifier, activeEvents, onDrawNewModifier }) => {
  if (!modifier) return null

  const getEffectDescription = (effect) => {
    if (!effect) return ''
    
    switch (effect.type) {
      case 'stockBoost':
        const percentage = (effect.multiplier - 1) * 100
        return `All Stocks can be sold for ${percentage}% more`
      case 'propertyDiscount':
        const discount = effect.discount * 100
        return `All Property cards can be purchased for ${discount}% cheaper`
      case 'rawBoost':
        const rawPercentage = (effect.multiplier - 1) * 100
        return `All raw materials can be sold for ${rawPercentage}% more`
      case 'propertyBoost':
        const boostPercentage = (effect.multiplier - 1) * 100
        return `All Property cards cost ${boostPercentage}% more`
      default:
        return ''
    }
  }

  return (
    <div className={styles.modifierContainer}>
      <div className={styles.modifierHeader}>
        <h4 className={styles.modifierTitle}>Current Cycle modifiers</h4>
      </div>
      
      <div>
        <h5 className={styles.modifierName}>{modifier.name}</h5>
        <p className={styles.modifierDescription}>{modifier.description}</p>
        
        <div className={styles.modifiersList}>
          {Object.entries(modifier.modifiers).map(([key, mod]) => (
            <div key={key} className={`${styles.modifierItem} ${styles[key]}`}>
              <div className={styles.modifierLabel}>
                {mod.label}
              </div>
              <div className={styles.modifierValue}>
                {key === 'bailout' 
                  ? `$${(mod.amount / 1000).toFixed(0)}k`
                  : `${mod.limit}%`
                }
              </div>
              <div className={styles.modifierDesc}>
                {mod.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Events */}
      {activeEvents && activeEvents.length > 0 && (
        <>
          <div className={styles.modifierHeader} style={{ marginTop: '16px' }}>
            <h4 className={styles.modifierTitle}>Active Event{activeEvents.length > 1 ? 's' : ''}</h4>
          </div>
          
          <div className={styles.eventsList}>
            {activeEvents.map((event, index) => (
              <div key={event.id}>
                <h5 className={styles.modifierName} style={{ color: '#b5aad3' }}>{event.name}</h5>
                <p className={styles.modifierDescription}>
                  {getEffectDescription(event.effect)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ModifierDisplay