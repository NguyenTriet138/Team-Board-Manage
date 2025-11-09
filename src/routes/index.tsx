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
}

interface Player {
  _id: Id<'players'>
  name: string
  position: string
  number: number
  isSubstitute: boolean
  formationPosition?: Position
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
  const [showNewTeamForm, setShowNewTeamForm] = useState(false)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [selectedFormation, setSelectedFormation] = useState<string>('')
  const [draggingPlayer, setDraggingPlayer] = useState<DragItem | null>(null)
  const [editPlayer, setEditPlayer] = useState<EditPlayerData | null>(null)

  const createTeam = useMutation(api.teams.createTeam)
  const addPlayer = useMutation(api.teams.addPlayer)
  const updateFormation = useMutation(api.teams.updateFormation)
  const updatePlayerPosition = useMutation(api.teams.updatePlayerPosition)
  const updatePlayer = useMutation(api.teams.updatePlayer)

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
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Please log in to manage your teams.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Section 1: Team Management */}
        <div className="w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Team Management</h2>
            
            {/* Team List */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Your Teams</h3>
                <button
                  onClick={() => setShowNewTeamForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create New Team
                </button>
              </div>
              
              <div className="space-y-2">
                {teams?.map((team) => (
                  <button
                    key={team._id}
                    onClick={() => setSelectedTeam({ ...team, sport: team.sport as Sport })}
                    className={`w-full text-left p-3 rounded ${
                      selectedTeam?._id === team._id
                        ? 'bg-blue-100 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-gray-600">{team.sport}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Player Management */}
            {selectedTeam && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Players</h3>
                  <button
                    onClick={() => setShowPlayerForm(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Add Player
                  </button>
                </div>
                
                <div className="space-y-2">
                  {players?.map((player) => (
                    <div
                      key={player._id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">
                          {player.number} - {player.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {player.position}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          {player.isSubstitute ? 'Substitute' : 'Starting'}
                        </div>
                        <button
                          onClick={() => {
                            setEditPlayer({
                              playerId: player._id,
                              name: player.name,
                              position: player.position,
                              number: player.number,
                              isSubstitute: player.isSubstitute
                            })
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Formation Setup */}
        <div className="w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Formation Setup</h2>
            
            {selectedTeam ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Formation</option>
                    {formations[selectedTeam.sport].map((formation) => (
                      <option key={formation} value={formation}>
                        {formation}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Formation Visual */}
                <div 
                  className="relative w-full h-96 bg-green-100 rounded-lg border-2 border-green-300"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggingPlayer) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = ((e.clientX - rect.left) / rect.width) * 100
                      const y = ((e.clientY - rect.top) / rect.height) * 100
                      
                      updatePlayerPosition({
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
                          number: player.number
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
                      className="absolute bg-white shadow-md rounded-full p-2 cursor-move transform -translate-x-1/2 -translate-y-1/2 select-none hover:bg-blue-50"
                      style={{
                        left: `${player.formationPosition?.x ?? 50}%`,
                        top: `${player.formationPosition?.y ?? 50}%`
                      }}
                    >
                      <div className="font-medium text-sm">
                        {player.number} - {player.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {player.position}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Substitute Players */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Substitutes</h3>
                  <div className="flex gap-2 flex-wrap">
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
                              number: player.number
                            })
                          }}
                          className="px-3 py-2 bg-gray-100 rounded-full text-sm cursor-move"
                        >
                          {player.number} - {player.name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Select a team to manage formations
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Team Modal */}
      {showNewTeamForm && (
        <NewTeamModal
          onClose={() => setShowNewTeamForm(false)}
          onCreate={async (name: string, sport: Sport) => {
            await createTeam({
              name,
              sport,
              ownerId: user?.id ?? '',
            })
            setShowNewTeamForm(false)
          }}
        />
      )}

      {/* New Player Modal */}
      {showPlayerForm && selectedTeam && (
        <NewPlayerModal
          sport={selectedTeam.sport}
          onClose={() => setShowPlayerForm(false)}
          onCreate={async (playerData) => {
            await addPlayer({
              teamId: selectedTeam._id,
              ...playerData,
            })
            setShowPlayerForm(false)
          }}
        />
      )}

      {/* Edit Player Modal */}
      {editPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Edit Player</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Player Name
                </label>
                <input
                  type="text"
                  value={editPlayer.name}
                  onChange={(e) => setEditPlayer({...editPlayer, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <select
                  value={editPlayer.position}
                  onChange={(e) => setEditPlayer({...editPlayer, position: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {sportPositions[selectedTeam?.sport ?? 'football'].map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jersey Number
                </label>
                <input
                  type="number"
                  value={editPlayer.number}
                  onChange={(e) => setEditPlayer({...editPlayer, number: parseInt(e.target.value)})}
                  min="1"
                  max="99"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPlayer.isSubstitute}
                    onChange={(e) => setEditPlayer({...editPlayer, isSubstitute: e.target.checked})}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Substitute Player
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditPlayer(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
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
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewTeamModal({ onClose, onCreate }: { 
  onClose: () => void
  onCreate: (name: string, sport: Sport) => void
}) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState<Sport>('football')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-4">Create New Team</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as Sport)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="football">Football</option>
              <option value="volleyball">Volleyball</option>
              <option value="badminton">Badminton</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate(name, sport)}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Team
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewPlayerModal({ sport, onClose, onCreate }: {
  sport: Sport
  onClose: () => void
  onCreate: (data: {
    name: string
    position: string
    number: number
    isSubstitute: boolean
  }) => void
}) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState(sportPositions[sport][0])
  const [number, setNumber] = useState(1)
  const [isSubstitute, setIsSubstitute] = useState(false)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-4">Add New Player</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Player Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {sportPositions[sport].map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Jersey Number
            </label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(parseInt(e.target.value))}
              min="1"
              max="99"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isSubstitute}
                onChange={(e) => setIsSubstitute(e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Substitute Player
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate({ name, position, number, isSubstitute })}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Player
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
