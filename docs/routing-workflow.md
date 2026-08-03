# Routing workflow

The routing workflow separates four responsibilities so changes can be reviewed
as coherent layers:

1. Domain entities validate parcel lifecycle and route capacity.
2. Zone policy identifies compatible routes and ranks their remaining capacity.
3. Routing service coordinates the parcel and route stores.
4. Controller and audit adapters translate results for external consumers.

The implementation is intentionally in-memory and deterministic. It models
transaction boundaries without connecting to any external system.

## Failure behavior

- Invalid parcel input returns a validation response.
- Missing parcels return a not-found response.
- Capacity or zone mismatches return a conflict response.
- Successful and rejected assignments produce immutable audit entries.

## Operator verification

When capacity changes between preview and assignment, the service evaluates the
latest route state and either selects another compatible route or records a
rejection. This keeps the preview advisory while preserving assignment-time
capacity guarantees.
