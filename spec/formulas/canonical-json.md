# Canonical JSON, semantic records and fingerprints

## v1

### Canonical JSON (RFC 8785 conventions, restricted)
- **Allowed values:** `null`, `true`, `false`, finite numbers, strings, dense arrays and plain objects. Anything else gives `INVALID_JSON_VALUE`: undefined, functions, symbols, BigInt, sparse arrays, class instances, non-finite numbers, or strings containing a lone surrogate.
- **Objects:** keys sorted by UTF-16 code-unit order. Keys must be printable ASCII (0x20–0x7E), so every engine sorts them identically.
- **Numbers:** ECMAScript `Number::toString`, the shortest round-trip form. Integers below 10^21 have no exponent. The exponent form is used when the decimal exponent is ≥ 21 or ≤ −7 (`1e+21`, `1e-7`). `−0` is written `0`. Examples: `1e16 → 10000000000000000`, `0.000001 → 0.000001`, `5e-7 → 5e-7`.
- **Strings:** escaped as `JSON.stringify` does (`\"`, `\\`, `\b`, `\f`, `\n`, `\r`, `\t`, other control characters as `\u00xx`). Non-ASCII characters stay as UTF-8.
- **Whitespace:** none, anywhere.

### Fingerprint
`fingerprint(v) = SHA-256(UTF-8 bytes of canonicalJson(v))`, written as 64 lowercase hex characters.

### Semantic vs environment records (review item F)
Every report has two parts:
- **`semantic`:** the canonical result. It contains only repository-relative paths with `/` separators, and no absolute paths, usernames, hostnames, timestamps or durations. Only this part is fingerprinted.
- **`environment`:** Node version, OS, architecture, Git commit and dirty flag, generation timestamp, and input paths. It is recorded and never fingerprinted.

### Reproduction claim
Identical inputs give an identical semantic fingerprint, tested by running twice on the same machine and runtime. Byte identity across operating systems, CPUs or Node versions is **not claimed** until it has actually been tested.

Fixtures: `spec/fixtures/canonical-json.v1.json`. Independent implementation: `spec/oracle/exact_oracle.py` (`canonical`, `js_number`).
