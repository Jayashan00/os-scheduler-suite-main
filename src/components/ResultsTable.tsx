import { ProcessResult, AlgorithmKey, ALGORITHM_LABELS } from '@/lib/scheduler';

interface Props {
  results: ProcessResult[];
  algorithm: AlgorithmKey;
  avgWT: number;
  avgTAT: number;
  avgRT: number;
  cpuUtil: number;
  throughput: number;
}

export default function ResultsTable({ results, algorithm, avgWT, avgTAT, avgRT, cpuUtil, throughput }: Props) {
  return (
    <div className="space-y-4">
      {/* Metrics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Avg Waiting Time"      value={avgWT.toFixed(2)}        unit="ms" color="cyan" />
        <MetricCard label="Avg Turnaround Time"   value={avgTAT.toFixed(2)}       unit="ms" color="gold" />
        <MetricCard label="Avg Response Time"     value={avgRT.toFixed(2)}        unit="ms" color="purple" />
        <MetricCard label="CPU Utilization"       value={cpuUtil.toFixed(1)}      unit="%" color="success" />
        <MetricCard label="Throughput"            value={throughput.toFixed(4)}   unit="p/u" color="warning" />
      </div>

      {/* Per-process table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm data-table">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Process','AT','BT','Priority','CT','TAT','WT','RT'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.processId} className="border-b border-border/50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="process-dot flex-shrink-0"
                      style={{ background: r.color, boxShadow: `0 0 6px ${r.color}80` }}
                    />
                    <span className="font-mono font-bold text-foreground">{r.processName}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono text-cyan">{r.arrivalTime}</td>
                <td className="px-4 py-2.5 font-mono text-gold">{r.burstTime}</td>
                <td className="px-4 py-2.5 font-mono text-purple">{r.priority}</td>
                <td className="px-4 py-2.5 font-mono text-foreground">{r.completionTime}</td>
                <td className="px-4 py-2.5 font-mono text-success font-semibold">{r.turnaroundTime}</td>
                <td className="px-4 py-2.5 font-mono text-warning font-semibold">{r.waitingTime}</td>
                <td className="px-4 py-2.5 font-mono text-pink">{r.responseTime}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/20">
              <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Average</td>
              <td className="px-4 py-2.5 font-mono text-success font-bold">{avgTAT.toFixed(2)}</td>
              <td className="px-4 py-2.5 font-mono text-warning font-bold">{avgWT.toFixed(2)}</td>
              <td className="px-4 py-2.5 font-mono text-pink font-bold">{avgRT.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-xs text-muted-foreground font-mono grid grid-cols-2 sm:grid-cols-4 gap-1">
        <span>AT = Arrival Time</span>
        <span>BT = Burst Time</span>
        <span>CT = Completion Time</span>
        <span>TAT = Turnaround Time</span>
        <span>WT = Waiting Time</span>
        <span>RT = Response Time</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan:    'text-cyan',
    gold:    'text-gold',
    purple:  'text-purple',
    success: 'text-success',
    warning: 'text-warning',
    pink:    'text-pink',
  };

  const borderMap: Record<string, string> = {
    cyan:    'border-cyan/50',
    gold:    'border-gold/50',
    purple:  'border-purple/50',
    success: 'border-success/50',
    warning: 'border-warning/50',
    pink:    'border-pink/50',
  };

  return (
    <div className={`glass-card p-3 text-center border-t-2 ${borderMap[color] ?? 'border-border'}`}>
      <div className={`text-xl font-bold font-mono ${colorMap[color] ?? 'text-foreground'}`}>
        {value}
        <span className="text-xs ml-0.5 text-muted-foreground">{unit}</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
