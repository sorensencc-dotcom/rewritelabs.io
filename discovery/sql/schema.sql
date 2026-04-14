-- FILE: C:\Users\soren\rewritelabs.io\discovery\sql\schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE continent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE country (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  continent_id UUID REFERENCES continent(id)
);

CREATE TABLE sweep (
  id UUID PRIMARY KEY,
  level TEXT NOT NULL,
  continent_id UUID REFERENCES continent(id),
  country_id UUID REFERENCES country(id),
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE sweeper_node (
  id UUID PRIMARY KEY,
  name TEXT,
  region TEXT,
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'online',
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  meta JSONB DEFAULT '{}'
);

CREATE TABLE shard (
  id UUID PRIMARY KEY,
  sweep_id UUID REFERENCES sweep(id),
  node_id UUID REFERENCES sweeper_node(id),
  spec JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE candidate (
  id UUID PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  country_id UUID REFERENCES country(id),
  region TEXT,
  category_guess TEXT,
  tech_fingerprint JSONB,
  mobile_score FLOAT,
  ssl BOOLEAN,
  status TEXT NOT NULL DEFAULT 'active',
  last_seen TIMESTAMP DEFAULT NOW(),
  last_sweep_id UUID REFERENCES sweep(id)
);

CREATE TABLE category_index (
  candidate_id UUID REFERENCES candidate(id),
  vertical TEXT,
  geo_key TEXT,
  tech_key TEXT,
  PRIMARY KEY (candidate_id, vertical, geo_key, tech_key)
);