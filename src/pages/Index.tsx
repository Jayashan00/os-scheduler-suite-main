import { useState, useMemo } from 'react';
import { Process, AlgorithmKey, SchedulerResult, runAllAlgorithms, pickBestAlgorithm, ALGORITHM_LABELS, ALGORITHM_SHORT, PROCESS_COLORS } from '@/lib/scheduler';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';
import Header from '@/components/Header';
import ProcessTable from '@/components/ProcessTable';
import AlgorithmSelector from '@/components/AlgorithmSelector';
import AnimatedGanttChart from '@/components/AnimatedGanttChart';
import ResultsTable from '@/components/ResultsTable';
import ComparisonDashboard from '@/components/ComparisonDashboard';
import { Button } from '@/components/ui/button';
import { Play, BarChart2, ChevronDown, ChevronUp, Info, Cpu, FileText, Sheet } from 'lucide-react';

const ALL_ALGOS: AlgorithmKey[] = ['FCFS', 'RR', 'SPN', 'SRTN', 'PRIORITY', 'PRIORITY_P'];

const ALGO_COLORS_MAP: Record<AlgorithmKey, string> = {
  FCFS:       '#06b6d4',
  RR:         '#a855f7',
  SPN:        '#f59e0b',
  SRTN:       '#10b981',
  PRIORITY:   '#f43f5e',
  PRIORITY_P: '#fb923c',
};

const DEFAULT_PROCESSES: Process[] = [
  { id: 'p1', name: 'P1', arrivalTime: 0, burstTime: 8,  priority: 3, color: PROCESS_COLORS[0] },
  { id: 'p2', name: 'P2', arrivalTime: 1, burstTime: 4,  priority: 1, color: PROCESS_COLORS[1] },
  { id: 'p3', name: 'P3', arrivalTime: 2, burstTime: 9,  priority: 4, color: PROCESS_COLORS[2] },
  { id: 'p4', name: 'P4', arrivalTime: 3, burstTime: 5,  priority: 2, color: PROCESS_COLORS[3] },
  { id: 'p5', name: 'P5', arrivalTime: 4, burstTime: 2,  priority: 5, color: PROCESS_COLORS[4] },
];

export default function Index() {
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmKey[]>(ALL_ALGOS);
  const [quantum, setQuantum] = useState(3);
  const [results, setResults] = useState<SchedulerResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'comparison'>('input');
  const [expandedAlgo, setExpandedAlgo] = useState<AlgorithmKey | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleToggleAlgo = (k: AlgorithmKey) => {
    setSelectedAlgos((prev) =>
      prev.includes(k) ? (prev.length > 1 ? prev.filter((a) => a !== k) : prev) : [...prev, k]
    );
  };

  const handleRun = () => {
    if (processes.length < 1) return;
    setIsRunning(true);
    setTimeout(() => {
      const all = runAllAlgorithms(processes, quantum);
      const filtered = all.filter((r) => selectedAlgos.includes(r.algorithm));
      setResults(filtered);
      setActiveTab('results');
      setExpandedAlgo(filtered[0]?.algorithm ?? null);
      setIsRunning(false);
    }, 200);
  };

  const best = useMemo(() => {
    if (!results || results.length === 0) return null;
    return pickBestAlgorithm(results);
  }, [results]);

  const tabs = [
    { key: 'input' as const,      label: '① Input',      icon: <Cpu className="w-3.5 h-3.5" /> },
    { key: 'results' as const,    label: '② Results',    icon: <BarChart2 className="w-3.5 h-3.5" />, disabled: !results },
    { key: 'comparison' as const, label: '③ Comparison', icon: <Info className="w-3.5 h-3.5" />, disabled: !results },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Grid background texture */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.015] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 relative">

        {/* Hero strip */}
        <div className="text-center py-8 space-y-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan/30 bg-cyan/5 text-cyan text-xs font-mono mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            Operating Systems — Task 01: CPU Scheduling
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold gradient-text">
            CPU Scheduling Simulator
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Simulate FCFS, Round Robin, SPN, SRTN and Priority Scheduling — with Gantt charts, metrics and comparison.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 glass-card w-fit mx-auto rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              disabled={t.disabled}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === t.key
                  ? 'bg-primary text-primary-foreground shadow-glow-cyan'
                  : 'text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── INPUT TAB ───────────────────────────────────────── */}
        {activeTab === 'input' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProcessTable processes={processes} onChange={setProcesses} />
              </div>
              <div>
                <AlgorithmSelector
                  selected={selectedAlgos}
                  onToggle={handleToggleAlgo}
                  quantum={quantum}
                  onQuantumChange={setQuantum}
                />
              </div>
            </div>

            {/* Run button */}
            <div className="flex justify-center">
              <Button
                onClick={handleRun}
                disabled={processes.length === 0 || isRunning}
                size="lg"
                className="gap-3 px-10 py-6 text-base font-bold rounded-xl bg-gradient-primary text-primary-foreground shadow-glow-cyan hover:shadow-glow-cyan hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                {isRunning ? 'Simulating…' : `Run ${selectedAlgos.length} Algorithm${selectedAlgos.length > 1 ? 's' : ''}`}
              </Button>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {ALL_ALGOS.map((a) => {
                const isPreemptive = ['RR', 'SRTN', 'PRIORITY_P'].includes(a);
                return (
                  <div key={a} className="glass-card p-3 text-center border-t-2" style={{ borderColor: `${ALGO_COLORS_MAP[a]}50` }}>
                    <div className="font-mono font-bold text-sm" style={{ color: ALGO_COLORS_MAP[a] }}>{a}</div>
                    <div className={`text-[9px] font-semibold mt-0.5 ${isPreemptive ? 'text-warning' : 'text-success'}`}>
                      {isPreemptive ? 'Preemptive' : 'Non-Preemptive'}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {a === 'FCFS'       && 'Arrival order'}
                      {a === 'RR'         && `Quantum = ${quantum}`}
                      {a === 'SPN'        && 'Shortest burst'}
                      {a === 'SRTN'       && 'Shortest remaining'}
                      {a === 'PRIORITY'   && 'Priority, no preempt'}
                      {a === 'PRIORITY_P' && 'Priority, preempts'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESULTS TAB ─────────────────────────────────────── */}
        {activeTab === 'results' && results && (
          <div className="space-y-4 animate-fade-in">
            {results.map((r) => (
              <div key={r.algorithm} className="glass-card overflow-hidden">
                {/* Algo header */}
                <button
                  onClick={() => setExpandedAlgo(expandedAlgo === r.algorithm ? null : r.algorithm)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: ALGO_COLORS_MAP[r.algorithm], boxShadow: `0 0 8px ${ALGO_COLORS_MAP[r.algorithm]}80` }}
                    />
                    <span className="font-mono font-bold text-foreground">{r.algorithm}</span>
                    <span className="text-sm text-muted-foreground">{ALGORITHM_LABELS[r.algorithm]}</span>
                    {best?.best.algorithm === r.algorithm && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30">
                        🏆 BEST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                    <span>WT: <span className="text-cyan font-semibold">{r.avgWaitingTime.toFixed(2)}</span></span>
                    <span>TAT: <span className="text-gold font-semibold">{r.avgTurnaroundTime.toFixed(2)}</span></span>
                    {expandedAlgo === r.algorithm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedAlgo === r.algorithm && (
                  <div className="px-5 pb-5 space-y-5 border-t border-border">
                    {/* Gantt */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-3">
                        Gantt Chart — Step-by-Step Animation
                      </h3>
                      <AnimatedGanttChart gantt={r.gantt} algorithm={r.algorithm} />
                    </div>

                    {/* Results */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Process Metrics
                      </h3>
                      <ResultsTable
                        results={r.results}
                        algorithm={r.algorithm}
                        avgWT={r.avgWaitingTime}
                        avgTAT={r.avgTurnaroundTime}
                        avgRT={r.avgResponseTime}
                        cpuUtil={r.cpuUtilization}
                        throughput={r.throughput}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                onClick={() => setActiveTab('comparison')}
                className="gap-2 bg-gradient-accent text-white font-bold px-8 py-5 rounded-xl hover:scale-105 transition-all"
              >
                <BarChart2 className="w-4 h-4" />
                View Full Comparison →
              </Button>
              <Button
                variant="outline"
                onClick={() => best && exportToPDF(results, best.best.algorithm, quantum)}
                className="gap-2 px-6 py-5 rounded-xl border-rose/40 text-rose hover:bg-rose/10 hover:scale-105 transition-all font-bold"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => best && exportToExcel(results, best.best.algorithm, quantum)}
                className="gap-2 px-6 py-5 rounded-xl border-success/40 text-success hover:bg-success/10 hover:scale-105 transition-all font-bold"
              >
                <Sheet className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>
        )}

        {/* ── COMPARISON TAB ──────────────────────────────────── */}
        {activeTab === 'comparison' && results && best && (
          <div className="animate-fade-in space-y-4">
            <ComparisonDashboard
              results={results}
              bestAlgo={best.best.algorithm}
              bestReason={best.reason}
            />
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => exportToPDF(results, best.best.algorithm, quantum)}
                className="gap-2 px-6 py-4 rounded-xl border-rose/40 text-rose hover:bg-rose/10 hover:scale-105 transition-all font-bold"
              >
                <FileText className="w-4 h-4" />
                Export Full Report as PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => exportToExcel(results, best.best.algorithm, quantum)}
                className="gap-2 px-6 py-4 rounded-xl border-success/40 text-success hover:bg-success/10 hover:scale-105 transition-all font-bold"
              >
                <Sheet className="w-4 h-4" />
                Export Full Report as Excel
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          University of Jaffna · Faculty of Engineering · EC 6110: Operating Systems · Group Assignment 2026
        </p>
      </footer>
    </div>
  );
}
