---
title: Read replicas for managed databases
description: Add read replicas to a managed MySQL, MariaDB or PostgreSQL instance on The Wahda Cloud. Scale reads, offload analytics, and stage failover.
keywords:
  - read replica
  - mysql replica
  - postgresql replica
  - mariadb replica
  - managed database service
  - scale database reads
  - analytics database
  - replica lag
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
image: /img/brand/social-card.png
---

# Read replicas

A **read replica** is a read-only copy of a primary instance that trails the primary asynchronously. You point read-heavy traffic — dashboards, reporting queries, background exports — at the replica so the primary stays free for writes.

The Wahda Cloud lets you add a replica to any running MySQL, MariaDB, or PostgreSQL instance with a few clicks. The platform handles the base copy, the streaming replication setup, and the health monitoring; you get another private endpoint that stays in sync.

---

## What a replica is (and isn't)

| Yes | No |
|---|---|
| A read-only copy of the primary, kept in sync by async replication. | A synchronous multi-writer cluster — writes still only go to the primary. |
| Its own instance with its own endpoint and storage, created with the primary's flavor and disk size. | A snapshot — replicas are live, not a point in time. |
| Removable, and resizable on disk later like any instance. | Independently schemable — schema comes from the primary. |
| Removable at any time without affecting the primary. | An automatic-failover cluster. Promoting a replica today is a manual action. |
| A useful staging ground for a future primary via promotion. | A backup — replicas replicate deletes too. Don't skip [Backups & restore](/databases/backups). |

Replicas lag the primary by a small window — usually sub-second on a healthy network, longer during a burst of writes or a big schema change. Design queries that go to the replica to tolerate that lag.

---

## When to add a replica

### 1. Analytics or reporting is contending with the app

Long dashboard queries, weekly reports, or a BI tool pulling large scans starve your OLTP writes. Point the BI tool at the replica instead. The primary stays reactive; the replica does the heavy scans.

### 2. Read traffic outweighs writes

Product catalogs, search-adjacent lookups, feed reads — anything read-mostly can go to a replica behind a small "read from replica when possible" wrapper in your app. Add replicas one at a time as read load grows.

### 3. Staging a big migration

A replica gives you an isolated place to run heavy verification queries against real production data without touching the primary. You can add one, run the reads, and delete it when you're done.

### 4. Warm secondary for a future manual failover

Keep a replica running as a warm standby. If the primary is lost, promote the replica and cut app traffic over to the new endpoint. This is a manual playbook today — see the [High-availability model](/databases/overview#high-availability-model).

---

## What replicas cost

A replica is a **separate managed database instance**, billed the same as the primary — its own hour meter, in INR with GST. It is created with the **same flavor and the same disk size as the primary** (both are inherited, not chosen), so budget a replica as a second copy of the primary's hourly rate.

---

## Add a replica through the console

A replica is created through the same wizard as any instance. Open **Databases → Instances** and click **Create Database Instance**.

<MacFrame
  src="/img/screenshots/databases/instances-list.png"
  alt="Database Instances list"
  title="Databases › Instances"
  caption="The Instances list. The Role and Master columns show which instances are primaries and which are replicas."
/>

**Step 1 — Details**

| Field | Notes |
|---|---|
| **Database Instance Name** | Recognizable label — `app-prod-mysql-replica-1`, `pg17-analytics-read`. Include the role in the name; you'll thank yourself in six months. |
| **Instance Type** | Switch from `Standalone` to **`Replica`**. |
| **Master Instance** | Pick the primary to replicate from. Datastore, version, flavor and disk size are inherited from it — the wizard hides those fields for a replica. |

**Step 2 — Networking** — pick the private network. The primary's network is the normal choice, so replication traffic never leaves the private plane.

**Steps 3 and 4** (initial database and user, configuration group, locality) don't apply to a replica: it copies the primary's data, users and schema. Click **Create**.

The replica moves through:

1. **`BUILD`** — the platform provisions the replica and takes a base copy of the primary.
2. **`ACTIVE`** — the replica is caught up and streaming.

The whole flow takes minutes for a small database, longer for a large one — mostly the base copy phase, which scales with data size.

Once `ACTIVE`, the replica's detail page has a **Replication** section showing **Role** (`replica`), its **Master**, and — on the primary's page — the list of **Replicas**. The **Connection Information** section gives the replica's own private endpoint.

---

## Verify replication is working

The healthiest signal that replication is working is: write on the primary, read the same row from the replica.

**MySQL / MariaDB**

```sql
-- On the primary
CREATE TABLE IF NOT EXISTS repl_check (id INT PRIMARY KEY, ts DATETIME);
INSERT INTO repl_check VALUES (1, NOW()) ON DUPLICATE KEY UPDATE ts = NOW();

-- On the replica (a couple of seconds later)
SELECT * FROM repl_check;
```

**PostgreSQL**

```sql
-- On the primary
CREATE TABLE IF NOT EXISTS repl_check (id INT PRIMARY KEY, ts TIMESTAMPTZ);
INSERT INTO repl_check VALUES (1, now())
  ON CONFLICT (id) DO UPDATE SET ts = now();

-- On the replica (a couple of seconds later)
SELECT * FROM repl_check;
```

If the `ts` on the replica matches (within lag) what you wrote on the primary, replication is live.

To check the topology from the console, open either instance's detail page — the **Replication** section shows the role, the master, and the replicas.

---

## Point read traffic at the replica

The replica has its own private endpoint. Route traffic to it at the app level; the database won't rewrite your queries for you.

Common patterns:

- **Two connection pools in the app** — a `writer` pool pointed at the primary, a `reader` pool pointed at the replica. All writes and any read that must be perfectly fresh go to `writer`. Reports, dashboards, and eventually-consistent reads go to `reader`.
- **BI tool with its own connection** — point Metabase / Superset / Redash straight at the replica. The BI user's role has read-only access from the start.
- **Background jobs** — nightly exports, ETL to your warehouse, invoicing runs. All safe on the replica.

Don't send writes at the replica — it will refuse them. The engine returns a read-only error (`ERROR 1290 (HY000)` on MySQL, `ERROR 25006` on PostgreSQL). If your app hits that, it's connected to the wrong endpoint.

---

## Understand replication lag

The replica trails the primary by a small window. Under normal load that's fractions of a second; the tail grows during:

- A burst of writes on the primary the replica hasn't caught up on.
- A large schema change (`ALTER TABLE`, `CREATE INDEX`) — the replica may pause while it applies the change.
- A network hiccup between primary and replica (rare on the private plane).

Design read-from-replica code to tolerate seconds of staleness. If a specific query must be perfectly fresh — "did the write I just made land?" — send it to the primary.

---

## Remove a replica

You can delete a replica any time — it does not affect the primary or its data.

1. Go to **Databases → Instances**.
2. Open the replica (not the primary).
3. Click **Delete**.
4. Confirm.

The primary stops streaming to it and the meter stops.

---

## What's not supported today

Being upfront so you plan around it, not into it:

- **Automatic failover** across replicas isn't shipped. Promoting a replica if the primary dies is a manual playbook.
- **Cross-region replicas** aren't offered — replicas live in the same region as the primary.
- **Cascading replicas** (a replica of a replica) — treat every replica as replicating directly from the primary.
- **Multi-primary** or synchronous clusters — the service is single-primary today.

If your workload needs any of those before we ship them, run the DB yourself on VMs and take the operational cost, or email **`info@thewahda.com`** to talk about the roadmap.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| Replica stuck in `BUILD` | Large primary — the base copy takes time. If it doesn't reach `ACTIVE` after an hour, email **`info@thewahda.com`** with both instance IDs. |
| Replication lag growing without bound | A write burst the replica hasn't caught up on, or an expensive `ALTER` being replayed. Wait it out; if it never catches up, delete the replica and create a new one. |
| Replica went to `ERROR` state | Something broke the stream — typically a schema-affecting event applied out of order. Delete the replica and create a new one; the base copy will re-sync from the primary. |
| App writing to the replica's endpoint | Engine will reject with a read-only error. Fix the connection string / pool routing in the app. |
| Reports show data missing rows the primary has | Replica lag. Either wait, run the report on the primary during off-hours, or add a `WHERE created_at < now() - interval '30 seconds'` guard. |

---

## Next steps

- [Backups & restore →](/databases/backups) — a replica is not a backup. Take backups too.
- [Configuration groups →](/databases/config-groups) — attach a read-tuned group to the replica after it's `ACTIVE` (bigger buffer pool, different `work_mem`).
- [Overview →](/databases/overview) — the full picture of the managed database service.
- [Create a VM →](/compute/create-vm) — the app or BI server that will consume the replica.
