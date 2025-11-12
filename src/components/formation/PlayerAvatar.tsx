import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Player } from '../../types/formation.types'

interface PlayerAvatarProps {
  player: Player
}

export function PlayerAvatar({ player }: PlayerAvatarProps) {
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
