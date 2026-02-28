import React, { useState, useCallback } from 'react';
import { Process, PROCESS_COLORS } from '@/lib/scheduler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, RefreshCw, Upload } from 'lucide-react';

interface Props {
  processes: Process[];
  onChange: (p: Process[]) => void;
}

const SAMPLE_PROCESSES: Omit<Process, 'id' | 'color'>[] = [
  { name: 'P1', arrivalTime: 0, burstTime: 8,  priority: 3 },
  { name: 'P2', arrivalTime: 1, burstTime: 4,  priority: 1 },
  { name: 'P3', arrivalTime: 2, burstTime: 9,  priority: 4 },
  { name: 'P4', arrivalTime: 3, burstTime: 5,  priority: 2 },
  { name: 'P5', arrivalTime: 4, burstTime: 2,  priority: 5 },
];

let _counter = 6;
function nextId() { return `p${_counter++}`; }

export default function ProcessTable({ processes, onChange }: Props) {
  const [newRow, setNewRow] = useState({ name: '', arrivalTime: '', burstTime: '', priority: '' });

  const addProcess = useCallback(() => {
    const at = parseInt(newRow.arrivalTime);
    const bt = parseInt(newRow.burstTime);
    const pr = parseInt(newRow.priority) || 1;
    if (isNaN(at) || isNaN(bt) || bt <= 0 || !newRow.name.trim()) return;

    const id    = nextId();
    const color = PROCESS_COLORS[processes.length % PROCESS_COLORS.length];
    onChange([...processes, { id, name: newRow.name.trim(), arrivalTime: at, burstTime: bt, priority: pr, color }]);
    setNewRow({ name: '', arrivalTime: '', burstTime: '', priority: '' });
  }, [newRow, processes, onChange]);

  const updateCell = (idx: number, field: keyof Process, val: string) => {
    const updated = [...processes];
    if (field === 'name') {
      updated[idx] = { ...updated[idx], name: val };
    } else {
      const num = parseInt(val);
      if (!isNaN(num)) updated[idx] = { ...updated[idx], [field]: num };
    }
    onChange(updated);
  };

  const removeProcess = (idx: number) => {
    onChange(processes.filter((_, i) => i !== idx));
  };

  const loadSample = () => {
    const sample = SAMPLE_PROCESSES.map((p, i) => ({
      ...p,
      id:    `p${i + 1}`,
      color: PROCESS_COLORS[i % PROCESS_COLORS.length],
    }));
    _counter = sample.length + 1;
    onChange(sample);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addProcess();
  };

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Process Table</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {processes.length} process{processes.length !== 1 ? 'es' : ''} loaded
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSample} className="gap-2 text-xs">
            <Upload className="w-3 h-3" />
            Sample Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([])}
            className="gap-2 text-xs text-danger border-danger/30 hover:bg-danger/10"
          >
            <RefreshCw className="w-3 h-3" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm data-table">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Process</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arrival Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Burst Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, i) => (
              <tr key={p.id} className="border-b border-border/50 transition-colors">
                <td className="px-4 py-2.5">
                  <span
                    className="process-dot"
                    style={{ background: p.color, boxShadow: `0 0 6px ${p.color}80` }}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    value={p.name}
                    onChange={(e) => updateCell(i, 'name', e.target.value)}
                    className="font-mono font-bold text-foreground bg-transparent border-none outline-none w-16 focus:border-b focus:border-cyan"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    value={p.arrivalTime}
                    min={0}
                    onChange={(e) => updateCell(i, 'arrivalTime', e.target.value)}
                    className="font-mono text-cyan bg-transparent border-none outline-none w-16 focus:border-b focus:border-cyan"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    value={p.burstTime}
                    min={1}
                    onChange={(e) => updateCell(i, 'burstTime', e.target.value)}
                    className="font-mono text-gold bg-transparent border-none outline-none w-16"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    value={p.priority}
                    min={1}
                    onChange={(e) => updateCell(i, 'priority', e.target.value)}
                    className="font-mono text-purple bg-transparent border-none outline-none w-16"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => removeProcess(i)}
                    className="text-muted-foreground hover:text-danger transition-colors p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Add row */}
            <tr className="border-t-2 border-dashed border-border/60 bg-muted/10">
              <td className="px-4 py-3 text-muted-foreground text-xs font-mono">new</td>
              <td className="px-4 py-3">
                <input
                  placeholder="P6"
                  value={newRow.name}
                  onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="font-mono font-bold bg-transparent border-b border-border outline-none w-16 text-sm text-foreground focus:border-cyan placeholder:text-muted-foreground/40"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  placeholder="0"
                  value={newRow.arrivalTime}
                  onChange={(e) => setNewRow({ ...newRow, arrivalTime: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="font-mono bg-transparent border-b border-border outline-none w-16 text-sm text-cyan focus:border-cyan placeholder:text-muted-foreground/40"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  placeholder="5"
                  value={newRow.burstTime}
                  onChange={(e) => setNewRow({ ...newRow, burstTime: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="font-mono bg-transparent border-b border-border outline-none w-16 text-sm text-gold focus:border-gold placeholder:text-muted-foreground/40"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  placeholder="1"
                  value={newRow.priority}
                  onChange={(e) => setNewRow({ ...newRow, priority: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="font-mono bg-transparent border-b border-border outline-none w-16 text-sm text-purple focus:border-purple placeholder:text-muted-foreground/40"
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={addProcess}
                  className="text-cyan hover:text-cyan/80 transition-colors p-1 rounded"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {processes.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p>No processes added. Use the row above or load sample data.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 <strong>Priority:</strong> Lower number = higher priority (1 is highest). Press <kbd className="font-mono bg-muted px-1 rounded text-xs">Enter</kbd> to add a row quickly.
      </p>
    </div>
  );
}
