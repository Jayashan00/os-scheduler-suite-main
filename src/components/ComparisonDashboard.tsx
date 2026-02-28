import { SchedulerResult, AlgorithmKey, ALGORITHM_LABELS } from '@/lib/scheduler';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

interface Props {
  results: SchedulerResult[];
  bestAlgo: AlgorithmKey;
  bestReason: string;
}

export const ALGO_COLORS: Record<AlgorithmKey, string> = {
  FCFS:       '#06b6d4',
  RR:         '#a855f7',
  SPN:        '#f59e0b',
  SRTN:       '#10b981',
  PRIORITY:   '#f43f5e',
  PRIORITY_P: '#fb923c',
};

export const SHORT: Record<AlgorithmKey, string> = {
  FCFS:       'FCFS',
  RR:         'RR',
  SPN:        'SPN',
  SRTN:       'SRTN',
  PRIORITY:   'Pri-NP',
  PRIORITY_P: 'Pri-P',
};

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(220 28% 10%)',
  border: '1px solid hsl(220 20% 18%)',
  borderRadius: '8px',
  color: 'hsl(210 40% 96%)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '12px',
};

export default function ComparisonDashboard({ results, bestAlgo, bestReason }: Props) {
  const barData = results.map((r) => ({
    name:      SHORT[r.algorithm],
    algo:      r.algorithm,
    'Avg WT':  parseFloat(r.avgWaitingTime.toFixed(2)),
    'Avg TAT': parseFloat(r.avgTurnaroundTime.toFixed(2)),
    'Avg RT':  parseFloat(r.avgResponseTime.toFixed(2)),
  }));

  const radarData = [
    { metric: 'Low WT',    ...Object.fromEntries(results.map((r) => [SHORT[r.algorithm], 1 / (r.avgWaitingTime + 0.01)])) },
    { metric: 'Low TAT',   ...Object.fromEntries(results.map((r) => [SHORT[r.algorithm], 1 / (r.avgTurnaroundTime + 0.01)])) },
    { metric: 'CPU Util',  ...Object.fromEntries(results.map((r) => [SHORT[r.algorithm], r.cpuUtilization / 100])) },
    { metric: 'Low RT',    ...Object.fromEntries(results.map((r) => [SHORT[r.algorithm], 1 / (r.avgResponseTime + 0.01)])) },
    { metric: 'Throughput',...Object.fromEntries(results.map((r) => [SHORT[r.algorithm], r.throughput * 10])) },
  ];

  return (
    <div className="space-y-6">
      {/* Best Algorithm Banner */}
      <div className="neon-border rounded-xl p-5 bg-cyan/5">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🏆</div>
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1">Recommended Algorithm</div>
            <div className="text-2xl font-bold text-foreground">{ALGORITHM_LABELS[bestAlgo]}</div>
            <div className="text-sm text-muted-foreground mt-1">{bestReason}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {results.map((r) => (
                <span
                  key={r.algorithm}
                  className={`algo-badge ${r.algorithm === bestAlgo ? 'bg-cyan/10' : 'opacity-50'}`}
                  style={{ color: ALGO_COLORS[r.algorithm] }}
                >
                  {SHORT[r.algorithm]}
                  <span className="text-muted-foreground ml-1">WT:{r.avgWaitingTime.toFixed(1)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <h3 className="font-semibold text-sm text-foreground">Algorithm Comparison Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Algorithm</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Mode</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-cyan uppercase">Avg WT</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gold uppercase">Avg TAT</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-purple uppercase">Avg RT</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-success uppercase">CPU Util</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-warning uppercase">Throughput</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const isPreemptive = ['RR', 'SRTN', 'PRIORITY_P'].includes(r.algorithm);
                return (
                  <tr
                    key={r.algorithm}
                    className={`border-b border-border/50 transition-colors ${r.algorithm === bestAlgo ? 'bg-cyan/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: ALGO_COLORS[r.algorithm], boxShadow: `0 0 6px ${ALGO_COLORS[r.algorithm]}80` }}
                        />
                        <span className="font-mono font-bold text-foreground">{SHORT[r.algorithm]}</span>
                        {r.algorithm === bestAlgo && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan/20 text-cyan">BEST</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 pl-4">{ALGORITHM_LABELS[r.algorithm]}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isPreemptive
                          ? 'text-warning border-warning/40 bg-warning/10'
                          : 'text-success border-success/40 bg-success/10'
                      }`}>
                        {isPreemptive ? 'PREEMPTIVE' : 'NON-PREEMPTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-cyan font-semibold">{r.avgWaitingTime.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gold font-semibold">{r.avgTurnaroundTime.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-purple font-semibold">{r.avgResponseTime.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-success font-semibold">{r.cpuUtilization.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-mono text-warning font-semibold">{r.throughput.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Average Times Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(215 20% 52%)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: 'hsl(215 20% 52%)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="Avg WT"  fill="#06b6d4" radius={[4,4,0,0]} />
              <Bar dataKey="Avg TAT" fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="Avg RT"  fill="#a855f7" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm text-foreground mb-1">Performance Radar</h3>
          <p className="text-xs text-muted-foreground mb-3">Higher value = better (metrics inverted for comparison)</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220 20% 18%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215 20% 52%)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              {results.map((r) => (
                <Radar
                  key={r.algorithm}
                  name={SHORT[r.algorithm]}
                  dataKey={SHORT[r.algorithm]}
                  stroke={ALGO_COLORS[r.algorithm]}
                  fill={ALGO_COLORS[r.algorithm]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Preemptive vs Non-Preemptive insight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 border-t-2 border-success/40">
          <div className="text-xs font-bold uppercase tracking-wider text-success mb-2">Non-Preemptive Algorithms</div>
          {results.filter((r) => !['RR','SRTN','PRIORITY_P'].includes(r.algorithm)).map((r) => (
            <div key={r.algorithm} className="flex justify-between items-center py-1 text-xs font-mono">
              <span className="text-foreground">{SHORT[r.algorithm]}</span>
              <span className="text-cyan">WT: {r.avgWaitingTime.toFixed(2)} | TAT: {r.avgTurnaroundTime.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="glass-card p-4 border-t-2 border-warning/40">
          <div className="text-xs font-bold uppercase tracking-wider text-warning mb-2">Preemptive Algorithms</div>
          {results.filter((r) => ['RR','SRTN','PRIORITY_P'].includes(r.algorithm)).map((r) => (
            <div key={r.algorithm} className="flex justify-between items-center py-1 text-xs font-mono">
              <span className="text-foreground">{SHORT[r.algorithm]}</span>
              <span className="text-cyan">WT: {r.avgWaitingTime.toFixed(2)} | TAT: {r.avgTurnaroundTime.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
