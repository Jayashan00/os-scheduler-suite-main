import { GanttEntry } from '@/lib/scheduler';
import { AlgorithmKey, ALGORITHM_SHORT } from '@/lib/scheduler';

interface Props {
  gantt: GanttEntry[];
  algorithm: AlgorithmKey;
}

export default function GanttChart({ gantt, algorithm }: Props) {
  if (gantt.length === 0) return null;

  const totalTime   = gantt[gantt.length - 1].end;
  const startTime   = gantt[0].start;
  const span        = totalTime - startTime;

  // Collect unique time markers
  const markers = [...new Set([...gantt.map((g) => g.start), totalTime])].sort((a, b) => a - b);

  return (
    <div className="space-y-2">
      {/* Bars */}
      <div className="relative overflow-x-auto">
        <div
          className="relative flex items-center gap-0"
          style={{ minWidth: `${Math.max(span * 20, 400)}px`, height: '44px' }}
        >
          {gantt.map((entry, i) => {
            const width = ((entry.end - entry.start) / span) * 100;
            const left  = ((entry.start - startTime) / span) * 100;
            return (
              <div
                key={i}
                className="gantt-bar absolute group"
                style={{
                  left:    `${left}%`,
                  width:   `${width}%`,
                  background: entry.color,
                  boxShadow: `0 2px 8px ${entry.color}60`,
                }}
                title={`${entry.processName}: ${entry.start} → ${entry.end} (${entry.end - entry.start} units)`}
              >
                <span className="truncate px-1">{entry.processName}</span>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-card border border-border rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-card">
                  {entry.processName}: [{entry.start}→{entry.end}] = {entry.end - entry.start}u
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline markers */}
        <div
          className="relative mt-1"
          style={{ minWidth: `${Math.max(span * 20, 400)}px`, height: '20px' }}
        >
          {markers.map((t) => {
            const left = ((t - startTime) / span) * 100;
            return (
              <div
                key={t}
                className="absolute flex flex-col items-center"
                style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-2 bg-border" />
                <span className="text-[9px] font-mono text-muted-foreground">{t}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
