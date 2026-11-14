/**
 * Per-run metrics, derived only from the event log (experiment plan section 5). Times are integer ms since the
 * profile started; S1 runs are single sessions starting at t = 0, so they are active-time values.
 * Every value is model output from candidate inputs.
 *
 * S1.1 (owner review section 6): drops are recorded twice, as successful-drop EVENTS per resource (`drops`, for
 * probability experiments) and as QUANTITIES awarded per resource (`materials`, for production rates). At `finish`
 * the recorded gold and quantities are reconciled with the ledger's balance changes since the recorder was attached;
 * any difference is an INVALID_STATE error, so a wrong metric cannot reach a report.
 */
import { fail } from '../core/errors.ts';
import type { LogEntry } from '../model/types.ts';
import type { Simulation } from '../engine/simulation.ts';
import { parseDropItems } from '../engine/rewards.ts';

export const TRACKED_LEVELS = [2, 5, 10, 25] as const;
export const CHECKPOINT_MIN = [5, 15, 30, 45, 60, 90] as const;
export const FIRST_VISIT_TTK_KILLS = 10;

export interface RunMetrics {
  readonly horizonMs: number;
  readonly firstKillMs: number | null;
  readonly killsToLevel2: number | null;
  readonly levelReachedMs: Readonly<Record<string, number | null>>;
  readonly zoneUnlockMs: Readonly<Record<string, number | null>>;
  readonly zoneFirstVisitMs: Readonly<Record<string, number | null>>;
  readonly killsByZone: Readonly<Record<string, number>>;
  readonly totalKills: number;
  /** Median TTK (ms) of the first 10 kills after the first visit of each zone; null if fewer than 10. */
  readonly firstVisitTtkMs: Readonly<Record<string, number | null>>;
  /** Median TTK (ms) over all kills per zone. */
  readonly medianTtkMs: Readonly<Record<string, number | null>>;
  readonly deaths: number;
  readonly deathDowntimeMs: number;
  readonly autoFarmStops: number;
  readonly levelAtMin: Readonly<Record<string, number | null>>;
  readonly expAtMin: Readonly<Record<string, number | null>>;
  readonly finalLevel: number;
  readonly finalZoneOrder: number;
  readonly expTotal: number;
  readonly gold: number;
  /** Successful drop events per resource (one per successful drop entry). */
  readonly drops: Readonly<Record<string, number>>;
  /** Quantities awarded per resource (sum of the successful entries' quantities); reconciled with the ledger. */
  readonly materials: Readonly<Record<string, number>>;
  readonly damageDealt: number;
  readonly overkill: number;
  readonly bossAttempts: number;
  readonly bossClears: number;
  readonly time: { readonly activeManualMs: number; readonly connectedAutoFarmMs: number; readonly offlineMs: number; readonly elapsedMs: number };
  readonly eventsProcessed: number;
  readonly staleDiscarded: number;
  readonly commandsAccepted: number;
  readonly commandsRejected: Readonly<Record<string, number>>;
  readonly duplicateCredits: number;
  readonly rejectedCredits: Readonly<Record<string, number>>;
  readonly policyReports: Readonly<Record<string, number>>;
}

const sortedRecord = (r: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(r).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.ceil(s.length / 2) - 1] as number; // lower median (nearest rank), an observed value
}

export class MetricsRecorder {
  private firstKillMs: number | null = null;
  private killsToLevel2: number | null = null;
  private readonly levelReached: Record<string, number | null> = Object.fromEntries(TRACKED_LEVELS.map((l) => [String(l), null]));
  private readonly zoneUnlock: Record<string, number | null> = {};
  private readonly zoneVisit: Record<string, number | null> = {};
  private readonly kills: Record<string, number> = {};
  private readonly ttkAll: Record<string, number[]> = {};
  private readonly ttkFirstVisit: Record<string, number[]> = {};
  private totalKills = 0;
  private creditedKills = 0;
  private deaths = 0;
  private downtime = 0;
  private diedAt: number | null = null;
  private autoFarmStops = 0;
  private level: number;
  private exp = 0;
  private gold = 0;
  private readonly drops: Record<string, number> = {};
  private readonly materials: Record<string, number> = {};
  private readonly ledgerAtStart: Map<string, number> = new Map();
  /** S2: gold and materials spent or granted outside kill credits (LegionSpend / LegionGrant entries; none in S1). */
  private readonly otherChanges: Record<string, number> = {};
  private damage = 0;
  private overkill = 0;
  private bossAttempts = 0;
  private bossClears = 0;
  private readonly levelAt: Record<string, number | null> = Object.fromEntries(CHECKPOINT_MIN.map((m) => [String(m), null]));
  private readonly expAt: Record<string, number | null> = Object.fromEntries(CHECKPOINT_MIN.map((m) => [String(m), null]));
  private nextCheckpoint = 0;

  constructor(sim: Simulation) {
    const s = sim.state;
    this.level = s.hero.level;
    for (const [id, b] of s.ledger.balances) this.ledgerAtStart.set(id, b.available);
    sim.content.zones.forEach((z, i) => {
      const zs = s.zones[i];
      this.zoneUnlock[String(z.order)] = zs?.accessUnlocked ? 0 : null;
      this.zoneVisit[String(z.order)] = zs?.visited ? 0 : null;
      this.kills[String(z.order)] = 0;
      this.ttkAll[String(z.order)] = [];
      this.ttkFirstVisit[String(z.order)] = [];
    });
    sim.addObserver((e) => this.onEntry(e));
  }

  private passCheckpoints(t: number): void {
    while (this.nextCheckpoint < CHECKPOINT_MIN.length && (CHECKPOINT_MIN[this.nextCheckpoint] as number) * 60_000 <= t) {
      const m = String(CHECKPOINT_MIN[this.nextCheckpoint]);
      this.levelAt[m] = this.level;
      this.expAt[m] = this.exp;
      this.nextCheckpoint += 1;
    }
  }

  private onEntry(e: LogEntry): void {
    this.passCheckpoints(e.t);
    const d = e.detail;
    switch (e.kind) {
      case 'EnemyKilled': {
        if (d['boss'] === true) break;
        const z = String(d['zoneOrder']);
        const ttk = d['ttkMs'] as number;
        (this.ttkAll[z] as number[]).push(ttk);
        if (this.zoneVisit[z] !== null && (this.ttkFirstVisit[z] as number[]).length < FIRST_VISIT_TTK_KILLS) (this.ttkFirstVisit[z] as number[]).push(ttk);
        break;
      }
      case 'KillCredited': {
        if (this.firstKillMs === null) this.firstKillMs = e.t;
        if (d['boss'] === true) this.bossClears += 1;
        else {
          const z = String(d['zoneOrder']);
          this.kills[z] = (this.kills[z] ?? 0) + 1;
          this.totalKills += 1;
        }
        this.gold += d['gold'] as number;
        for (const item of parseDropItems(String(d['dropItems'] ?? ''))) {
          this.drops[item.resourceId] = (this.drops[item.resourceId] ?? 0) + 1;
          this.materials[item.resourceId] = (this.materials[item.resourceId] ?? 0) + item.qty;
        }
        this.exp += d['exp'] as number; // EXP earned by the kill (counted even in frozen-level diagnostics)
        this.creditedKills += 1;
        if (this.killsToLevel2 === null && (d['levelTo'] as number) >= 2) this.killsToLevel2 = this.creditedKills;
        break;
      }
      case 'LevelUp': {
        this.level = d['level'] as number;
        const key = String(this.level);
        if (key in this.levelReached && this.levelReached[key] === null) this.levelReached[key] = e.t;
        break;
      }
      case 'ZoneAccessUnlocked':
        if (this.zoneUnlock[String(d['zoneOrder'])] === null) this.zoneUnlock[String(d['zoneOrder'])] = e.t;
        break;
      case 'ZoneVisited':
        if (this.zoneVisit[String(d['zoneOrder'])] === null) this.zoneVisit[String(d['zoneOrder'])] = e.t;
        break;
      case 'HeroDied':
        this.deaths += 1;
        this.diedAt = e.t;
        break;
      case 'EncounterStarted':
        if (this.diedAt !== null) {
          this.downtime += e.t - this.diedAt;
          this.diedAt = null;
        }
        if (d['kind'] === 'boss') this.bossAttempts += 1;
        break;
      case 'SessionEnded':
        if (this.diedAt !== null) {
          this.downtime += e.t - this.diedAt;
          this.diedAt = null;
        }
        break;
      case 'AutoFarmStopped':
        this.autoFarmStops += 1;
        break;
      case 'LegionSpend':
        this.otherChanges[String(d['resourceId'])] = (this.otherChanges[String(d['resourceId'])] ?? 0) - (d['amount'] as number);
        break;
      case 'LegionGrant':
        this.otherChanges[String(d['resourceId'])] = (this.otherChanges[String(d['resourceId'])] ?? 0) + (d['amount'] as number);
        break;
      case 'Swing':
        this.damage += d['damage'] as number;
        this.overkill += d['overkill'] as number;
        break;
      default:
        break;
    }
  }

  /** Gold and every awarded quantity must equal the ledger's balance change since the recorder was attached. */
  private reconcile(sim: Simulation): void {
    const expected = new Map<string, number>(Object.entries(this.materials));
    if (this.gold !== 0) expected.set('res.gold', (expected.get('res.gold') ?? 0) + this.gold);
    for (const [id, delta] of Object.entries(this.otherChanges)) expected.set(id, (expected.get(id) ?? 0) + delta);
    const ids = new Set<string>([...expected.keys(), ...sim.state.ledger.balances.keys()]);
    for (const id of ids) {
      const change = (sim.state.ledger.balances.get(id)?.available ?? 0) - (this.ledgerAtStart.get(id) ?? 0);
      if (change !== (expected.get(id) ?? 0)) fail('INVALID_STATE', 'metrics do not match the ledger', { resourceId: id, metrics: expected.get(id) ?? 0, ledger: change });
    }
  }

  finish(sim: Simulation, horizonMs: number): RunMetrics {
    this.passCheckpoints(horizonMs);
    this.reconcile(sim);
    const s = sim.state;
    const t = s.time;
    const first: Record<string, number | null> = {};
    const all: Record<string, number | null> = {};
    for (const z of Object.keys(this.ttkAll)) {
      const fv = this.ttkFirstVisit[z] as number[];
      first[z] = fv.length >= FIRST_VISIT_TTK_KILLS ? median(fv) : null;
      all[z] = median(this.ttkAll[z] as number[]);
    }
    return {
      horizonMs,
      firstKillMs: this.firstKillMs,
      killsToLevel2: this.killsToLevel2,
      levelReachedMs: { ...this.levelReached },
      zoneUnlockMs: { ...this.zoneUnlock },
      zoneFirstVisitMs: { ...this.zoneVisit },
      killsByZone: { ...this.kills },
      totalKills: this.totalKills,
      firstVisitTtkMs: first,
      medianTtkMs: all,
      deaths: this.deaths,
      deathDowntimeMs: this.downtime + (this.diedAt !== null ? horizonMs - this.diedAt : 0),
      autoFarmStops: this.autoFarmStops,
      levelAtMin: { ...this.levelAt },
      expAtMin: { ...this.expAt },
      finalLevel: s.hero.level,
      finalZoneOrder: s.hero.zoneOrder,
      expTotal: this.exp,
      gold: this.gold,
      drops: sortedRecord(this.drops),
      materials: sortedRecord(this.materials),
      damageDealt: this.damage,
      overkill: this.overkill,
      bossAttempts: this.bossAttempts,
      bossClears: this.bossClears,
      time: { activeManualMs: t.activeManualMs, connectedAutoFarmMs: t.connectedAutoFarmMs, offlineMs: t.offlineMs, elapsedMs: t.activeManualMs + t.connectedAutoFarmMs + t.offlineMs },
      eventsProcessed: sim.counters.eventsProcessed,
      staleDiscarded: sim.counters.staleDiscarded,
      commandsAccepted: sim.counters.commandsAccepted,
      commandsRejected: { ...sim.counters.commandsRejected },
      duplicateCredits: sim.counters.duplicateCredits,
      rejectedCredits: sortedRecord({ ...sim.counters.rejectedCredits }),
      policyReports: sortedRecord({ ...sim.counters.policyReports }),
    };
  }
}
