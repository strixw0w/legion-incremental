"""Independent RNG oracle (spec/formulas/rng.md v1). Python standard library only; run with `python -I`.

Written from the Markdown spec, not from the lab's TypeScript. Usage:
  python -I rng_oracle.py --check spec/fixtures/rng.v1.json
  python -I rng_oracle.py --fill DRAFT.json OUT.json     (fills cases whose "expected" is the string "ORACLE")
"""
import hashlib
import json
import math
import struct
import sys

DOMAIN = "legion.rng.v1"
M32 = 0xFFFFFFFF
MAX_SAFE = 2**53 - 1
TWO32 = 2**32
GUARD = 1000


class OracleError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def _field(value):
    if not isinstance(value, str) or value == "":
        raise OracleError("INVALID_STREAM_ID")
    try:
        data = value.encode("utf-8")  # strict: lone surrogates raise
    except UnicodeEncodeError:
        raise OracleError("INVALID_STREAM_ID")
    if len(data) > 1024:
        raise OracleError("INVALID_STREAM_ID")
    return data


def encode(stream):
    counter = stream.get("counter")
    if isinstance(counter, bool) or not isinstance(counter, int) or counter < 0 or counter > MAX_SAFE:
        raise OracleError("INVALID_STREAM_ID")
    parts = [DOMAIN.encode("utf-8"), _field(stream.get("root")), _field(stream.get("purpose")), _field(stream.get("entity")), str(counter).encode("ascii")]
    return b"".join(struct.pack(">I", len(p)) + p for p in parts)


def state_from_digest(digest):
    if len(digest) != 32:
        raise OracleError("INVALID_STATE")
    for base in (0, 16):
        words = list(struct.unpack(">4I", digest[base:base + 16]))
        if any(words):
            return words
    raise OracleError("RNG_ZERO_STATE")


def derive(stream):
    return state_from_digest(hashlib.sha256(encode(stream)).digest())


def rotl(x, k):
    return ((x << k) | (x >> (32 - k))) & M32


def next_u32(s):
    s0, s1, s2, s3 = s
    result = (rotl((s1 * 5) & M32, 7) * 9) & M32
    t = (s1 << 9) & M32
    s2 ^= s0
    s3 ^= s1
    s1 ^= s2
    s0 ^= s3
    s2 ^= t
    s3 = rotl(s3, 11)
    return result, [s0, s1, s2, s3]


def threshold_bp(bp):
    if isinstance(bp, bool) or not isinstance(bp, int) or bp < 0 or bp > 10000:
        raise OracleError("INVALID_PROBABILITY")
    return (bp * TWO32) // 10000


def threshold_prob(p):
    if isinstance(p, bool) or not isinstance(p, (int, float)) or not math.isfinite(p) or p < 0 or p > 1:
        raise OracleError("INVALID_PROBABILITY")
    if 0 < p < 2.0**-32:
        raise OracleError("PROBABILITY_TOO_SMALL")
    return math.floor(p * TWO32)


def uniform_int(s, lo, hi):
    for v in (lo, hi):
        if isinstance(v, bool) or not isinstance(v, int) or abs(v) > MAX_SAFE:
            raise OracleError("INVALID_NUMBER")
    if lo > hi:
        raise OracleError("INVALID_RANGE")
    span = hi - lo + 1
    if span > TWO32:
        raise OracleError("RANGE_TOO_LARGE")
    limit = (TWO32 // span) * span
    for attempt in range(1, GUARD + 1):
        u, s = next_u32(s)
        if u < limit:
            return lo + (u % span), s, attempt
    raise OracleError("RNG_REJECTION_GUARD")


def decode(value):
    if isinstance(value, list):
        return [decode(v) for v in value]
    if isinstance(value, dict):
        if list(value.keys()) == ["$special"]:
            return {"NaN": math.nan, "Infinity": math.inf, "-Infinity": -math.inf, "-0": -0.0}[value["$special"]]
        return {k: decode(v) for k, v in value.items()}
    return value


def run(inp):
    op = inp["op"]
    if op == "encode":
        return {"hex": encode(inp["id"]).hex()}
    if op == "state":
        return {"state": derive(inp["id"])}
    if op == "stateFromDigest":
        return {"state": state_from_digest(bytes.fromhex(inp["digestHex"]))}
    if op == "sequence":
        s, values = derive(inp["id"]), []
        for _ in range(inp["count"]):
            v, s = next_u32(s)
            values.append(v)
        return {"values": values}
    if op == "nextFromState":
        # rng.md v1 "State": exactly four unsigned 32-bit integers, never all zero (validated at every entry point).
        st = inp["state"]
        if not isinstance(st, list) or len(st) != 4 or any(isinstance(w, bool) or not isinstance(w, int) or not 0 <= w < TWO32 for w in st):
            raise OracleError("INVALID_STATE")
        if all(w == 0 for w in st):
            raise OracleError("RNG_ZERO_STATE")
        v, nxt = next_u32(list(st))
        return {"value": v, "state": list(nxt)}
    if op == "thresholdBp":
        return {"threshold": threshold_bp(inp["bp"])}
    if op == "thresholdProb":
        return {"threshold": threshold_prob(inp["p"])}
    if op == "bernoulli":
        s, outcomes, t = derive(inp["id"]), [], inp["threshold"]
        for _ in range(inp["count"]):
            u, s = next_u32(s)
            outcomes.append(u < t)
        return {"outcomes": outcomes}
    if op == "uniformInt":
        s, values, draws = derive(inp["id"]), [], []
        for _ in range(inp["count"]):
            v, s, d = uniform_int(s, inp["lo"], inp["hi"])
            values.append(v)
            draws.append(d)
        return {"values": values, "draws": draws}
    raise SystemExit(f"unknown op {op}")


def evaluate(case):
    try:
        return run(decode(case["input"])), None
    except OracleError as e:
        return None, e.code


def check(path):
    data = json.load(open(path, encoding="utf-8"))
    bad = 0
    for case in data["cases"]:
        got, err = evaluate(case)
        if "expectedError" in case:
            ok = err == case["expectedError"]
        else:
            ok = err is None and got == case["expected"]
        if not ok:
            bad += 1
            print(f"MISMATCH {case['id']}: oracle={got if err is None else err}")
    print(f"rng_oracle: {len(data['cases'])} cases checked, {bad} mismatches ({path})")
    return bad


def fill(draft, out):
    data = json.load(open(draft, encoding="utf-8"))
    for case in data["cases"]:
        if case.get("expected") == "ORACLE":
            got, err = evaluate(case)
            if err is not None:
                raise SystemExit(f"{case['id']}: oracle raised {err}; declare expectedError instead")
            case["expected"] = got
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=True)  # escapes the deliberate lone-surrogate failure input
        f.write("\n")
    print(f"filled {out}")


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--check":
        sys.exit(1 if check(sys.argv[2]) else 0)
    if len(sys.argv) == 4 and sys.argv[1] == "--fill":
        fill(sys.argv[2], sys.argv[3])
        sys.exit(0)
    raise SystemExit(__doc__)
