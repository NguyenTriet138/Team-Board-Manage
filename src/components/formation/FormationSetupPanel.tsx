import { formations, maxPlayersOnField } from '../../constants/formation.constants'
import { PlayerAvatar } from './PlayerAvatar'
import type { DragItem, Player, Team } from '../../types/formation.types'

interface FormationSetupPanelProps {
  selectedTeam: Team | null
  selectedFormation: string
  players: Array<Player> | undefined
  validationError: string | null
  draggingPlayer: DragItem | null
  onFormationChange: (formation: string) => void
  onDragStart: (player: Player) => void
  onDropOnField: (e: React.DragEvent) => void
  onDropOnBench: (e: React.DragEvent) => void
  onPlayerDoubleClick: (player: Player) => void
  onClearError: () => void
  setDraggingPlayer: (player: DragItem | null) => void
}

export function FormationSetupPanel({
  selectedTeam,
  selectedFormation,
  players,
  validationError,
  draggingPlayer,
  onFormationChange,
  onDragStart,
  onDropOnField,
  onDropOnBench,
  onPlayerDoubleClick,
  onClearError,
  setDraggingPlayer
}: FormationSetupPanelProps) {
  return (
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
                onChange={(e) => onFormationChange(e.target.value)}
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
                  onClick={onClearError}
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
              onDrop={onDropOnField}
            >
              {players?.filter(p => !p.isSubstitute).map((player) => (
                <div
                  key={player._id}
                  draggable
                  onDragStart={() => onDragStart(player)}
                  onDoubleClick={() => onPlayerDoubleClick(player)}
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
                onDrop={onDropOnBench}
              >
                {players
                  ?.filter((p) => p.isSubstitute)
                  .map((player) => (
                    <div
                      key={player._id}
                      draggable
                      onDragStart={() => onDragStart(player)}
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
  )
}
