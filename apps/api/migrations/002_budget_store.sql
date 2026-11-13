-- Atomic budget store and per-request usage ledger (ADR 001; issue 99; API06, API07).
-- Amounts are whole cost units. With the fixture responder one query is one unit.

-- A concurrency slot. Slots are not money: an abandoned one is reclaimed when its lease expires.
CREATE TABLE ozsb_budget_leases (
  lease_id    uuid PRIMARY KEY,
  consumer_id text NOT NULL,
  expires_at  timestamptz NOT NULL
);
CREATE INDEX ozsb_budget_leases_consumer ON ozsb_budget_leases (consumer_id, expires_at);

-- One row per admitted request: its reservation and how it was settled. This is the usage ledger.
--   open          reserved, counted in full, not yet settled
--   reconciled    settled once at the usage the request reported
--   conservative  settled once at the reserved amount because no report arrived by reconcile_by
-- A report arriving after conservative settlement is recorded in late_reported, at most once.
CREATE TABLE ozsb_budget_reservations (
  reservation_id uuid PRIMARY KEY,
  consumer_id    text NOT NULL,
  request_id     text NOT NULL,
  budget_day     date NOT NULL,
  reserved       bigint NOT NULL CHECK (reserved > 0),
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reconciled', 'conservative')),
  settled_amount bigint CHECK (settled_amount >= 0),
  late_reported  bigint CHECK (late_reported >= 0),
  created_at     timestamptz NOT NULL,
  reconcile_by   timestamptz NOT NULL,
  settled_at     timestamptz,
  CHECK ((status = 'open') = (settled_amount IS NULL)),
  CHECK (late_reported IS NULL OR status = 'conservative')
);
CREATE INDEX ozsb_budget_reservations_day ON ozsb_budget_reservations (budget_day, consumer_id);
CREATE INDEX ozsb_budget_reservations_open ON ozsb_budget_reservations (reconcile_by) WHERE status = 'open';

-- What a reservation counts against the allowance: an open one in full; a reconciled one at its
-- reported usage; a conservatively settled one at the reserved amount until a late report replaces it.
CREATE FUNCTION ozsb_budget_effective(r ozsb_budget_reservations) RETURNS bigint
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE r.status
    WHEN 'open' THEN r.reserved
    WHEN 'reconciled' THEN r.settled_amount
    ELSE COALESCE(r.late_reported, r.settled_amount)
  END
$$;
