import type { Id } from '../../convex/_generated/dataModel'

export type Sport = 'badminton' | 'volleyball' | 'football'

export type Position = { x: number; y: number }

export interface DragItem {
  type: 'PLAYER'
  id: Id<'players'>
  name: string
  number: number
  isSubstitute: boolean
}

export interface Player {
  _id: Id<'players'>
  name: string
  position: string
  number: number
  isSubstitute: boolean
  formationPosition?: Position
  avatarStorageId?: Id<'_storage'>
}

export interface Team {
  _id: Id<'teams'>
  name: string
  sport: Sport
  formation?: string
}

export interface EditPlayerData {
  playerId: Id<'players'> | null
  name: string
  position: string
  number: number
  isSubstitute: boolean
}
