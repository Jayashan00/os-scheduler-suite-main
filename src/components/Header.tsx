import { GraduationCap, Github, BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-cyan">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm sm:text-base">CPU Scheduler Simulator</span>
                <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan/40 text-cyan bg-cyan/10">
                  EC 6110
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
                University of Jaffna · Faculty of Engineering · OS Assignment 2026
              </div>
            </div>
          </div>

          {/* Algo badges */}
          <div className="hidden lg:flex items-center gap-1.5">
            {['FCFS','RR','SPN','SRTN','PRIORITY'].map((a) => (
              <span key={a} className="text-[9px] font-mono font-semibold px-2 py-1 rounded border border-border text-muted-foreground bg-muted/30">
                {a}
              </span>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">Group Assignment 2026</span>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" title="Ready" />
          </div>
        </div>
      </div>
    </header>
  );
}
