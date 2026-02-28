import { useState, useEffect, useRef, useCallback } from 'react';
import { GanttEntry, AlgorithmKey } from '@/lib/scheduler';
import { Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  gantt: GanttEntry[];
  algorithm: AlgorithmKey;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4];

export default function AnimatedGanttChart({ gantt, algorithm }: Props) {
  const totalTime = gantt.length ? gantt[gantt.length - 1].end : 0;
  const startTime = gantt.length ? gantt[0].start : 0;
  const span = totalTime - startTime;

  const [currentTime, setCurrentTime] = useState(startTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // index into SPEED_OPTIONS
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speed = SPEED_OPTIONS[speedIdx];

  const tick = useCallback(() => {
    setCurrentTime((prev) => {
      const next = prev + 0.1 * speed;
      if (next >= totalTime) {
        setIsPlaying(false);
        return totalTime;
      }
      return next;
    });
  }, [speed, totalTime]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, tick]);

  // Reset when gantt changes
  useEffect(() => {
    setCurrentTime(startTime);
    setIsPlaying(false);
  }, [gantt, startTime]);

  const handleReset = () => {
    setCurrentTime(startTime);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (currentTime >= totalTime) {
      setCurrentTime(startTime);
    }
    setIsPlaying((p) => !p);
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
    setIsPlaying(false);
  };

  const markers = [...new Set([...gantt.map((g) => g.start), totalTime])].sort((a, b) => a - b);

  // Determine which entries are fully/partially visible at currentTime
  const activeProcessId = gantt.find((g) => g.start <= currentTime && g.end > currentTime)?.processId;

  return (
    <div className="space-y-3">
      {/* Gantt Bars */}
      <div className="relative overflow-x-auto">
        <div
          className="relative flex items-center gap-0"
          style={{ minWidth: `${Math.max(span * 20, 400)}px`, height: '48px' }}
        >
          {gantt.map((entry, i) => {
            const left  = ((entry.start - startTime) / span) * 100;
            const fullWidth = ((entry.end - entry.start) / span) * 100;

            // How much of this bar is revealed
            const revealedEnd = Math.min(entry.end, currentTime);
            const revealedStart = Math.min(entry.start, currentTime);
            const revealedWidth = Math.max(0, ((revealedEnd - revealedStart) / span) * 100);

            const isCurrent = entry.processId === activeProcessId && entry.start <= currentTime && entry.end > currentTime;
            const isCompleted = currentTime >= entry.end;

            return (
              <div
                key={i}
                className="absolute"
                style={{ left: `${left}%`, width: `${fullWidth}%`, height: '44px' }}
              >
                {/* Ghost (unrevealed) */}
                <div
                  className="absolute inset-0 rounded-md border border-dashed opacity-20"
                  style={{ borderColor: entry.color }}
                />
                {/* Revealed bar */}
                {revealedWidth > 0 && (
                  <div
                    className={`absolute top-0 left-0 h-full rounded-md flex items-center overflow-hidden transition-all duration-75 ${isCurrent ? 'animate-pulse ring-2' : ''}`}
                    style={{
                      width: `${(revealedWidth / fullWidth) * 100}%`,
                      background: isCompleted ? entry.color : `${entry.color}cc`,
                      boxShadow: isCurrent ? `0 0 12px ${entry.color}90` : `0 2px 8px ${entry.color}50`,
                      outline: isCurrent ? `2px solid ${entry.color}` : undefined,
                    }}
                  >
                    <span
                      className="truncate px-2 text-xs font-bold"
                      style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                    >
                      {entry.processName}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Current time cursor */}
          {currentTime > startTime && currentTime < totalTime && (
            <div
              className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
              style={{
                left: `${((currentTime - startTime) / span) * 100}%`,
                background: 'hsl(var(--foreground))',
                boxShadow: '0 0 6px hsl(var(--foreground) / 0.5)',
              }}
            >
              <div
                className="absolute -top-5 -translate-x-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
              >
                t={currentTime.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        {/* Timeline markers */}
        <div
          className="relative mt-1"
          style={{ minWidth: `${Math.max(span * 20, 400)}px`, height: '20px' }}
        >
          {markers.map((t) => (
            <div
              key={t}
              className="absolute flex flex-col items-center"
              style={{ left: `${((t - startTime) / span) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2 bg-border" />
              <span className="text-[9px] font-mono text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="h-8 w-8 p-0"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setSpeedIdx((s) => Math.max(0, s - 1))}
          className="h-8 w-8 p-0"
          title="Slower"
          disabled={speedIdx === 0}
        >
          <Rewind className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="sm"
          onClick={handlePlayPause}
          className="h-8 px-4 gap-2 bg-primary text-primary-foreground font-bold text-xs"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" fill="currentColor" />}
          {isPlaying ? 'Pause' : currentTime >= totalTime ? 'Replay' : 'Play'}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setSpeedIdx((s) => Math.min(SPEED_OPTIONS.length - 1, s + 1))}
          className="h-8 w-8 p-0"
          title="Faster"
          disabled={speedIdx === SPEED_OPTIONS.length - 1}
        >
          <FastForward className="w-3.5 h-3.5" />
        </Button>

        <span className="text-xs font-mono text-muted-foreground">
          {speed}×
        </span>

        {/* Scrubber */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min={startTime}
            max={totalTime}
            step={0.1}
            value={currentTime}
            onChange={handleSlider}
            className="flex-1 accent-cyan h-1.5"
          />
          <span className="text-xs font-mono text-cyan w-16 text-right">
            {currentTime.toFixed(1)} / {totalTime}
          </span>
        </div>
      </div>

      {/* Active process indicator */}
      {activeProcessId && (
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-muted-foreground">Running:</span>
          {gantt
            .filter((g) => g.processId === activeProcessId && g.start <= currentTime && g.end > currentTime)
            .slice(0, 1)
            .map((g) => (
              <span
                key={g.processId}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-bold"
                style={{ color: g.color, borderColor: `${g.color}50`, background: `${g.color}15` }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: g.color }}
                />
                {g.processName}
              </span>
            ))}
        </div>
      )}
      {!activeProcessId && currentTime >= totalTime && currentTime > startTime && (
        <div className="text-xs font-mono text-success flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          All processes completed
        </div>
      )}
    </div>
  );
}
