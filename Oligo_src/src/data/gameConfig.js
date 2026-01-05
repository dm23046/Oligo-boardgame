export const GAME_CONFIG = {
  //Player settings
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  
  //Money
  STARTING_MONEY: 100000,
  DOUBLE_ROLL_BONUS: 500,
  WINNING_MONEY: 1000000,
  
  //Dice settings
  DICE_COUNT: 2,
  DICE_SIDES: 6,
  
  //Board settings
  BOARD_WIDTH: 800,
  BOARD_HEIGHT: 800,
  
  //Tile settings
  TILE_SIZE: 60,
  TILE_BORDER: 2,
  
  //Player colors
  PLAYER_COLORS: [
    '#ff6b6b', // Red
    '#4ecdc4', // Teal
    '#45b7d1', // Blue
    '#f9ca24',  // Yellow
    '#9b59b6',  // Purple
    '#fd79a8'  // Pink
  ],
  
  //Animation settings
  DICE_ROLL_DURATION: 1000,
  
  //UI text
  UI_TEXT: {
    ROLL_DICE: 'Roll Dice',
    NEW_GAME: 'New Game',
    GAME_TITLE: 'Board Game',
    PLAYER_TURN: 'Player {0}\'s Turn',
    DICE_RESULT: '{2}',
    START_TILE: 'START'
  }
}

/**
 * Game states
 */
export const GAME_STATES = {
  SETUP: 'setup',
  PLAYING: 'playing',
  FINISHED: 'finished'
}

/**
 * Default player configuration
 */
export const DEFAULT_PLAYER = {
  id: null,
  name: '',
  position: 0,
  money: GAME_CONFIG.STARTING_MONEY,
  isActive: false,
  hasWon: false,
  properties: [],
  lapCount: 0, // Track how many times player crossed START
  loans: [
    {
      id: 'starting_loan',
      borrowed: 100000,
      totalRepaid: 120000,
      remaining: 120000,
      lapsRemaining: 24,
      perLap: 5000  
    }
  ],
  jailStatus: {
    isInJail: false,
    turnsRemaining: 0,
    penaltyPaid: false,
    penaltyAmount: 0,
    justEntered: false
  },
  mafiaStatus: false,
  activeChanceMultiplier: null,
  hasMoved: true
}

// safety
export const COLORS = GAME_CONFIG.PLAYER_COLORS

export const TILE_COLORS = {
  property: '#3b82f6',
  manufacturing: '#b011d8',
  default: '#9ca3af',
  start: '#d2f50b', 
  market: '#10b981',
  freePick: '#ad1e66',
  bets: '#b95706',
  jail: '#3e4460ff',
  tax: '#ea0808ff',
  mafia: '#b7ba7fff',
  leisure: '#def58b',
  risk: '#1a6b13',
  chance: '#e85298ff'
}

export const PROPERTY_DRAWPOOL = {
  manufacturing: [
    { id: 'manuf_1',name: 'Ice cube factory',type: 'Manufacturing',color: TILE_COLORS.manufacturing,price: 65000, sale: 65000,perLap: 6500,canSellOnTrade: true,description: 'A chance to purchase an Ice cube factory' },
    { id: 'manuf_2',name: 'Coffee factory',type: 'Manufacturing',color: TILE_COLORS.manufacturing,price: 40000, sale: 40000,perLap: 4000,canSellOnTrade: true,description: 'A chance to purchase a Coffee factory' }, 
    { id: 'manuf_3',name: 'Pie Bakery',type: 'Manufacturing',color: TILE_COLORS.manufacturing,price: 20000, sale: 20000,perLap: 2000,canSellOnTrade: true,description: 'A chance to purchase a Pie Bakery' },
    { id: 'manuf_4',name: 'Bottling Factory',type: 'Manufacturing',color: TILE_COLORS.manufacturing,price: 80000, sale: 80000,perLap: 8000,canSellOnTrade: true,description: 'A chance to purchase a Bottling Factory' },
  ],
  property: [
    { id: 'prop_1', name: 'Park Avenue', type: 'Property', color: TILE_COLORS.property, price: 30000, sale: 35000, perLap: 1000, description: 'A chance to purchase a park in the city!' },
    { id: 'prop_2', name: 'Broadway', type: 'Property', color: TILE_COLORS.property, price: 40000, sale: 45000, perLap: 6000, description: 'A chance to purchase a Broadway property!' },
    { id: 'prop_3', name: '5th Avenue', type: 'Property', color: TILE_COLORS.property, price: 50000, sale: 55000, perLap: 7000, description: 'A chance to purchase a 5th Avenue property!' },
    { id: 'prop_4', name: 'Fart Avenue', type: 'Property', color: TILE_COLORS.property, price: 15000, sale: 20000, perLap: 3000, description: 'A chance to purchase a Fart Avenue property!' },
    { id: 'prop_5', name: 'Swag Avenue', type: 'Property', color: TILE_COLORS.property, price: 100000, sale: 150000, perLap: 30000, description: 'A chance to purchase a Swag Avenue property!' },
    { id: 'prop_6', name: 'Highrise Building', type: 'Property', color: TILE_COLORS.property, price: 75000, sale: 100000, perLap: 7500, description: 'A chance to purchase a Highrise Building!' },
    { id: 'prop_7', name: 'Small House', type: 'Property', color: TILE_COLORS.property, price: 15000, sale: 25000, perLap: 1500, description: 'A chance to purchase a Small House!' },
    { id: 'prop_8', name: '3 Room Apartament', type: 'Property', color: TILE_COLORS.property, price: 55000, sale: 65000, perLap: 5500, description: 'A chance to purchase 3 Room Apartament in the city!' },
    { id: 'prop_9', name: 'Shoddy Home', type: 'Property', color: TILE_COLORS.property, price: 10000, sale: 12000, perLap: 800, description: 'A chance to purchase a Shoddy Home!' },
    { id: 'prop_10', name: 'Shopping Mall', type: 'Property', color: TILE_COLORS.property, price: 150000, sale: 200000, perLap: 15000, description: 'A chance to purchase a massive Shopping mall!' },
  ],
  bets: [
    { id: 'bet_1', name: 'Stock', type: 'Bets',  color: TILE_COLORS.bets, price: 5000, sale: 6500, perLap: 500, description: 'A chance to purchase 500 shares of a milk company!' },
    { id: 'bet_2', name: 'Raw Materials', type: 'Bets', color: TILE_COLORS.bets, price: 8000, sale: 16000, perLap: null, description: 'A chance to purchase 5kg of Gold!' },
    { id: 'bet_3', name: 'Stock', type: 'Bets', color: TILE_COLORS.bets, price: 12000, sale: 13200, perLap: 1200, description: 'A chance to purchase 1200 shares of a tech company!' },
    { id: 'bet_4', name: 'Stock', type: 'Bets',  color: TILE_COLORS.bets, price: 1500, sale: 2000, perLap: 300, description: 'A chance to purchase 1500 shares of a paperclip company!' },
    { id: 'bet_5', name: 'Stock', type: 'Bets',  color: TILE_COLORS.bets, price: 8000, sale: 10500, perLap: 1000, description: 'A chance to purchase 800 shares of a computer manufacturing company!' },
    { id: 'bet_6', name: 'Stock', type: 'Bets',  color: TILE_COLORS.bets, price: 2000, sale: 3500, perLap: 500, description: 'A chance to purchase 2000 shares of a small tech startup!' },
    { id: 'bet_7', name: 'Raw Materials', type: 'Bets', color: TILE_COLORS.bets, price: 10000, sale: 16000, perLap: null, description: 'A chance to purchase 200L of Wine!' },
    { id: 'bet_8', name: 'Raw Materials', type: 'Bets', color: TILE_COLORS.bets, price: 25000, sale: 40000, perLap: null, description: 'A chance to purchase 300L of Oil!' },
  ],
  leisure: [
    { id: 'leis_1',name: 'Luxury Yacht',type: 'Leisure',color: TILE_COLORS.leisure,price: 250000,description: 'A chance to purchase a luxury yacht!',trophy: true,canSellOnTrade: true },
    { id: 'leis_2',name: 'Party with Friends', type: 'Leisure', color: TILE_COLORS.leisure,type: 'Leisure',color: TILE_COLORS.leisure, price: 1200,sale: 1200,trophy: false,canSellOnTrade: true,description: 'Go out to party with your friends!' },
    { id: 'leis_3',name: 'Workplace Celebration',type: 'Leisure',color: TILE_COLORS.leisure,price: 500,sale: 500,perWorkplace: true,description: 'Throw a party for every workplace you own!' },
    { id: 'leis_4',name: 'New Piano',type: 'Leisure',color: TILE_COLORS.leisure,price: 10000,description: 'A chance to purchase a brand new piano!',trophy: true,canSellOnTrade: true },
    { id: 'leis_5',name: 'Workplace Improvements',type: 'Leisure',color: TILE_COLORS.leisure,price: 900,sale: 900,perWorkplace: true,description: 'Buy new computers and monitors for every workplace you own!' },
    { id: 'leis_6',name: 'Family Gathering', type: 'Leisure', color: TILE_COLORS.leisure,type: 'Leisure',color: TILE_COLORS.leisure, price: 500,sale: 500,trophy: false,canSellOnTrade: true,description: 'Orgianize a small family gathering!' },
    
    

  ],
  risk: [
    { id: 'risk_1',name: 'Casino',type: 'Risk', color: TILE_COLORS.risk,price: 1000,description: 'Casino! Minimum investment $1000 awards 100% return if roll is 6 or higher!',roll: 6,canSellOnTrade: true},
    { id: 'risk_2',name: 'Expiring Products',type: 'Risk', color: TILE_COLORS.risk,price: 15000,sale: 35000,description: 'A chance to purchase 200kg of Chicken Wings, which have to be sold within 3 turns otherwise card is lost!',lapsToSell: 3,canSellOnTrade: true},
    { id: 'risk_3',name: 'Liquor Store',type: 'Risk', color: TILE_COLORS.risk,price: 60000,sale: 60000,perLap: 30000,description: 'A chance to purchase a Liquor Store!',canSellOnTrade: true},
    { id: 'risk_4',name: 'Nightclub',type: 'Risk', color: TILE_COLORS.risk,price: 80000,sale: 80000,perLap: 40000,description: 'A chance to purchase a Nightclub!',canSellOnTrade: true},

  ],
  chance: [
    { id: 'chance_1',name: 'Workplace',type: 'Chance',color: TILE_COLORS.chance,perLap: 1000,sale: 1000,description: 'A chance to work at a Meat freezery!' },
    { id: 'chance_2',name: 'One time opportunity',type: 'Chance',color: TILE_COLORS.chance,multiplier: 0.2,affected: "Stock",description: 'A chance to sell any Stock for 20% higher than normal!' },
    { id: 'chance_3',name: 'Opportunity for Income',type: 'Chance',color: TILE_COLORS.chance,price: 30000,sale: 65000,canSellOnTrade: true,description: 'A chance to purchase 300 new winter coats. Can only be sold in Market!' },
    { id: 'chance_4',name: 'Workplace',type: 'Chance',color: TILE_COLORS.chance,perLap: 3000,sale: 3000,description: 'A chance to work at a Fastfood Establishment!' },
    { id: 'chance_5',name: 'Workplace',type: 'Chance',color: TILE_COLORS.chance,perLap: 500,sale: 500,description: 'A chance to work as a delivery driver!' },
    { id: 'chance_6',name: 'Workplace',type: 'Chance',color: TILE_COLORS.chance,perLap: 5000,sale: 5000,description: 'A chance to work at a Tech Startup!' },
    { id: 'chance_7',name: 'One time opportunity',type: 'Chance',color: TILE_COLORS.chance,multiplier: 0.5,affected: "Property",description: 'A chance to sell any Property for 50% higher than normal!' },
    { id: 'chance_8',name: 'Opportunity for Income',type: 'Chance',color: TILE_COLORS.chance,price: 15000,sale: 35000,canSellOnTrade: true,description: 'A chance to purchase 5 used cars. Can only be sold in Market!' },
    { id: 'chance_9',name: 'Opportunity for Income',type: 'Chance',color: TILE_COLORS.chance,price: 25000,sale: 40000,canSellOnTrade: true,description: 'A chance to purchase 250 new TVs. Can only be sold in Market!' },
    { id: 'chance_10',name: 'One time opportunity',type: 'Chance',color: TILE_COLORS.chance,multiplier: 0.15,affected: "Stock",description: 'A chance to sell any Stock for 15% higher than normal!' },
    { id: 'chance_10',name: 'One time opportunity',type: 'Chance',color: TILE_COLORS.chance,multiplier: 0.10,affected: "Expiring Products",description: 'A chance to sell any Expiring Products 10% higher than normal!' },
  ]
  }
export const ACTION_TILES = {
  market: {
    id: 'market',
    name: 'Market',
    description: 'Sell properties for a 10% bonus',
    action: 'marketSale'
  },
  freePick: {
    id: 'freePick',
    name: 'Pick any card you want',
    description: 'Choose any card from the draw pool',
    action: 'freePickCard'
  },
  jail: {
    id: 'jail',
    name: 'Jail',
    description: 'Pay 10% of cash and skip 3 turns, or pay $10k to attempt escape',
    action: 'jailTile',
    penaltyPercent: 0.10,
    turnsToSkip: 3,
    escapeAttemptCost: 10000,
    escapeRollTarget: 7
  },
  tax: {
    id: 'tax',
    name: 'Tax',
    description: 'Pay 10% of your net worth (cash + properties)',
    taxPercent: 0.10
  },
  event: {
    id: 'event',
    name: 'Event Tile',
    description: 'Draw an event card from the current modifier cycle'
  },
  incomeTax: {
    id: 'incomeTax',
    name: 'Income Tax',
    description: 'Pay 30% tax on your total per Lap income immediately',
    taxPercent: 0.30
  },
  mafia:{
    id: 'mafia',
    name: 'Mafia',
    description: 'Gain only half income after crossing START',
    action: 'mafiaTile',
    incomeReduction: 0.5,
  },
  cycle: {
    id: 'cycle',
    name: 'Modifier Cycle',
    description: 'Draw a new global modifier cycle',
  },
  bingo: {
    id: 'bingo',
    name: 'Bingo',
    description: 'Roll dice to determine your fate!',
    action: 'bingoTile'
  }
}

export const LOAN_OPTIONS = [
  { borrowed: 100000, totalRepaid: 120000, laps: 24, perLap: 5000 },
  { borrowed: 50000, totalRepaid: 60000, laps: 20, perLap: 3000 },
  { borrowed: 20000, totalRepaid: 22000, laps: 11, perLap: 2000 },
  { borrowed: 10000, totalRepaid: 12000, laps: 7, perLap: 1500 },
  { borrowed: 5000, totalRepaid: 6000, laps: 6, perLap: 1000 },
  { borrowed: 1000, totalRepaid: 1200, laps: 4, perLap: 300 }
]

export const MODIFIER_DRAWPOOL = {
  modifier: [
    {
      id: 'mod_1',
      name: 'CYCLE A',
      description: 'Card 1',
      modifiers: {
        property: { limit: 70, label: 'Property', description: 'Up to 70% borrowing' },
        manufacturing: { limit: 50, label: 'Manufacturing', description: 'Up to 50% borrowing' },
        bets: { limit: 30, label: 'Bets/Risk/Chance', description: 'Up to 30% borrowing' },
        bailout: { amount: 25000, label: 'No collateral', description: '$25,000' }
      },
      events: [
        {
          id: 'event_1_1',
          name: 'Stock Boom',
          description: 'All Stocks (not including raw materials) can be sold for 100% more',
          effect: {
            type: 'stockBoost',
            multiplier: 2.0
          }
        },
        {
          id: 'event_1_2',
          name: 'Stock Surge',
          description: 'All Stocks (not including raw materials) can be sold for 200% more',
          effect: {
            type: 'stockBoost',
            multiplier: 3.0
          }
        },
        {
          id: 'event_1_3',
          name: 'Property Discount',
          description: 'All Property cards can be purchased for 50% cheaper',
          effect: {
            type: 'propertyDiscount',
            discount: 0.5
          }
        }
      ]
    },
    {
      id: 'mod_2',
      name: 'CYCLE B',
      description: 'Card 2',
      modifiers: {
        property: { limit: 80, label: 'Property', description: 'Up to 80% borrowing' },
        manufacturing: { limit: 60, label: 'Manufacturing', description: 'Up to 60% borrowing' },
        bets: { limit: 40, label: 'Bets/Risk/Chance', description: 'Up to 40% borrowing' },
        bailout: { amount: 40000, label: 'No collateral', description: '$40,000' }
      },
      events: [
        {
          id: 'event_2_1',
          name: 'Housing crisis',
          description: 'All Property cards can be purchased for 100% more',
          effect: {
            type: 'propertyBoost',
            multiplier: 2.0,
          }
        },
        {
          id: 'event_2_2',
          name: 'Materials Surge',
          description: 'All raw materials can be sold for 150% more',
          effect: {
            type: 'rawBoost',
            multiplier: 2.5
          }
        },
        {
          id: 'event_2_3',
          name: 'Property Discount',
          description: 'All Property cards can be purchased for 50% cheaper',
          effect: {
            type: 'propertyDiscount',
            discount: 0.5
          }
        }
      ]
    }
  ]
}

export const DEFAULT_GLOBAL_MODIFIER = MODIFIER_DRAWPOOL.modifier[0]