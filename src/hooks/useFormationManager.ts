import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { formationPositions, maxPlayersOnField } from '../constants/formation.constants'
import type { Id } from '../../convex/_generated/dataModel'
import type { DragItem, Player, Position, Team } from '../types/formation.types'

export function useFormationManager(selectedTeam: Team | null, players: Array<Player> | undefined) {
  const [draggingPlayer, setDraggingPlayer] = useState<DragItem | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [duplicatePlayers, setDuplicatePlayers] = useState<{
    player1: Player
    player2: Player
    duplicateNumber: number
  } | null>(null)

  const updateFormation = useMutation(api.teams.updateFormation)
  const updatePlayerPosition = useMutation(api.teams.updatePlayerPosition)
  const togglePlayerSubstituteStatus = useMutation(api.teams.togglePlayerSubstituteStatus)

  const arrangePlayersInFormation = async (formation: string) => {
    if (!selectedTeam) return
    
    const nonSubstitutes = players?.filter(p => !p.isSubstitute) ?? []
    const positionMap = formationPositions[formation]

    // Group players by their position
    const playersByPosition = nonSubstitutes.reduce((acc, player) => {
      const position = player.position
      acc[position] = acc[position] ?? []
      acc[position].push(player)
      return acc
    }, {} as { [key: string]: Array<Player> })

    // Assign formation positions based on player position
    const playerPositions: Array<{ playerId: Id<'players'>; position: Position }> = []

    Object.entries(positionMap).forEach(([positionName, positions]) => {
      const playersForPosition = playersByPosition[positionName]
      playersForPosition.forEach((player, index) => {
        if (index < positions.length) {
          playerPositions.push({
            playerId: player._id,
            position: positions[index]
          })
        }
      })
    })

    // Update formation and positions in a single mutation
    await updateFormation({
      teamId: selectedTeam._id,
      formation: formation,
      playerPositions
    })
  }

  const handleDropOnField = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingPlayer || !selectedTeam) {
      setDraggingPlayer(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Get current starting players
    const currentStartingPlayers = players?.filter(p => !p.isSubstitute) ?? []
    const maxPlayers = maxPlayersOnField[selectedTeam.sport]

    // If dragging from substitutes to field
    if (draggingPlayer.isSubstitute) {
      // Check if field is full
      if (currentStartingPlayers.length >= maxPlayers) {
        setValidationError(`The field is full! Maximum ${maxPlayers} players allowed on the field.`)
        setDraggingPlayer(null)
        return
      }

      // Check for duplicate jersey numbers
      const existingPlayerWithNumber = currentStartingPlayers.find(
        p => p.number === draggingPlayer.number && p._id !== draggingPlayer.id
      )
      if (existingPlayerWithNumber) {
        // Find the player being dragged from the full player list
        const draggedPlayerData = players?.find(p => p._id === draggingPlayer.id)
        if (draggedPlayerData) {
          // Show modal with duplicate players info
          setDuplicatePlayers({
            player1: existingPlayerWithNumber,
            player2: draggedPlayerData,
            duplicateNumber: draggingPlayer.number
          })
        }
        setDraggingPlayer(null)
        return
      }

      // All validations passed - move player to field
      setValidationError(null)
      await togglePlayerSubstituteStatus({
        playerId: draggingPlayer.id,
        isSubstitute: false,
        position: { x, y }
      })
    } else {
      // Just updating position of existing starting player
      await updatePlayerPosition({
        teamId: selectedTeam._id,
        playerId: draggingPlayer.id,
        position: { x, y }
      })
    }

    setDraggingPlayer(null)
  }

  const handleDropOnBench = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingPlayer) {
      setDraggingPlayer(null)
      return
    }

    // If dragging from field to bench
    if (!draggingPlayer.isSubstitute) {
      // Move player to substitutes
      setValidationError(null)
      await togglePlayerSubstituteStatus({
        playerId: draggingPlayer.id,
        isSubstitute: true
      })
    }

    setDraggingPlayer(null)
  }

  const handleDragStart = (player: Player) => {
    setDraggingPlayer({
      type: 'PLAYER',
      id: player._id,
      name: player.name,
      number: player.number,
      isSubstitute: player.isSubstitute
    })
  }

  return {
    draggingPlayer,
    validationError,
    duplicatePlayers,
    setDraggingPlayer,
    setValidationError,
    setDuplicatePlayers,
    arrangePlayersInFormation,
    handleDropOnField,
    handleDropOnBench,
    handleDragStart
  }
}
