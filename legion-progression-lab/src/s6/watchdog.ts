/**
 * S6 runner watchdog (owner S6 authorisation: "an independent watchdog for stuck tasks; stop and report any over-budget
 * workload"). It is driven by its own timer in the runner's main thread, independent of task completion, so a task
 * that never finishes (a stuck loop, an extremely slow workload) is still detected. Budgets are registered per
 * manifest:
 *  - wallMs: the whole run;
 *  - taskMs: one task, from its start;
 *  - stallMs: one task without a heartbeat (workers report progress at least every simulated chunk);
 *  - peakRssMb: process memory.
 * The first violation latches a stop verdict naming the task and its last reported progress; the runner then
 * terminates every worker and writes a STOPPED report with the tasks completed so far. Time is injected (tests).
 */
export interface WatchdogBudgets {
  readonly wallMs: number;
  readonly taskMs: number;
  readonly stallMs: number;
  readonly peakRssMb: number;
}

export type StopCode = 'WALL_BUDGET' | 'TASK_BUDGET' | 'STALLED' | 'MEMORY_BUDGET' | 'WORKER_ERROR';

export interface StopVerdict {
  readonly code: StopCode;
  readonly reason: string;
  readonly task: number | null;
  readonly progress: string | null;
  readonly atMs: number;
}

interface Busy {
  readonly task: number;
  readonly startMs: number;
  lastBeatMs: number;
  progress: string | null;
  beats: number;
}

export class Watchdog {
  private readonly busy = new Map<number, Busy>();
  private peakRss = 0;
  private verdict: StopVerdict | null = null;
  private readonly t0: number;
  private readonly budgets: WatchdogBudgets;
  private readonly now: () => number;

  constructor(budgets: WatchdogBudgets, now: () => number) {
    this.budgets = budgets;
    this.now = now;
    for (const [k, v] of Object.entries(budgets)) if (!Number.isFinite(v) || v <= 0) throw new Error(`watchdog budget ${k} must be a positive number`);
    this.t0 = now();
  }

  /** A worker slot starts a task. */
  start(slot: number, task: number): void {
    const t = this.now();
    this.busy.set(slot, { task, startMs: t, lastBeatMs: t, progress: null, beats: 0 });
  }

  /** A heartbeat with the task's progress (for example "day 3 of 30"). */
  beat(slot: number, progress: string): void {
    const b = this.busy.get(slot);
    if (!b) return;
    b.lastBeatMs = this.now();
    b.progress = progress;
    b.beats += 1;
  }

  finish(slot: number): void {
    this.busy.delete(slot);
  }

  memory(rssBytes: number): void {
    this.peakRss = Math.max(this.peakRss, rssBytes);
  }

  /** An external failure (a worker error) also stops the run. */
  fail(task: number | null, reason: string): StopVerdict {
    this.verdict ??= { code: 'WORKER_ERROR', reason, task, progress: null, atMs: this.now() - this.t0 };
    return this.verdict;
  }

  /** Checks every budget now; returns the latched verdict once any is exceeded. */
  check(): StopVerdict | null {
    if (this.verdict) return this.verdict;
    const t = this.now();
    const at = t - this.t0;
    const stop = (code: StopCode, reason: string, b: Busy | null): StopVerdict => (this.verdict = { code, reason, task: b?.task ?? null, progress: b?.progress ?? null, atMs: at });
    if (at > this.budgets.wallMs) return stop('WALL_BUDGET', `run wall time ${at} ms exceeded the registered ${this.budgets.wallMs} ms`, [...this.busy.values()][0] ?? null);
    if (this.peakRss / 2 ** 20 > this.budgets.peakRssMb) return stop('MEMORY_BUDGET', `process memory ${Math.round(this.peakRss / 2 ** 20)} MB exceeded the registered ${this.budgets.peakRssMb} MB`, null);
    for (const b of [...this.busy.values()].sort((x, y) => x.task - y.task)) {
      if (t - b.startMs > this.budgets.taskMs) return stop('TASK_BUDGET', `task ${b.task} ran ${t - b.startMs} ms, over the registered ${this.budgets.taskMs} ms per task`, b);
      if (t - b.lastBeatMs > this.budgets.stallMs) return stop('STALLED', `task ${b.task} sent no progress for ${t - b.lastBeatMs} ms (registered limit ${this.budgets.stallMs} ms)`, b);
    }
    return null;
  }

  /** The tasks in flight now, with their age and last progress (for the STOPPED report). */
  inFlight(): { task: number; ageMs: number; sinceBeatMs: number; progress: string | null; beats: number }[] {
    const t = this.now();
    return [...this.busy.values()].sort((a, b) => a.task - b.task).map((b) => ({ task: b.task, ageMs: t - b.startMs, sinceBeatMs: t - b.lastBeatMs, progress: b.progress, beats: b.beats }));
  }

  peakRssMb(): number {
    return Math.round(this.peakRss / 2 ** 20);
  }
}
