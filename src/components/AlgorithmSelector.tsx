import { AlgorithmKey, ALGORITHM_LABELS } from '@/lib/scheduler';
import { Cpu, Clock, Layers, Shuffle, Star, Zap } from 'lucide-react';

interface Props {
  selected: AlgorithmKey[];
  onToggle: (k: AlgorithmKey) => void;
  quantum: number;
  onQuantumChange: (q: number) => void;
}

interface AlgoMeta {
  key: AlgorithmKey;
  icon: React.ReactNode;
  desc: string;
  preemptive: boolean;
  group?: string; // visual group label
}

const ALGOS: AlgoMeta[] = [
  {
    key: 'FCFS',
    icon: <Clock className="w-4 h-4" />,
    desc: 'Non-preemptive. Processes served in arrival order.',
    preemptive: false,
    group: 'Basic',
  },
  {
    key: 'RR',
    icon: <Shuffle className="w-4 h-4" />,
    desc: 'Preemptive. Fixed time quantum per process (cyclic).',
    preemptive: true,
    group: 'Basic',
  },
  {
    key: 'SPN',
    icon: <Layers className="w-4 h-4" />,
    desc: 'Non-preemptive. Among arrived, shortest burst runs next.',
    preemptive: false,
    group: 'Shortest Job',
  },
  {
    key: 'SRTN',
    icon: <Cpu className="w-4 h-4" />,
    desc: 'Preemptive. Preempts if a shorter remaining time arrives.',
    preemptive: true,
    group: 'Shortest Job',
  },
  {
    key: 'PRIORITY',
    icon: <Star className="w-4 h-4" />,
    desc: 'Non-preemptive. Lowest priority number runs first to completion.',
    preemptive: false,
    group: 'Priority',
  },
  {
    key: 'PRIORITY_P',
    icon: <Zap className="w-4 h-4" />,
    desc: 'Preemptive. Higher-priority arrival immediately preempts CPU.',
    preemptive: true,
    group: 'Priority',
  },
];

const ALGO_COLORS: Record<AlgorithmKey, string> = {
  FCFS:       '#06b6d4',
  RR:         '#a855f7',
  SPN:        '#f59e0b',
  SRTN:       '#10b981',
  PRIORITY:   '#f43f5e',
  PRIORITY_P: '#fb923c',
};

// Group headers with labels
const GROUP_ORDER = ['Basic', 'Shortest Job', 'Priority'];

export default function AlgorithmSelector({ selected, onToggle, quantum, onQuantumChange }: Props) {
  const grouped = GROUP_ORDER.map((g) => ({
    label: g,
    algos: ALGOS.filter((a) => a.group === g),
  }));

  return (
    <div className="glass-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Scheduling Algorithms</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select algorithms to simulate (all selected by default)</p>
      </div>

      <div className="space-y-4">
        {grouped.map(({ label, algos }) => (
          <div key={label}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1.5">
              {algos.map(({ key, icon, desc, preemptive }) => {
                const active = selected.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => onToggle(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
                      active
                        ? 'border-opacity-60 bg-opacity-10'
                        : 'border-border bg-transparent opacity-50 hover:opacity-70'
                    }`}
                    style={active ? {
                      borderColor: `${ALGO_COLORS[key]}60`,
                      backgroundColor: `${ALGO_COLORS[key]}10`,
                    } : {}}
                  >
                    <span style={{ color: active ? ALGO_COLORS[key] : undefined }} className="text-muted-foreground flex-shrink-0">
                      {icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">{key}</span>
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                          style={active
                            ? { color: ALGO_COLORS[key], borderColor: `${ALGO_COLORS[key]}50`, background: `${ALGO_COLORS[key]}15` }
                            : { color: 'hsl(215 20% 52%)' }
                          }
                        >
                          {preemptive ? 'PREEMPTIVE' : 'NON-PREEMPTIVE'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${active ? 'scale-100' : 'scale-75 opacity-50'}`}
                      style={active
                        ? { borderColor: ALGO_COLORS[key], backgroundColor: ALGO_COLORS[key] }
                        : { borderColor: 'hsl(220 20% 30%)' }
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Round Robin Quantum */}
      {selected.includes('RR') && (
        <div className="pt-2 border-t border-border">
          <label className="block text-xs font-semibold text-purple mb-2 font-mono">
            ⚙️ Round Robin — Time Quantum
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={20}
              value={quantum}
              onChange={(e) => onQuantumChange(parseInt(e.target.value))}
              className="flex-1 accent-purple"
            />
            <span className="font-mono font-bold text-purple w-8 text-center">{quantum}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Each process gets {quantum} time unit(s) per turn</p>
        </div>
      )}

      {/* Legend */}
      <div className="pt-2 border-t border-border grid grid-cols-2 gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
          <span className="text-[10px] text-muted-foreground">Non-Preemptive: runs to completion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
          <span className="text-[10px] text-muted-foreground">Preemptive: can be interrupted</span>
        </div>
      </div>
    </div>
  );
}
