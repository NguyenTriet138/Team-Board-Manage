import { sportPositions } from '../../constants/formation.constants'
import type { EditPlayerData, Sport } from '../../types/formation.types'

interface EditPlayerModalProps {
  editPlayer: EditPlayerData
  selectedSport: Sport
  onClose: () => void
  onSave: () => void
  onChange: (data: EditPlayerData) => void
}

export function EditPlayerModal({
  editPlayer,
  selectedSport,
  onClose,
  onSave,
  onChange
}: EditPlayerModalProps) {
  return (
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
              onChange={(e) => onChange({...editPlayer, name: e.target.value})}
              className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Position
            </label>
            <select
              value={editPlayer.position}
              onChange={(e) => onChange({...editPlayer, position: e.target.value})}
              className="block w-full rounded-lg bg-[#1e293b] border border-slate-600 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            >
              {sportPositions[selectedSport].map((pos) => (
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
              onChange={(e) => onChange({...editPlayer, number: parseInt(e.target.value)})}
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
                onChange={(e) => onChange({...editPlayer, isSubstitute: e.target.checked})}
                className="rounded border-slate-600 bg-[#1e293b] text-emerald-500 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-slate-400">
                Substitute Player
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition font-medium shadow-lg shadow-emerald-500/30"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
