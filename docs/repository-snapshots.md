# Repository snapshots

Parcel storage now exposes an explicit repository boundary with optimistic
version checks. The in-memory implementation can export deterministic JSON
snapshots and restore them for recovery exercises.

Snapshots contain only synthetic parcel fields. Their payload is sorted before
serialization and wrapped in a SHA-256 checksum so accidental modification is
detected before restoration.

## Restore rules

- Empty repositories accept a snapshot directly.
- Populated repositories reject restoration by default.
- Callers must explicitly request replacement when overwriting current state.
- Unsupported snapshot versions and invalid checksums fail closed.
