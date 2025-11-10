import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useAuth } from '../integrations/auth/auth-provider'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type Sport = 'badminton' | 'volleyball' | 'football'
type Position = { x: number; y: number }

interface DragItem {
  type: 'PLAYER'
  id: Id<'players'>
  name: string
  number: number
  isSubstitute: boolean
}

interface Player {
  _id: Id<'players'>
  name: string
  position: string
  number: number
  isSubstitute: boolean
  formationPosition?: Position
  avatarStorageId?: Id<'_storage'>
}

interface Team {
  _id: Id<'teams'>
  name: string
  sport: Sport
  formation?: string
}

const sportPositions: Record<Sport, Array<string>> = {
  badminton: ['Singles', 'Doubles Front', 'Doubles Back'],
  volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
  football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
}

const formations: Record<Sport, Array<string>> = {
  badminton: ['Singles', '2-Player'],
  volleyball: ['6-Player Standard', '5-1', '4-2'],
  football: ['4-4-2', '4-3-3', '3-5-2'],
}

const maxPlayersOnField: Record<Sport, number> = {
  badminton: 2,
  volleyball: 6,
  football: 11,
}

const formationPositions: Record<string, Record<string, Array<Position>>> = {
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

interface EditPlayerData {
  playerId: Id<'players'> | null
  name: string
  position: string
  number: number
  isSubstitute: boolean
}

export function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedFormation, setSelectedFormation] = useState<string>('')
  const [draggingPlayer, setDraggingPlayer] = useState<DragItem | null>(null)
  const [editPlayer, setEditPlayer] = useState<EditPlayerData | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [duplicatePlayers, setDuplicatePlayers] = useState<{
    player1: Player
    player2: Player
    duplicateNumber: number
  } | null>(null)

  const updateFormation = useMutation(api.teams.updateFormation)
  const updatePlayerPosition = useMutation(api.teams.updatePlayerPosition)
  const updatePlayer = useMutation(api.teams.updatePlayer)
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

  const teams = useQuery(api.teams.getTeams, { ownerId: user?.id ?? '' })
  const players = useQuery(api.teams.getTeamPlayers, 
    selectedTeam ? { teamId: selectedTeam._id } : "skip"
  )

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
          <div className="w-1/3">
            <div className="bg-[#0f172a] rounded-lg shadow-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 text-white">Select Team</h2>

              <div className="space-y-2">
                {teams?.map((team) => (
                  <button
                    key={team._id}
                    onClick={() => setSelectedTeam({ ...team, sport: team.sport as Sport })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTeam?._id === team._id
                        ? 'bg-emerald-900/30 border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-[#1e293b] hover:bg-slate-700 border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-lg text-white">{team.name}</div>
                    <div className="text-sm text-slate-400 capitalize mt-1">{team.sport}</div>
                    {selectedTeam?._id === team._id && (
                      <div className="mt-2 text-xs text-emerald-400 font-semibold">
                        ✓ Selected for formation setup
                      </div>
                    )}
                  </button>
                ))}
                {(!teams || teams.length === 0) && (
                  <div className="text-center py-8 text-slate-500">
                    <p>No teams yet</p>
                    <p className="text-sm mt-2">Go to Teams page to create one</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Formation Setup */}
          <div className="w-2/3">
            <div className="bg-[#0f172a] rounded-lg shadow-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 text-white">Formation Setup</h2>

            {selectedTeam ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Formation
                  </label>
                  <select
                    value={selectedFormation}
                    onChange={async (e) => {
                      const formation = e.target.value
                      setSelectedFormation(formation)
                      if (formation) {
                        await arrangePlayersInFormation(formation)
                      }
                    }}
                    className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">Select Formation</option>
                    {formations[selectedTeam.sport].map((formation) => (
                      <option key={formation} value={formation}>
                        {formation}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Validation Error Message */}
                {validationError && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-400 rounded-lg flex items-start gap-2">
                    <span className="font-bold">⚠️</span>
                    <div>
                      <p className="font-semibold">Validation Error</p>
                      <p className="text-sm">{validationError}</p>
                    </div>
                    <button
                      onClick={() => setValidationError(null)}
                      className="ml-auto text-red-400 hover:text-red-300 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Formation Visual */}
                <div 
                  className="relative w-full h-96 bg-gradient-to-b from-green-600 to-green-700 rounded-lg border-2 border-green-500 shadow-inner"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={async (e) => {
                    e.preventDefault()
                    if (!draggingPlayer) {
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
                  }}
                >
                  {players?.filter(p => !p.isSubstitute).map((player) => (
                    <div
                      key={player._id}
                      draggable
                      onDragStart={() => {
                        setDraggingPlayer({
                          type: 'PLAYER',
                          id: player._id,
                          name: player.name,
                          number: player.number,
                          isSubstitute: player.isSubstitute
                        })
                      }}
                      onDoubleClick={() => {
                        setEditPlayer({
                          playerId: player._id,
                          name: player.name,
                          position: player.position,
                          number: player.number,
                          isSubstitute: player.isSubstitute
                        })
                      }}
                      className="absolute cursor-move transform -translate-x-1/2 -translate-y-1/2 select-none hover:scale-110 transition-transform"
                      style={{
                        left: `${player.formationPosition?.x ?? 50}%`,
                        top: `${player.formationPosition?.y ?? 50}%`
                      }}
                    >
                      <PlayerAvatar player={player} />
                    </div>
                  ))}
                </div>

                {/* Substitute Players */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 text-white">Substitutes</h3>
                  <div
                    className="flex gap-2 flex-wrap min-h-[60px] p-3 bg-[#1e293b] rounded-lg border-2 border-dashed border-slate-600"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={async (e) => {
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
                    }}
                  >
                    {players
                      ?.filter((p) => p.isSubstitute)
                      .map((player) => (
                        <div
                          key={player._id}
                          draggable
                          onDragStart={() => {
                            setDraggingPlayer({
                              type: 'PLAYER',
                              id: player._id,
                              name: player.name,
                              number: player.number,
                              isSubstitute: player.isSubstitute
                            })
                          }}
                          className="cursor-move hover:scale-105 transition-transform"
                        >
                          <PlayerAvatar player={player} />
                        </div>
                      ))}
                    {(!players || players.filter((p) => p.isSubstitute).length === 0) && (
                      <div className="text-slate-500 text-sm">Drag players here to make them substitutes</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                Select a team to manage formations
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Edit Player Modal */}
      {editPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#0f172a] rounded-lg p-6 w-96 border border-slate-700 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-white">Edit Player</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  value={editPlayer.name}
                  onChange={(e) => setEditPlayer({...editPlayer, name: e.target.value})}
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Position
                </label>
                <select
                  value={editPlayer.position}
                  onChange={(e) => setEditPlayer({...editPlayer, position: e.target.value})}
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                  {sportPositions[selectedTeam?.sport ?? 'football'].map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Jersey Number
                </label>
                <input
                  type="number"
                  value={editPlayer.number}
                  onChange={(e) => setEditPlayer({...editPlayer, number: parseInt(e.target.value)})}
                  min="1"
                  max="99"
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPlayer.isSubstitute}
                    onChange={(e) => setEditPlayer({...editPlayer, isSubstitute: e.target.checked})}
                    className="rounded border-slate-600 bg-[#1e293b] text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-slate-400">
                    Substitute Player
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditPlayer(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (editPlayer.playerId) {
                      await updatePlayer({
                        playerId: editPlayer.playerId,
                        name: editPlayer.name,
                        position: editPlayer.position,
                        number: editPlayer.number,
                        isSubstitute: editPlayer.isSubstitute
                      })
                    }
                    setEditPlayer(null)
                  }}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition font-medium shadow-lg shadow-emerald-500/30"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Players Modal */}
      {duplicatePlayers && (
        <DuplicatePlayersModal
          player1={duplicatePlayers.player1}
          player2={duplicatePlayers.player2}
          duplicateNumber={duplicatePlayers.duplicateNumber}
          onClose={() => setDuplicatePlayers(null)}
          onUpdate={async (playerId: Id<'players'>, newNumber: number) => {
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
          }}
        />
      )}
      </div>
    </div>
  )
}

function PlayerAvatar({ player }: { player: Player }) {
  const avatarUrl = useQuery(
    api.teams.getAvatarUrl,
    player.avatarStorageId ? { storageId: player.avatarStorageId } : "skip"
  )

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Avatar Circle with Jersey Number Badge */}
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={player.name}
            className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl border-3 border-white shadow-lg">
            {player.name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Jersey Number Badge */}
        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
          {player.number}
        </div>
      </div>
      {/* Player Name */}
      <div className="bg-white bg-opacity-90 px-2 py-1 rounded-full shadow-md">
        <div className="text-xs font-semibold text-gray-800">{player.name}</div>
      </div>
    </div>
  )
}

function DuplicatePlayersModal({
  player1,
  player2,
  duplicateNumber,
  onClose,
  onUpdate
}: {
  player1: Player
  player2: Player
  duplicateNumber: number
  onClose: () => void
  onUpdate: (playerId: Id<'players'>, newNumber: number) => void
}) {
  const [newNumber1, setNewNumber1] = useState(player1.number)
  const [newNumber2, setNewNumber2] = useState(player2.number)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0f172a] rounded-lg p-6 w-[500px] shadow-2xl border border-slate-700">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="text-xl font-bold text-red-400">Duplicate Jersey Number Detected!</h3>
            <p className="text-sm text-slate-400 mt-1">
              Two players cannot have the same jersey number on the field.
            </p>
          </div>
        </div>

        <div className="bg-red-900/20 border-2 border-red-800 rounded-lg p-4 mb-6">
          <p className="text-center text-lg font-semibold text-red-400">
            Both players have jersey number: <span className="text-2xl font-bold">#{duplicateNumber}</span>
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Player 1 - Already on field */}
          <div className="bg-blue-900/20 border-2 border-blue-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-blue-400 bg-blue-900/40 px-2 py-1 rounded">
                ON FIELD
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  value={player1.name}
                  disabled
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-slate-400 px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={player1.position}
                  disabled
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-slate-400 px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Change Jersey Number
                </label>
                <input
                  type="number"
                  value={newNumber1}
                  onChange={(e) => setNewNumber1(parseInt(e.target.value) || 1)}
                  min="1"
                  max="99"
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Player 2 - Being dragged */}
          <div className="bg-green-900/20 border-2 border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-green-400 bg-green-900/40 px-2 py-1 rounded">
                BEING ADDED
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  value={player2.name}
                  disabled
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-slate-400 px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={player2.position}
                  disabled
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-slate-400 px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Change Jersey Number
                </label>
                <input
                  type="number"
                  value={newNumber2}
                  onChange={(e) => setNewNumber2(parseInt(e.target.value) || 1)}
                  min="1"
                  max="99"
                  className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(player1._id, newNumber1)}
            disabled={newNumber1 === duplicateNumber}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
          >
            Update {player1.name}'s Number
          </button>
          <button
            onClick={() => onUpdate(player2._id, newNumber2)}
            disabled={newNumber2 === duplicateNumber}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
          >
            Update {player2.name}'s Number
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
