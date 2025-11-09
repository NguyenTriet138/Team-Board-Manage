import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useAuth } from '../integrations/auth/auth-provider'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type Sport = 'badminton' | 'volleyball' | 'football'

interface Player {
  _id: Id<'players'>
  name: string
  position: string
  number: number
  isSubstitute: boolean
  teamId: Id<'teams'>
  avatarStorageId?: Id<'_storage'>
}

interface Team {
  _id: Id<'teams'>
  name: string
  sport: Sport
  formation?: string
}

interface EditPlayerData {
  playerId: Id<'players'> | null
  name: string
  position: string
  number: number
  isSubstitute: boolean
  avatarStorageId?: Id<'_storage'>
}

const sportPositions: Record<Sport, Array<string>> = {
  badminton: ['Singles', 'Doubles Front', 'Doubles Back'],
  volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
  football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
}

export function TeamsPage() {
  const { isAuthenticated, user } = useAuth()
  const [expandedTeams, setExpandedTeams] = useState<Set<Id<'teams'>>>(new Set())
  const [showNewTeamForm, setShowNewTeamForm] = useState(false)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState<Team | null>(null)
  const [editPlayer, setEditPlayer] = useState<EditPlayerData | null>(null)
  const [playerToDelete, setPlayerToDelete] = useState<Id<'players'> | null>(null)

  const createTeam = useMutation(api.teams.createTeam)
  const addPlayer = useMutation(api.teams.addPlayer)
  const updatePlayer = useMutation(api.teams.updatePlayer)
  const deletePlayer = useMutation(api.teams.deletePlayer)
  const generateUploadUrl = useMutation(api.teams.generateUploadUrl)
  const updatePlayerAvatar = useMutation(api.teams.updatePlayerAvatar)

  const teams = useQuery(api.teams.getTeams, { ownerId: user?.id ?? '' })

  const toggleTeamExpansion = (teamId: Id<'teams'>) => {
    setExpandedTeams((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(teamId)) {
        newSet.delete(teamId)
      } else {
        newSet.add(teamId)
      }
      return newSet
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Please log in to manage your teams.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Team Management</h1>
          <button
            onClick={() => setShowNewTeamForm(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold"
          >
            + Create New Team
          </button>
        </div>

        {teams && teams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No teams yet</p>
            <p className="text-sm">Create your first team to get started!</p>
          </div>
        )}

        <div className="space-y-4">
          {teams?.map((team) => (
            <TeamSection
              key={team._id}
              team={{ ...team, sport: team.sport as Sport }}
              isExpanded={expandedTeams.has(team._id)}
              onToggle={() => toggleTeamExpansion(team._id)}
              onAddPlayer={() => {
                setSelectedTeamForPlayer({ ...team, sport: team.sport as Sport })
                setShowPlayerForm(true)
              }}
              onEditPlayer={(player: Player) => {
                setSelectedTeamForPlayer({ ...team, sport: team.sport as Sport })
                setEditPlayer({
                  playerId: player._id,
                  name: player.name,
                  position: player.position,
                  number: player.number,
                  isSubstitute: player.isSubstitute,
                  avatarStorageId: player.avatarStorageId
                })
              }}
              onDeletePlayer={(playerId: Id<'players'>) => {
                setPlayerToDelete(playerId)
              }}
            />
          ))}
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
      {showPlayerForm && selectedTeamForPlayer && (
        <NewPlayerModal
          sport={selectedTeamForPlayer.sport}
          onClose={() => {
            setShowPlayerForm(false)
            setSelectedTeamForPlayer(null)
          }}
          onCreate={async (playerData) => {
            await addPlayer({
              teamId: selectedTeamForPlayer._id,
              ...playerData,
            })
            setShowPlayerForm(false)
            setSelectedTeamForPlayer(null)
          }}
          generateUploadUrl={generateUploadUrl}
        />
      )}

      {/* Edit Player Modal */}
      {editPlayer && selectedTeamForPlayer && (
        <EditPlayerModal
          editPlayer={editPlayer}
          sport={selectedTeamForPlayer.sport}
          onClose={() => {
            setEditPlayer(null)
            setSelectedTeamForPlayer(null)
          }}
          onSave={async () => {
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
            setSelectedTeamForPlayer(null)
          }}
          onChange={setEditPlayer}
          generateUploadUrl={generateUploadUrl}
          updatePlayerAvatar={updatePlayerAvatar}
        />
      )}

      {/* Delete Player Confirmation Modal */}
      {playerToDelete && (
        <DeleteConfirmationModal
          onClose={() => setPlayerToDelete(null)}
          onConfirm={async () => {
            await deletePlayer({ playerId: playerToDelete })
            setPlayerToDelete(null)
          }}
        />
      )}
    </div>
  )
}

function TeamSection({
  team,
  isExpanded,
  onToggle,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer
}: {
  team: Team
  isExpanded: boolean
  onToggle: () => void
  onAddPlayer: () => void
  onEditPlayer: (player: Player) => void
  onDeletePlayer: (playerId: Id<'players'>) => void
}) {
  const players = useQuery(api.teams.getTeamPlayers, { teamId: team._id })

  const startingPlayers = players?.filter(p => !p.isSubstitute) ?? []
  const substitutePlayers = players?.filter(p => p.isSubstitute) ?? []
  const totalPlayers = players?.length ?? 0

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-lg">
      {/* Team Header - Clickable Box */}
      <div
        onClick={onToggle}
        className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{team.name}</h2>
              <p className="text-sm text-gray-600 capitalize mt-1">
                {team.sport} • {totalPlayers} {totalPlayers === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
              {startingPlayers.length} Starting
            </div>
            <div className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
              {substitutePlayers.length} Subs
            </div>
          </div>
        </div>
      </div>

      {/* Team Content - Expandable */}
      {isExpanded && (
        <div className="p-6 bg-white border-t-2 border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-700">Team Members</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddPlayer()
              }}
              className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 font-semibold shadow-md transition-all hover:shadow-lg"
            >
              + Add Member
            </button>
          </div>

          {players && players.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-400 text-lg">No members in this team yet.</p>
              <p className="text-sm text-gray-400 mt-2">Click "Add Member" to get started!</p>
            </div>
          )}

          {players && players.length > 0 && (
            <div className="space-y-6">
              {/* Starting Players */}
              {startingPlayers.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 px-3 py-1 rounded-lg">Starting Lineup</span>
                    <span className="text-sm text-gray-500">({startingPlayers.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {startingPlayers.map((player) => (
                      <PlayerCard
                        key={player._id}
                        player={player}
                        onEdit={onEditPlayer}
                        onDelete={onDeletePlayer}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Substitute Players */}
              {substitutePlayers.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-600 mb-4 flex items-center gap-2">
                    <span className="bg-gray-100 px-3 py-1 rounded-lg">Substitutes</span>
                    <span className="text-sm text-gray-500">({substitutePlayers.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {substitutePlayers.map((player) => (
                      <PlayerCard
                        key={player._id}
                        player={player}
                        onEdit={onEditPlayer}
                        onDelete={onDeletePlayer}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlayerCard({
  player,
  onEdit,
  onDelete
}: {
  player: Player
  onEdit: (player: Player) => void
  onDelete: (playerId: Id<'players'>) => void
}) {
  const avatarUrl = useQuery(
    api.teams.getAvatarUrl,
    player.avatarStorageId ? { storageId: player.avatarStorageId } : "skip"
  )

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={player.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-md"
            />
          ) : (
            <div className="bg-white border-2 border-blue-500 rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl text-blue-600 shadow-md">
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
            {player.number}
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-lg">{player.name}</div>
          <div className="text-sm text-gray-600">{player.position}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(player)
          }}
          className="text-blue-500 hover:text-blue-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-100 transition-all"
        >
          ✏️ Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(player._id)
          }}
          className="text-red-500 hover:text-red-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-100 transition-all"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}

function NewTeamModal({
  onClose,
  onCreate
}: {
  onClose: () => void
  onCreate: (name: string, sport: Sport) => void
}) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState<Sport>('football')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Create New Team</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter team name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as Sport)}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="football">Football</option>
              <option value="volleyball">Volleyball</option>
              <option value="badminton">Badminton</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (name.trim()) {
                  onCreate(name, sport)
                }
              }}
              disabled={!name.trim()}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              Create Team
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewPlayerModal({
  sport,
  onClose,
  onCreate,
  generateUploadUrl
}: {
  sport: Sport
  onClose: () => void
  onCreate: (data: { name: string; position: string; number: number; isSubstitute: boolean; avatarStorageId?: Id<'_storage'> }) => void
  generateUploadUrl: () => Promise<string>
}) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState(sportPositions[sport][0])
  const [number, setNumber] = useState(1)
  const [isSubstitute, setIsSubstitute] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) return

    setUploading(true)
    try {
      let avatarStorageId: Id<'_storage'> | undefined

      if (avatarFile) {
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': avatarFile.type },
          body: avatarFile,
        })
        const { storageId } = await result.json()
        avatarStorageId = storageId
      }

      await onCreate({ name, position, number, isSubstitute, avatarStorageId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Add New Member</h3>
        <div className="space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-400">👤</span>
                )}
              </div>
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 transition-all">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Player Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter player name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {sportPositions[sport].map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jersey Number</label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(parseInt(e.target.value))}
              min="1"
              max="99"
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              <span className="ml-2 text-sm text-gray-600">Substitute Player</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || uploading}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              {uploading ? 'Uploading...' : 'Add Member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditPlayerModal({
  editPlayer,
  sport,
  onClose,
  onSave,
  onChange,
  generateUploadUrl,
  updatePlayerAvatar
}: {
  editPlayer: EditPlayerData
  sport: Sport
  onClose: () => void
  onSave: () => void
  onChange: (data: EditPlayerData) => void
  generateUploadUrl: () => Promise<string>
  updatePlayerAvatar: (args: { playerId: Id<'players'>; avatarStorageId: Id<'_storage'> }) => Promise<any>
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const currentAvatarUrl = useQuery(
    api.teams.getAvatarUrl,
    editPlayer.avatarStorageId ? { storageId: editPlayer.avatarStorageId } : "skip"
  )

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setUploading(true)
    try {
      // Upload new avatar if selected
      if (avatarFile && editPlayer.playerId) {
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': avatarFile.type },
          body: avatarFile,
        })
        const { storageId } = await result.json()
        await updatePlayerAvatar({
          playerId: editPlayer.playerId,
          avatarStorageId: storageId
        })
      }

      await onSave()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Edit Member</h3>
        <div className="space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-400">👤</span>
                )}
              </div>
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 transition-all">
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Player Name</label>
            <input
              type="text"
              value={editPlayer.name}
              onChange={(e) => onChange({ ...editPlayer, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <select
              value={editPlayer.position}
              onChange={(e) => onChange({ ...editPlayer, position: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {sportPositions[sport].map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jersey Number</label>
            <input
              type="number"
              value={editPlayer.number}
              onChange={(e) => onChange({ ...editPlayer, number: parseInt(e.target.value) })}
              min="1"
              max="99"
              className="mt-1 block w-full rounded-md border-2 border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editPlayer.isSubstitute}
                onChange={(e) => onChange({ ...editPlayer, isSubstitute: e.target.checked })}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Substitute Player</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={uploading}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              {uploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmationModal({
  onClose,
  onConfirm
}: {
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="text-xl font-bold text-red-600">Delete Member</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete this member? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
          >
            Delete Member
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/teams')({
  component: TeamsPage,
})

