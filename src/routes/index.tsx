import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useAuth } from '../integrations/auth/auth-provider'
import { api } from '../../convex/_generated/api'
import { DuplicatePlayersModal, EditPlayerModal, FormationSetupPanel, TeamSelectionPanel } from '../components/formation'
import { useFormationManager } from '../hooks/useFormationManager'
import type { Id } from '../../convex/_generated/dataModel'
import type { EditPlayerData, Player, Sport, Team } from '../types/formation.types'

export function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedFormation, setSelectedFormation] = useState<string>('')
  const [editPlayer, setEditPlayer] = useState<EditPlayerData | null>(null)

  const updatePlayer = useMutation(api.teams.updatePlayer)

  const teams = useQuery(api.teams.getTeams, { ownerId: user?.id ?? '' })
  const players = useQuery(api.teams.getTeamPlayers, 
    selectedTeam ? { teamId: selectedTeam._id } : "skip"
  )

  const {
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
  } = useFormationManager(selectedTeam, players)

  const handleFormationChange = async (formation: string) => {
    setSelectedFormation(formation)
    if (formation) {
      await arrangePlayersInFormation(formation)
    }
  }

  const handlePlayerDoubleClick = (player: Player) => {
    setEditPlayer({
      playerId: player._id,
      name: player.name,
      position: player.position,
      number: player.number,
      isSubstitute: player.isSubstitute
    })
  }

  const handleSaveEditPlayer = async () => {
    if (editPlayer?.playerId) {
      await updatePlayer({
        playerId: editPlayer.playerId,
        name: editPlayer.name,
        position: editPlayer.position,
        number: editPlayer.number,
        isSubstitute: editPlayer.isSubstitute
      })
    }
    setEditPlayer(null)
  }

  const handleUpdatePlayerNumber = async (playerId: Id<'players'>, newNumber: number) => {
    const playerToUpdate = players?.find(p => p._id === playerId)
    if (playerToUpdate) {
      await updatePlayer({
        playerId: playerId,
        name: playerToUpdate.name,
        position: playerToUpdate.position,
        number: newNumber,
        isSubstitute: playerToUpdate.isSubstitute
      })
    }
    setDuplicatePlayers(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e293b]">
        <p className="text-xl text-slate-300">Please log in to manage your teams.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1e293b] px-4 py-8">
      <div className="container mx-auto">
        <div className="flex gap-8">
          {/* Section 1: Team Selection */}
          <TeamSelectionPanel
            teams={teams?.map(t => ({ ...t, sport: t.sport as Sport }))}
            selectedTeam={selectedTeam}
            onSelectTeam={(team) => setSelectedTeam({ ...team, sport: team.sport })}
          />

          {/* Section 2: Formation Setup */}
          <FormationSetupPanel
            selectedTeam={selectedTeam}
            selectedFormation={selectedFormation}
            players={players}
            validationError={validationError}
            draggingPlayer={draggingPlayer}
            onFormationChange={handleFormationChange}
            onDragStart={handleDragStart}
            onDropOnField={handleDropOnField}
            onDropOnBench={handleDropOnBench}
            onPlayerDoubleClick={handlePlayerDoubleClick}
            onClearError={() => setValidationError(null)}
            setDraggingPlayer={setDraggingPlayer}
          />
        </div>
      </div>


      {/* Edit Player Modal */}
      {editPlayer && selectedTeam && (
        <EditPlayerModal
          editPlayer={editPlayer}
          selectedSport={selectedTeam.sport}
          onClose={() => setEditPlayer(null)}
          onSave={handleSaveEditPlayer}
          onChange={setEditPlayer}
        />
      )}

      {/* Duplicate Players Modal */}
      {duplicatePlayers && (
        <DuplicatePlayersModal
          player1={duplicatePlayers.player1}
          player2={duplicatePlayers.player2}
          duplicateNumber={duplicatePlayers.duplicateNumber}
          onClose={() => setDuplicatePlayers(null)}
          onUpdate={handleUpdatePlayerNumber}
        />
      )}
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
