import type { Position, Sport } from '../types/formation.types'

export const sportPositions: Record<Sport, Array<string>> = {
  badminton: ['Singles', 'Doubles Front', 'Doubles Back'],
  volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
  football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
}

export const formations: Record<Sport, Array<string>> = {
  badminton: ['Singles', '2-Player'],
  volleyball: ['6-Player Standard', '5-1', '4-2'],
  football: ['4-4-2', '4-3-3', '3-5-2'],
}

export const maxPlayersOnField: Record<Sport, number> = {
  badminton: 2,
  volleyball: 6,
  football: 11,
}

export const formationPositions: Record<string, Record<string, Array<Position>>> = {
  'Singles': {
    'Singles': [{ x: 50, y: 50 }]
  },
  '2-Player': {
    'Doubles Front': [{ x: 30, y: 50 }],
    'Doubles Back': [{ x: 70, y: 50 }]
  },
  '6-Player Standard': {
    'Outside Hitter': [{ x: 20, y: 30 }, { x: 20, y: 70 }],
    'Middle Blocker': [{ x: 40, y: 30 }, { x: 40, y: 70 }],
    'Setter': [{ x: 60, y: 30 }],
    'Opposite': [{ x: 60, y: 70 }]
  },
  '5-1': {
    'Outside Hitter': [{ x: 30, y: 30 }, { x: 30, y: 70 }],
    'Middle Blocker': [{ x: 50, y: 30 }, { x: 50, y: 70 }],
    'Setter': [{ x: 70, y: 30 }],
    'Opposite': [{ x: 70, y: 70 }]
  },
  '4-4-2': {
    'Goalkeeper': [{ x: 50, y: 10 }],
    'Defender': [{ x: 20, y: 25 }, { x: 40, y: 25 }, { x: 60, y: 25 }, { x: 80, y: 25 }],
    'Midfielder': [{ x: 20, y: 55 }, { x: 40, y: 55 }, { x: 60, y: 55 }, { x: 80, y: 55 }],
    'Forward': [{ x: 35, y: 85 }, { x: 65, y: 85 }]
  },
  '4-3-3': {
    'Goalkeeper': [{ x: 50, y: 10 }],
    'Defender': [{ x: 20, y: 25 }, { x: 40, y: 25 }, { x: 60, y: 25 }, { x: 80, y: 25 }],
    'Midfielder': [{ x: 30, y: 55 }, { x: 50, y: 55 }, { x: 70, y: 55 }],
    'Forward': [{ x: 25, y: 85 }, { x: 50, y: 85 }, { x: 75, y: 85 }]
  },
  '3-5-2': {
    'Goalkeeper': [{ x: 50, y: 10 }],
    'Defender': [{ x: 30, y: 25 }, { x: 50, y: 25 }, { x: 70, y: 25 }],
    'Midfielder': [{ x: 20, y: 55 }, { x: 35, y: 55 }, { x: 50, y: 55 }, { x: 65, y: 55 }, { x: 80, y: 55 }],
    'Forward': [{ x: 40, y: 85 }, { x: 60, y: 85 }]
  }
}
