import { useState } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'
import type { Player } from '../../types/formation.types'

interface DuplicatePlayersModalProps {
  player1: Player
  player2: Player
  duplicateNumber: number
  onClose: () => void
  onUpdate: (playerId: Id<'players'>, newNumber: number) => void
}

export function DuplicatePlayersModal({
  player1,
  player2,
  duplicateNumber,
  onClose,
  onUpdate
}: DuplicatePlayersModalProps) {
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
