import type { Team } from '../../types/formation.types'

interface TeamSelectionPanelProps {
  teams: Array<Team> | undefined
  selectedTeam: Team | null
  onSelectTeam: (team: Team) => void
}

export function TeamSelectionPanel({
  teams,
  selectedTeam,
  onSelectTeam
}: TeamSelectionPanelProps) {
  return (
    <div className="w-1/3">
      <div className="bg-[#0f172a] rounded-lg shadow-xl p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Select Team</h2>

        <div className="space-y-2">
          {teams?.map((team) => (
            <button
              key={team._id}
              onClick={() => onSelectTeam(team)}
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
  )
}
