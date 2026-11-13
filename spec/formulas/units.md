# Units, labels and content validation

## v1

### Units and suffixes
| Suffix / kind | Meaning | Representation |
|---|---|---|
| (count) | Gold, materials, item counts, kills, levels, EXP | Safe integer: a double with `Number.isSafeInteger`, \|x\| ≤ 2^53 − 1 |
| `…Ms` | Duration or timestamp | Integer milliseconds |
| `…Bp` | Percent-like value | Integer basis points: 10000 bp = 100%, so 2500 bp = +25% |
| `…Prob` | Probability | Double in [0, 1], or basis points. Decided through a 32-bit threshold (`rng.md`). |
| `…Mult` | Multiplier | Expressed as a category of basis points (`stats.md`) |
| `…PerHour` | Rate | Integer milli-units per hour for authoritative accrual (`remainder.md`); doubles appear only in reports |
| Fraction of a unit | Not stored as a fraction | Integer remainder of an exact accumulator (`remainder.md`) |

`NaN`, `±Infinity`, non-integers where integers are required, and negatives where forbidden are refused with `INVALID_NUMBER`. Results outside the safe range are refused with `NUMERIC_LIMIT`. Nothing is silently clamped. `−0` is normalised to `+0`.

### Stable IDs
Lowercase and dotted, at least two segments, for example `cat.damage.additive`, `zone.w1.01` or `res.gold`. Resource IDs start with `res.`. IDs are never reused or renamed. Display names are separate.

### Value labels
Every numeric content value is written as `{ "value": …, "label": "approved" | "target" | "candidate" | "derived", "range"?: [lo, hi], "hypothesis"?: "…", "note"?: "…" }`.
- **Weakest input wins:** a derived result takes the weakest label of its inputs, with strength `approved > target > derived > candidate`.
- **S0:** every value is `candidate`.

### Content validation (S0 pack)
A pack is refused as a whole (`INVALID_CONTENT`) when any of these fails:
1. **Strict schema** (`spec/schema/content-pack-s0.schema.json`): no unknown fields, every number labelled, IDs in stable form.
2. **Ranges:** a labelled value with a `range` must lie inside it, inclusive.
3. **Unique categories:** stat category IDs are unique.
4. **Hit curve:** `combat.hitCurve.floorBp ≤ hAtReqBp`.
5. **Table hash:** `xp.table.sha256` equals SHA-256 of the canonical JSON (`canonical-json.md`) of the XP table artifact.
6. **Table match:**
   - the artifact `contentId` equals the pack's `contentId`;
   - the artifact length equals `xp.tableLength`;
   - the artifact curve parameters equal the pack's curve values.
7. **Table validity:** the artifact thresholds are safe integers ≥ 1 and non-decreasing (`xp.md`).
