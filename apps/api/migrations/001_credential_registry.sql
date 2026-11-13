-- Durable credential registry (ADR 001; issue 98; API04, API05).
-- Holds key IDs, digests and state. It never holds a raw key.

CREATE TABLE ozsb_consumers (
  consumer_id text PRIMARY KEY CHECK (consumer_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Revoking a consumer cuts off every key it holds, on the next request.
  revoked_at  timestamptz
);

CREATE TABLE ozsb_api_keys (
  key_id        text PRIMARY KEY CHECK (key_id ~ '^[a-z0-9]{8,32}$'),
  consumer_id   text NOT NULL REFERENCES ozsb_consumers (consumer_id),
  -- SHA-256 of the full key, lowercase hex. A slow hash is unnecessary for a 256-bit secret.
  digest_sha256 text NOT NULL CHECK (digest_sha256 ~ '^[0-9a-f]{64}$'),
  scopes        text[] NOT NULL CHECK (scopes <@ ARRAY['query:execute', 'sources:read', 'capabilities:read']::text[]),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz,
  revoked_at    timestamptz
);

CREATE INDEX ozsb_api_keys_consumer ON ozsb_api_keys (consumer_id);
