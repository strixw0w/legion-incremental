# S2 legion rules (squad fights and multi-character credit)

**Version 1, 2026-11-13. Status: candidate.** Formal statement of the S2 rules that the independent oracle
(`spec/oracle/s2_oracle.py`) re-derives. Sources: `legion-progression-lab/planning/S2_SPECIFICATION.md` v1.0 and
`S2_RESOLUTIONS.md` v1.0 (S2-R01 … R20). Every number is a candidate.

## v1.1

S2.1 (2026-11-13; owner "Independent L1/S2 Review and S2.1 Authorisation" §2, §4, §8; `planning/S2_OWNER_RESOLUTIONS.md`). Sections 1–3 of v1 are unchanged.

### 4. Worker assignment eligibility (M0 resolution D-01; S2-R17 as approved)
- A worker may be assigned to zone `z` only if `z` is **accessible** to the account **and has been visited by the hero**. Otherwise the command is refused: `ZONE_NOT_ACCESSIBLE`, then `ZONE_NOT_VISITED`.
- Visiting is done only by the hero (arrival or start zone). Workers never set "visited" and never discover checkpoints.
- Worker kills count for zone kills and kill gates. Completing a kill gate grants **access only**.
- Visited is permanent, so a valid worker stays valid across travel and sessions.
- Explicit diagnostic set-ups may mark zones visited; a diagnostic worker in a zone that is not accessible and visited is refused at construction (`INVALID_STATE`).

### 5. Reserve swaps (S2-R18 as approved)
Moving a character into or out of the reserve is refused while it is in an encounter: a squad participant of the current encounter (knocked out or not), or a worker in a fight (`CHARACTER_BUSY`).

### 6. Worker feasibility, ability-aware (structural)
For a worker with stats (max HP `H`, defence `d`, swing raw attack `a`, interval `i`, ability raw `b`, cooldown `c`) against an enemy (HP `E`, attack `x`, first attack delay `f`, interval `j`), from full HP:
- the enemy hit is `h = damage(x, d)`; the worker is knocked out at `T = f + (ceil(H / h) − 1) × j`;
- the damage bound is `B = maxBlow(a) × (floor(T / i) + 1) + maxBlow(b) × (floor(T / c) + 1)`, where `maxBlow` is the crit damage when crits are possible, else the normal damage; blows at `T` still land;
- with zero hit chance, `B = 0`.

The fight is **proven impossible** iff `B < E`.
- **Classification of a classed worker's estimate** (the estimate itself is estimator v1.2 on basic attacks):
  - basic attacks can win: the estimate is kept as conservative, and `reliable` becomes `approximate` (ABILITY_NOT_MODELLED);
  - basic attacks cannot win and `B < E`: `unreachable` (DIES_BEFORE_KILL, ABILITY_INCLUDED_IN_BOUND);
  - basic attacks cannot win and `B ≥ E`: `unresolved` (ABILITY_DEPENDENT); production is not estimated.
- Classless workers keep estimator v1.2 exactly.

## v1

### 1. Character stats (S2-R11)
For a character at level `L` (`steps = L − 1`), with the S1 hero base values:
- `baseHp = baseMaxHp + maxHpPerLevel × steps`, `baseDef = baseDefence + defencePerLevel × steps`,
  `baseAtk = baseAttackMilli + attackPerLevelMilli × steps` (thousandths).
- **Classless:** exactly the S1 hero: HP `baseHp`, defence `baseDef`, raw attack `roundHalfUp(baseAtk)`, the hero's
  attack interval, threat rank 1, no ability.
- **Class `c`:**
  - HP `max(1, roundHalfUp(baseHp × (10000 + hpBp) / 10000))`;
  - defence `baseDef + defenceFlat + floor(defencePerLevel × steps × defencePerLevelBp / 10000)`;
  - raw attack `roundHalfUp(baseAtk × (10000 + attackBp + talent attack bp) / 10000)` (the additive damage pool);
  - the class's attack interval and threat rank;
  - ability raw attack `max(1, roundHalfUp(rawAttack × (multBp + ability bp) / 10000))`, with the class cooldown.
- Damage per hit is the S1 formula (combat.md v2): `max(minDamage, roundHalfUp(raw × critFactor × K / (1000 × (K + defence))))`.

### 2. Squad fight (S2-R12 … R16)
One encounter, starting at arrival time `A` (the S1 entry walk):
- The hero and every participant (deployed recruits not knocked out at `A`) swing at `A + k × interval`. A recruit
  with a class also casts its ability at `A + k × cooldown` (it starts ready). Each blow is one hit draw and one crit
  draw; the fixtures use certain hits and no crits.
- The enemy attacks at `A + firstAttackDelay + j × enemyInterval`. Each attack hits the first LIVING character in
  threat order: lowest threat rank first (Warrior 0, classless 1, Archer and Mage 2), then acquisition order (hero 0,
  then recruits in the order they joined).
- **Simultaneity:** all blows and attacks at one instant are computed from the state before that instant and
  applied together. The enemy dies when its HP reaches 0 and at least one blow landed at that instant.
- **Knockout:** a recruit at 0 HP is knocked out; it makes no later blow and is never targeted again in the encounter.
  The hero at 0 HP dies (S1.1 rules); the encounter ends.
- **Eligibility:** at the kill, the hero and every participant NOT knocked out before that instant. A participant
  knocked out at the kill instant is eligible (its blow and the enemy's land together).

### 3. Multi-character credit (S2 §8)
- A kill registers a pending claim `(encounterId, instanceId, zoneOrder, boss, stream)` with its eligible set, fixed
  at the kill. `stream` is `squad` or `worker:<characterId>`. The claim's identity is `kill:<encounterId>:<instanceId>`.
- A credit is classified BEFORE any draw (S1.1 rules): a pending claim with the same fields is accepted; the same
  identity with other fields is `CREDIT_CONFLICT`; a committed identity is `CREDIT_REPLAYED` (same fields) or
  `CREDIT_CONFLICT`; anything else is `CREDIT_UNKNOWN`. A rejected claim changes nothing.
- An accepted credit, as one operation:
  - rolls the kill reward ONCE on the stream's loot generator (account generator `loot/account` for `squad`;
    `loot/worker:<id>` for a worker), one draw per drop entry, whatever the number of eligible characters;
  - gives EVERY eligible character the enemy's full EXP (never divided) and adds the same amount to the mastery of the
    class it holds at that moment (nothing for a classless character);
  - counts one zone kill (ordinary enemies) and commits the identity.
- A class change moves no mastery between classes.
