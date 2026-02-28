import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SchedulerResult, AlgorithmKey, ALGORITHM_LABELS } from './scheduler';

const ALGO_SHORT: Record<AlgorithmKey, string> = {
  FCFS:       'FCFS',
  RR:         'RR',
  SPN:        'SPN',
  SRTN:       'SRTN',
  PRIORITY:   'Pri-NP',
  PRIORITY_P: 'Pri-P',
};

const IS_PREEMPTIVE: Record<AlgorithmKey, string> = {
  FCFS:       'Non-Preemptive',
  RR:         'Preemptive',
  SPN:        'Non-Preemptive',
  SRTN:       'Preemptive',
  PRIORITY:   'Non-Preemptive',
  PRIORITY_P: 'Preemptive',
};

// ─── PDF Export ───────────────────────────────────────────────────────────────

export function exportToPDF(results: SchedulerResult[], bestAlgo: AlgorithmKey, quantum: number) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Cover header ──
  doc.setFillColor(8, 15, 30);
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(6, 182, 212);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('UNIVERSITY OF JAFFNA · FACULTY OF ENGINEERING · EC 6110: OPERATING SYSTEMS', pageW / 2, 10, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('CPU Scheduling Simulator — Results Report', pageW / 2, 20, { align: 'center' });

  doc.setTextColor(150, 180, 200);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}   |   Round Robin Quantum: ${quantum}`, pageW / 2, 28, { align: 'center' });

  // ── Best algorithm banner ──
  doc.setFillColor(6, 182, 212);
  doc.setDrawColor(6, 182, 212);
  doc.roundedRect(10, 36, pageW - 20, 10, 2, 2, 'D');
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Best Algorithm: ${ALGORITHM_LABELS[bestAlgo]} (${ALGO_SHORT[bestAlgo]}) — ${IS_PREEMPTIVE[bestAlgo]}`,
    pageW / 2, 42.5, { align: 'center' }
  );

  // ── Comparison summary table ──
  doc.setTextColor(200, 220, 240);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Algorithm Comparison Summary', 10, 54);

  autoTable(doc, {
    startY: 57,
    head: [['Algorithm', 'Full Name', 'Mode', 'Avg Wait', 'Avg TAT', 'Avg RT', 'CPU Util', 'Throughput', 'Best?']],
    body: results.map((r) => [
      ALGO_SHORT[r.algorithm],
      ALGORITHM_LABELS[r.algorithm],
      IS_PREEMPTIVE[r.algorithm],
      r.avgWaitingTime.toFixed(2),
      r.avgTurnaroundTime.toFixed(2),
      r.avgResponseTime.toFixed(2),
      r.cpuUtilization.toFixed(1) + '%',
      r.throughput.toFixed(4),
      r.algorithm === bestAlgo ? '✓ BEST' : '',
    ]),
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [220, 230, 240], fillColor: [12, 22, 40] },
    headStyles: { fillColor: [15, 30, 55], textColor: [100, 200, 220], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [16, 26, 46] },
    columnStyles: { 8: { textColor: [6, 182, 212], fontStyle: 'bold' } },
    tableLineColor: [30, 50, 80],
    tableLineWidth: 0.3,
  });

  // ── Per-algorithm detail pages ──
  for (const r of results) {
    doc.addPage();

    doc.setFillColor(8, 15, 30);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(200, 220, 240);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ALGO_SHORT[r.algorithm]} — ${ALGORITHM_LABELS[r.algorithm]}`, 10, 12);

    // Mode badge
    doc.setFontSize(8);
    const modeColor: [number, number, number] = IS_PREEMPTIVE[r.algorithm] === 'Preemptive'
      ? [251, 146, 60] : [16, 185, 129];
    doc.setTextColor(...modeColor);
    doc.text(`[ ${IS_PREEMPTIVE[r.algorithm]} ]`, 10, 19);

    if (r.algorithm === bestAlgo) {
      doc.setTextColor(6, 182, 212);
      doc.setFontSize(9);
      doc.text('🏆 BEST', pageW - 10, 14, { align: 'right' });
    }

    // Metrics strip
    const metricY = 27;
    const metrics = [
      { label: 'Avg Waiting Time', value: r.avgWaitingTime.toFixed(2) + ' ms' },
      { label: 'Avg Turnaround',   value: r.avgTurnaroundTime.toFixed(2) + ' ms' },
      { label: 'Avg Response',     value: r.avgResponseTime.toFixed(2) + ' ms' },
      { label: 'CPU Utilization',  value: r.cpuUtilization.toFixed(1) + '%' },
      { label: 'Throughput',       value: r.throughput.toFixed(4) + ' p/u' },
    ];
    const mw = (pageW - 20) / metrics.length;
    metrics.forEach((m, i) => {
      const x = 10 + i * mw;
      doc.setFillColor(15, 30, 55);
      doc.roundedRect(x, metricY, mw - 2, 14, 1, 1, 'F');
      doc.setTextColor(6, 182, 212);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(m.value, x + mw / 2 - 1, metricY + 7, { align: 'center' });
      doc.setTextColor(100, 130, 160);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(m.label, x + mw / 2 - 1, metricY + 12, { align: 'center' });
    });

    // Process results table
    doc.setTextColor(200, 220, 240);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Process Metrics', 10, 48);

    autoTable(doc, {
      startY: 51,
      head: [['Process', 'Arrival', 'Burst', 'Priority', 'Completion', 'TAT', 'WT', 'RT']],
      body: r.results.map((p) => [
        p.processName, p.arrivalTime, p.burstTime, p.priority,
        p.completionTime, p.turnaroundTime, p.waitingTime, p.responseTime,
      ]),
      foot: [['Average', '', '', '', '',
        r.avgTurnaroundTime.toFixed(2),
        r.avgWaitingTime.toFixed(2),
        r.avgResponseTime.toFixed(2),
      ]],
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [220, 230, 240], fillColor: [12, 22, 40] },
      headStyles: { fillColor: [15, 30, 55], textColor: [100, 200, 220], fontStyle: 'bold' },
      footStyles: { fillColor: [20, 40, 70], textColor: [6, 182, 212], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [16, 26, 46] },
      tableLineColor: [30, 50, 80],
      tableLineWidth: 0.3,
    });

    const afterTableY = (doc as any).lastAutoTable.finalY + 8;
    doc.setTextColor(200, 220, 240);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Gantt Chart (Execution Order)', 10, afterTableY);

    const ganttText = r.gantt.map((g) => `${g.processName}[${g.start}→${g.end}]`).join('  →  ');
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 180, 210);
    const lines = doc.splitTextToSize(ganttText, pageW - 20);
    doc.text(lines, 10, afterTableY + 6);
  }

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(80, 100, 130);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `University of Jaffna · Faculty of Engineering · EC 6110: Operating Systems · Group Assignment 2026   |   Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  doc.save(`CPU_Scheduling_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export function exportToExcel(results: SchedulerResult[], bestAlgo: AlgorithmKey, quantum: number) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Comparison Summary ──
  const summaryRows: (string | number)[][] = [
    ['CPU Scheduling Simulator — Results Report'],
    [`Generated: ${new Date().toLocaleString()}`, '', `Round Robin Quantum: ${quantum}`],
    [`Best Algorithm: ${ALGORITHM_LABELS[bestAlgo]} (${ALGO_SHORT[bestAlgo]})`],
    [],
    ['Algorithm', 'Full Name', 'Mode', 'Avg WT', 'Avg TAT', 'Avg RT', 'CPU Util (%)', 'Throughput (p/u)', 'Best?'],
    ...results.map((r) => [
      ALGO_SHORT[r.algorithm],
      ALGORITHM_LABELS[r.algorithm],
      IS_PREEMPTIVE[r.algorithm],
      parseFloat(r.avgWaitingTime.toFixed(2)),
      parseFloat(r.avgTurnaroundTime.toFixed(2)),
      parseFloat(r.avgResponseTime.toFixed(2)),
      parseFloat(r.cpuUtilization.toFixed(2)),
      parseFloat(r.throughput.toFixed(4)),
      r.algorithm === bestAlgo ? 'BEST' : '',
    ]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [12, 38, 18, 12, 12, 12, 14, 16, 8].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // ── Per-algorithm sheets ──
  for (const r of results) {
    const rows: (string | number)[][] = [
      [`${ALGO_SHORT[r.algorithm]} — ${ALGORITHM_LABELS[r.algorithm]}`],
      [`Mode: ${IS_PREEMPTIVE[r.algorithm]}`, r.algorithm === bestAlgo ? '🏆 BEST ALGORITHM' : ''],
      [],
      ['Metric', 'Value'],
      ['Avg Waiting Time (ms)',    parseFloat(r.avgWaitingTime.toFixed(2))],
      ['Avg Turnaround Time (ms)', parseFloat(r.avgTurnaroundTime.toFixed(2))],
      ['Avg Response Time (ms)',   parseFloat(r.avgResponseTime.toFixed(2))],
      ['CPU Utilization (%)',      parseFloat(r.cpuUtilization.toFixed(2))],
      ['Throughput (p/u)',         parseFloat(r.throughput.toFixed(4))],
      [],
      ['Process', 'Arrival', 'Burst', 'Priority', 'Completion', 'Turnaround', 'Waiting', 'Response'],
      ...r.results.map((p) => [
        p.processName, p.arrivalTime, p.burstTime, p.priority,
        p.completionTime, p.turnaroundTime, p.waitingTime, p.responseTime,
      ]),
      ['Average', '', '', '', '',
        parseFloat(r.avgTurnaroundTime.toFixed(2)),
        parseFloat(r.avgWaitingTime.toFixed(2)),
        parseFloat(r.avgResponseTime.toFixed(2)),
      ],
      [],
      ['Gantt Chart (Execution Order)'],
      [r.gantt.map((g) => `${g.processName}[${g.start}→${g.end}]`).join(' → ')],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [14, 10, 10, 10, 14, 14, 12, 12].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, ALGO_SHORT[r.algorithm]);
  }

  XLSX.writeFile(wb, `CPU_Scheduling_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
