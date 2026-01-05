import React from 'react'
import styles from './EventDisplay.module.css'

/**
 * Display all currently active event cards
 * Events are drawn from modifier cycles and stack visually
 */
const EventDisplay = ({ events }) => {
  if (!events || events.length === 0) return null

  const getEffectDescription = (effect) => {
    if (!effect) return ''
    
    switch (effect.type) {
      case 'stockBoost':
        const percentage = (effect.multiplier - 1) * 100
        return `All Stocks can be sold for ${percentage}% more`
      case 'propertyDiscount':
        const discount = effect.discount * 100
        return `All Property cards can be purchased for ${discount}% cheaper`
      default:
        return ''
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Active Event{events.length > 1 ? 's' : ''}
      </h3>
      <div className={styles.eventStack}>
        {events.map((event, index) => (
          <div key={event.id} className={styles.event} style={{ '--index': index }}>
            <p className={styles.description}>
              {getEffectDescription(event.effect)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventDisplay
