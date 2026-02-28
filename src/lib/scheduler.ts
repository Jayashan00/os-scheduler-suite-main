// ─── Types ───────────────────────────────────────────────────────────────────

export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number; // lower number = higher priority
  color: string;
}

export interface GanttEntry {
  processId: string;
  processName: string;
  start: number;
  end: number;
  color: string;
}

export interface ProcessResult {
  processId: string;
  processName: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  color: string;
}

export interface SchedulerResult {
  algorithm: AlgorithmKey;
  gantt: GanttEntry[];
  results: ProcessResult[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
}

export type AlgorithmKey = 'FCFS' | 'RR' | 'SPN' | 'SRTN' | 'PRIORITY' | 'PRIORITY_P';

export const ALGORITHM_LABELS: Record<AlgorithmKey, string> = {
  FCFS:       'First Come First Served',
  RR:         'Round Robin',
  SPN:        'Shortest Process Next',
  SRTN:       'Shortest Remaining Time Next',
  PRIORITY:   'Priority Scheduling (Non-Preemptive)',
  PRIORITY_P: 'Priority Scheduling (Preemptive)',
};

export const ALGORITHM_SHORT: Record<AlgorithmKey, string> = {
  FCFS:       'FCFS',
  RR:         'RR',
  SPN:        'SPN',
  SRTN:       'SRTN',
  PRIORITY:   'Priority-NP',
  PRIORITY_P: 'Priority-P',
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function buildResults(
  processes: Process[],
  completionTimes: Record<string, number>,
  responseTimes: Record<string, number>,
): ProcessResult[] {
  return processes.map((p) => {
    const ct  = completionTimes[p.id];
    const tat = ct - p.arrivalTime;
    const wt  = tat - p.burstTime;
    const rt  = responseTimes[p.id] - p.arrivalTime;
    return {
      processId:      p.id,
      processName:    p.name,
      arrivalTime:    p.arrivalTime,
      burstTime:      p.burstTime,
      priority:       p.priority,
      completionTime: ct,
      turnaroundTime: tat,
      waitingTime:    Math.max(0, wt),
      responseTime:   Math.max(0, rt),
      color:          p.color,
    };
  });
}

function calcStats(results: ProcessResult[], gantt: GanttEntry[], processes: Process[]) {
  const n                 = results.length;
  const avgWaitingTime    = results.reduce((s, r) => s + r.waitingTime, 0) / n;
  const avgTurnaroundTime = results.reduce((s, r) => s + r.turnaroundTime, 0) / n;
  const avgResponseTime   = results.reduce((s, r) => s + r.responseTime, 0) / n;
  const totalBurst        = processes.reduce((s, p) => s + p.burstTime, 0);
  const span              = gantt.length ? gantt[gantt.length - 1].end - gantt[0].start : 1;
  const cpuUtilization    = Math.min(100, (totalBurst / span) * 100);
  const throughput        = n / span;
  return { avgWaitingTime, avgTurnaroundTime, avgResponseTime, cpuUtilization, throughput };
}

// ─── FCFS (Non-Preemptive) ───────────────────────────────────────────────────
// Processes are executed in arrival order; ties broken by process id.

export function fcfs(processes: Process[]): SchedulerResult {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  const gantt: GanttEntry[] = [];
  const completionTimes: Record<string, number> = {};
  const responseTimes:   Record<string, number> = {};
  let time = 0;

  for (const p of sorted) {
    if (time < p.arrivalTime) time = p.arrivalTime; // CPU idle gap
    responseTimes[p.id] = time;
    gantt.push({ processId: p.id, processName: p.name, start: time, end: time + p.burstTime, color: p.color });
    time += p.burstTime;
    completionTimes[p.id] = time;
  }

  const results = buildResults(processes, completionTimes, responseTimes);
  const stats   = calcStats(results, gantt, processes);
  return { algorithm: 'FCFS', gantt, results, ...stats };
}

// ─── Round Robin (Preemptive) ─────────────────────────────────────────────────
// Each process gets at most `quantum` CPU units per turn in circular order.

export function roundRobin(processes: Process[], quantum: number): SchedulerResult {
  const remaining: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  processes.forEach((p) => { remaining[p.id] = p.burstTime; });

  const queue: Process[] = [];
  const arrived = new Set<string>();
  let time = 0;
  const gantt: GanttEntry[] = [];

  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  let idx = 0;

  // Enqueue all processes that have arrived at time 0
  while (idx < sorted.length && sorted[idx].arrivalTime <= time) {
    queue.push(sorted[idx]);
    arrived.add(sorted[idx].id);
    idx++;
  }

  while (queue.length > 0 || idx < sorted.length) {
    if (queue.length === 0) {
      // CPU idle — jump to next arrival
      time = sorted[idx].arrivalTime;
      while (idx < sorted.length && sorted[idx].arrivalTime <= time) {
        if (!arrived.has(sorted[idx].id)) {
          queue.push(sorted[idx]);
          arrived.add(sorted[idx].id);
        }
        idx++;
      }
    }

    const p = queue.shift()!;
    if (firstResponse[p.id] === undefined) firstResponse[p.id] = time;

    const exec = Math.min(quantum, remaining[p.id]);
    gantt.push({ processId: p.id, processName: p.name, start: time, end: time + exec, color: p.color });
    time += exec;
    remaining[p.id] -= exec;

    // Enqueue newly arrived processes BEFORE re-queuing current (if not done)
    while (idx < sorted.length && sorted[idx].arrivalTime <= time) {
      if (!arrived.has(sorted[idx].id)) {
        queue.push(sorted[idx]);
        arrived.add(sorted[idx].id);
      }
      idx++;
    }

    if (remaining[p.id] > 0) {
      queue.push(p); // re-queue at back
    } else {
      completionTimes[p.id] = time;
    }
  }

  const results = buildResults(processes, completionTimes, firstResponse);
  const stats   = calcStats(results, gantt, processes);
  return { algorithm: 'RR', gantt, results, ...stats };
}

// ─── SPN — Shortest Process Next (Non-Preemptive SJF) ───────────────────────
// Among all arrived processes, pick the one with the shortest burst time.
// Once selected, runs to completion without preemption.

export function spn(processes: Process[]): SchedulerResult {
  const remaining = new Set(processes.map((p) => p.id));
  const completionTimes: Record<string, number> = {};
  const responseTimes:   Record<string, number> = {};
  const gantt: GanttEntry[] = [];
  let time = 0;

  while (remaining.size > 0) {
    const available = processes.filter((p) => remaining.has(p.id) && p.arrivalTime <= time);

    if (available.length === 0) {
      // Jump to next arriving process
      const next = processes
        .filter((p) => remaining.has(p.id))
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      time = next.arrivalTime;
      continue;
    }

    // Pick shortest burst; ties: earlier arrival, then id
    available.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const p = available[0];
    responseTimes[p.id] = time;
    gantt.push({ processId: p.id, processName: p.name, start: time, end: time + p.burstTime, color: p.color });
    time += p.burstTime;
    completionTimes[p.id] = time;
    remaining.delete(p.id);
  }

  const results = buildResults(processes, completionTimes, responseTimes);
  const stats   = calcStats(results, gantt, processes);
  return { algorithm: 'SPN', gantt, results, ...stats };
}

// ─── SRTN — Shortest Remaining Time Next (Preemptive SJF) ────────────────────
// At every arrival event, pick the process with the least remaining burst time.
// Preempts if a newly arrived process has a shorter remaining time.

export function srtn(processes: Process[]): SchedulerResult {
  const remaining: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  processes.forEach((p) => { remaining[p.id] = p.burstTime; });

  const gantt: GanttEntry[] = [];
  let time = 0;
  const done = new Set<string>();

  // Key time points: all arrival times
  const arrivals = [...new Set(processes.map((p) => p.arrivalTime))].sort((a, b) => a - b);
  const maxTime  = processes.reduce((s, p) => s + p.burstTime, 0)
                 + Math.max(...processes.map((p) => p.arrivalTime));

  while (done.size < processes.length && time <= maxTime) {
    const available = processes.filter(
      (p) => !done.has(p.id) && p.arrivalTime <= time && remaining[p.id] > 0
    );

    if (available.length === 0) {
      const nextArrival = processes
        .filter((p) => !done.has(p.id) && p.arrivalTime > time)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (!nextArrival) break;
      time = nextArrival.arrivalTime;
      continue;
    }

    // Pick process with shortest remaining time; ties: earliest arrival, then id
    available.sort((a, b) =>
      remaining[a.id] - remaining[b.id] || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id)
    );
    const p = available[0];

    if (firstResponse[p.id] === undefined) firstResponse[p.id] = time;

    // Run until: next arrival OR this process completes
    const nextArrivalTime = processes
      .filter((q) => !done.has(q.id) && q.arrivalTime > time)
      .map((q) => q.arrivalTime)
      .sort((a, b) => a - b)[0] ?? Infinity;

    const runUntil = Math.min(time + remaining[p.id], nextArrivalTime);
    const exec     = runUntil - time;

    // Merge consecutive entries for the same process
    if (gantt.length > 0 && gantt[gantt.length - 1].processId === p.id) {
      gantt[gantt.length - 1].end = runUntil;
    } else {
      gantt.push({ processId: p.id, processName: p.name, start: time, end: runUntil, color: p.color });
    }

    remaining[p.id] -= exec;
    time = runUntil;

    if (remaining[p.id] <= 0) {
      done.add(p.id);
      completionTimes[p.id] = time;
    }
  }

  const results = buildResults(processes, completionTimes, firstResponse);
  const stats   = calcStats(results, gantt, processes);
  return { algorithm: 'SRTN', gantt, results, ...stats };
}

// ─── Priority Scheduling — Non-Preemptive ────────────────────────────────────
// Among arrived processes, pick the highest priority (lowest number).
// Once selected, runs to full completion without preemption.

export function priorityNonPreemptive(processes: Process[]): SchedulerResult {
  const remaining = new Set(processes.map((p) => p.id));
  const completionTimes: Record<string, number> = {};
  const responseTimes:   Record<string, number> = {};
  const gantt: GanttEntry[] = [];
  let time = 0;

  while (remaining.size > 0) {
    const available = processes.filter((p) => remaining.has(p.id) && p.arrivalTime <= time);

    if (available.length === 0) {
      const next = processes
        .filter((p) => remaining.has(p.id))
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      time = next.arrivalTime;
      continue;
    }

    // Pick highest priority (lowest number); ties: earliest arrival, then burst
    available.sort((a, b) =>
      a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.burstTime - b.burstTime
    );
    const p = available[0];
    responseTimes[p.id] = time;
    gantt.push({ processId: p.id, processName: p.name, start: time, end: time + p.burstTime, color: p.color });
    time += p.burstTime;
    completionTimes[p.id] = time;
    remaining.delete(p.id);
  }

  const results = buildResults(processes, completionTimes, responseTimes);
  const stats   = calcStats(results, gantt, processes);
  return { algorithm: 'PRIORITY', gantt, results, ...stats };
}

// ─── Priority Scheduling — Preemptive ────────────────────────────────────────
// At every arrival event, the process with the highest priority (lowest number)
// preempts the CPU. If a newly arrived process has higher priority, it runs first.

export function priorityPreemptive(processes: Process[]): SchedulerResult {
  const remaining: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  processes.forEach((p) => { remaining[p.id] = p.burstTime; });

  const gantt: GanttEntry[] = [];
  let time = 0;
  const done = new Set<string>();

  const maxTime = processes.reduce((s, p) => s + p.burstTime, 0)
                + Math.max(...processes.map((p) => p.arrivalTime));

  while (done.size < processes.length && time <= maxTime) {
    const available = processes.filter(
      (p) => !done.has(p.id) && p.arrivalTime <= time && remaining[p.id] > 0
    );

    if (available.length === 0) {
      const nextArrival = processes
        .filter((p) => !done.has(p.id) && p.arrivalTime > time)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (!nextArrival) break;
      time = nextArrival.arrivalTime;
      continue;
    }

    // Pick highest priority (lowest number); ties: earliest arrival, then id
    available.sort((a, b) =>
      a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id)
    );
    const p = available[0];

    if (firstResponse[p.id] === undefined) firstResponse[p.id] = time;

    // Run until: next arrival OR this process completes
    const nextArrivalTime = processes
      .filter((q) => !done.has(q.id) && q.arrivalTime > time)
      .map((q) => q.arrivalTime)
      .sort((a, b) => a - b)[0] ?? Infinity;

    const runUntil = Math.min(time + remaining[p.id], nextArrivalTime);
    const exec     = runUntil - time;

    // Merge consecutive entries for the same process
    if (gantt.length > 0 && gantt[gantt.length - 1].processId === p.id) {
      gantt[gantt.length - 1].end = runUntil;
    } else {
      gantt.push({ processId: p.id, processName: p.name, start: time, end: runUntil, color: p.color });
    }

    remaining[p.id] -= exec;
    time = runUntil;

    if (remaining[p.id] <= 0) {
      done.add(p.id);
      completionTimes[p.id] = time;
    }
  }

  const results = buildResults(processes, completionTimes, firstResponse);
  const stats   = calcStats(results, gantt, processes);
  return { algorithm: 'PRIORITY_P', gantt, results, ...stats };
}

// ─── Run All ─────────────────────────────────────────────────────────────────

export function runAllAlgorithms(processes: Process[], quantum: number): SchedulerResult[] {
  return [
    fcfs(processes),
    roundRobin(processes, quantum),
    spn(processes),
    srtn(processes),
    priorityNonPreemptive(processes),
    priorityPreemptive(processes),
  ];
}

// ─── Best Algorithm Picker ────────────────────────────────────────────────────

export function pickBestAlgorithm(results: SchedulerResult[]): {
  best: SchedulerResult;
  reason: string;
} {
  // Weighted score: lower is better
  const scored = results.map((r) => ({
    result: r,
    score:  r.avgWaitingTime * 0.5 + r.avgTurnaroundTime * 0.3 + r.avgResponseTime * 0.2,
  }));
  scored.sort((a, b) => a.score - b.score);
  const best = scored[0].result;

  const reasons: Record<AlgorithmKey, string> = {
    FCFS:       'Simple and fair — optimal when all processes have similar burst times.',
    RR:         'Best for time-sharing systems — balances response time across all processes.',
    SPN:        'Minimises average waiting time — optimal for batch systems with known burst times.',
    SRTN:       'Preemptive shortest job first — gives the theoretical minimum average waiting time.',
    PRIORITY:   'Non-preemptive priority — best when critical processes must not be interrupted.',
    PRIORITY_P: 'Preemptive priority — best when high-priority processes need immediate CPU access.',
  };

  return { best, reason: reasons[best.algorithm] };
}

// ─── Process Color Palette ────────────────────────────────────────────────────

export const PROCESS_COLORS = [
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#f59e0b', // gold
  '#10b981', // green
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // violet
];
