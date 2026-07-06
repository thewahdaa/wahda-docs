---
title: Configuration groups for managed databases
description: Tune engine parameters (innodb_buffer_pool_size, shared_buffers, max_connections) for managed MySQL, MariaDB and PostgreSQL through the console.
keywords:
  - database parameter tuning
  - configuration group
  - innodb_buffer_pool_size
  - shared_buffers
  - max_connections
  - managed mysql
  - managed postgresql
  - managed mariadb
  - cloud database hosting
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
image: /img/brand/social-card.png
---

# Configuration groups

A **configuration group** is a named bundle of engine parameters — `innodb_buffer_pool_size`, `max_connections`, `shared_buffers`, `work_mem` — that you can attach to one or more managed database instances. Instead of hand-tuning `my.cnf` or `postgresql.conf` on a server you don't have SSH access to, you build the group in the console, attach it, and the instance boots with your settings.

Groups are how you tune performance, raise connection ceilings, and enforce consistent settings across an environment (dev, staging, prod all share the same shape).

---

## Concepts

| Concept | What it is |
|---|---|
| **Configuration group** | A named set of `parameter = value` pairs for a specific datastore + version. |
| **Datastore-scoped** | A group is bound to exactly one datastore + version. A `mysql 8.4` group cannot be attached to a `mysql 8.0` instance, and vice versa. |
| **Parameter** | A single engine setting. Each datastore exposes a curated list of tunable parameters — the console shows only the ones the platform allows you to change. |
| **Attach** | Bind a group to an instance. Some parameters apply live; others require a restart of the instance (the console tells you which). |
| **Detach** | Unbind a group from an instance. The instance falls back to platform defaults. |
| **Values tab** | Where you edit parameter values inside the group. |

:::caution Scoped, not portable
Because groups are tied to a datastore + version pair, you can't reuse a `postgresql 16` group on a `postgresql 17` instance. Make one group per (datastore, version) you run.
:::

---

## Why configuration groups exist

Three concrete reasons to use them instead of leaving defaults alone.

### 1. Fit the parameters to the flavor

Default `innodb_buffer_pool_size` and `shared_buffers` on a fresh instance are conservative — they assume a small VM. On `m1.medium` and especially `m1.large`, you're leaving a lot of RAM on the table. A configuration group with a properly sized buffer pool is often the single biggest performance win on a managed database.

### 2. Raise connection ceilings

Default `max_connections` is set to keep the OS from being overrun. If you run a Django app with 200 workers behind gunicorn and no PgBouncer, you'll hit the ceiling on the first traffic burst. A configuration group with `max_connections` raised solves it in one attach.

### 3. Keep environments in sync

Dev, staging, and prod should behave the same way. Build one configuration group per environment, attach it, and every instance in that environment starts with the same parameters. When you tune, you tune the group once, not each instance.

---

## The configuration groups list

Open **Databases → Configuration Groups** from the left navigation.

<MacFrame
  src="/img/screenshots/databases/config-groups-list.png"
  alt="Configuration Groups list"
  title="Databases › Configuration Groups"
  caption="The Configuration Groups list — every group in the project, showing its datastore, version, and how many instances it's attached to."
/>

Columns:

| Column | Meaning |
|---|---|
| **Name** | The group's label — `mysql-prod-tuned`, `pg17-analytics`. |
| **Datastore / Version** | The engine + version this group is bound to. |
| **Description** | Optional one-liner. |
| **Attached Instances** | How many instances currently use this group. |
| **Created** | Creation timestamp. |

---

## Create a configuration group

1. Click **Create Configuration Group** at the top of the list.
2. Fill in the form:

| Field | Notes |
|---|---|
| **Name** | Recognizable label — `mysql84-prod`, `pg17-tuned-4gb`. Include the datastore, version, and role. |
| **Description** | Optional. One line explaining what this group is for and who owns it. |
| **Datastore** | `mysql`, `mariadb`, `postgresql`. |
| **Datastore Version** | The versions available for the datastore you picked. |

3. Click **Create**. The group opens with an empty parameter list.

Now switch to the **Values** tab to add parameters.

---

## Add and edit parameters

Inside the group, the **Values** tab lists every parameter the platform allows you to tune for this datastore + version.

For each parameter you want to change:

1. Find it in the list (search by name — `innodb_buffer_pool_size`, `max_connections`, `shared_buffers`).
2. Enter a value in its right-hand cell. The console validates the type and range — it will not let you save `abc` in an integer field, or a value outside the allowed range for a parameter with hard bounds.
3. Save.

A short list of "if in doubt, tune these first" parameters by engine:

### MySQL and MariaDB

| Parameter | What it does | Reasonable starting point |
|---|---|---|
| `innodb_buffer_pool_size` | The main InnoDB memory cache. The single biggest performance lever. | 50–70% of the instance's RAM. `m1.medium` (4 GB) → `2G`. `m1.large` (8 GB) → `5G`. |
| `max_connections` | Absolute cap on concurrent client connections. | Raise if your app fleet is bigger than the default. 200–500 is a common bump. |
| `innodb_flush_log_at_trx_commit` | Durability vs. throughput tradeoff for the redo log. | Leave at `1` (safest) for anything you care about. Only lower for throwaway workloads. |
| `slow_query_log` + `long_query_time` | Log queries slower than N seconds — invaluable for finding regressions. | Enable, set `long_query_time = 1`. |
| `character_set_server` / `collation_server` | The default charset and collation for new databases. | `utf8mb4` / `utf8mb4_0900_ai_ci` for modern MySQL. |

### PostgreSQL

| Parameter | What it does | Reasonable starting point |
|---|---|---|
| `shared_buffers` | The main memory buffer. Similar role to InnoDB's buffer pool. | 25% of RAM. `m1.medium` → `1GB`. `m1.large` → `2GB`. |
| `work_mem` | Memory per query operation (sort, hash). Raising helps analytical queries. | `16MB`–`64MB`, depending on how many concurrent queries you run. Don't go wild — it's per-operation, not per-query. |
| `max_connections` | Absolute cap on concurrent connections. | Bump for large app fleets. Consider PgBouncer instead for very large fleets. |
| `effective_cache_size` | The planner's estimate of OS + DB cache available. Doesn't allocate memory — affects plan choice. | 50–75% of RAM. |
| `maintenance_work_mem` | Memory for `VACUUM`, `CREATE INDEX`, `ALTER TABLE`. | `256MB`–`1GB`. Bigger helps big-table operations finish faster. |
| `log_min_duration_statement` | Log queries slower than N ms — like MySQL's slow log. | `1000` (1 second) to start; drop lower once things quiet down. |

The console shows the default value, the value in the group, and (when attached) the live value on the instance. Save moves the group's value to what you set; **apply** happens when the group is attached and the instance is restarted if needed.

---

## Attach a group to an instance

1. Open **Databases → Instances**, click into the instance.
2. Open its **Configuration** tab (or use the action menu → **Attach Configuration Group**).
3. Pick a group from the dropdown. Only groups matching the instance's datastore + version appear.
4. Save.

The instance moves to `PENDING` briefly while the platform applies the parameters. Parameters that can be applied at runtime take effect immediately; parameters that need a restart (labeled in the parameter list) require the instance to restart before they're live.

:::tip Restart timing
When you attach a group with restart-required parameters, the console prompts you to restart the instance. On production, do this in a maintenance window — a restart drops connections briefly and applications need to reconnect.
:::

---

## Detach a group

1. Open the instance's **Configuration** tab.
2. Click **Detach**.
3. Confirm.

The instance falls back to platform defaults. As with attach, restart-required parameters need a restart to fully revert.

---

## Common recipes

### Tune a fresh `m1.large` MySQL 8.4 for a busy web app

Create a group `mysql84-web-prod` (datastore `mysql`, version `8.4`) with:

```
innodb_buffer_pool_size          = 5G
max_connections                  = 300
innodb_flush_log_at_trx_commit   = 1
slow_query_log                   = ON
long_query_time                  = 1
character_set_server             = utf8mb4
collation_server                 = utf8mb4_0900_ai_ci
```

Attach, restart, done.

### Tune a fresh `m1.large` PostgreSQL 17 for a busy web app

Create a group `pg17-web-prod` (datastore `postgresql`, version `17`) with:

```
shared_buffers                = 2GB
effective_cache_size          = 6GB
work_mem                      = 32MB
maintenance_work_mem          = 512MB
max_connections               = 200
log_min_duration_statement    = 1000
```

Attach, restart, done. Add PgBouncer in front if you outgrow `max_connections`.

### Analytics replica with different tuning

Same primary and replica running PostgreSQL 17. Primary uses `pg17-web-prod`. Create a second group `pg17-analytics` with much larger `work_mem` (say `128MB`) and a smaller `max_connections` (say `40`, because the BI tool uses a small pool). Attach it to the replica only. The primary keeps its OLTP tuning; the replica is tuned for big scans.

### One group per environment

- `mysql84-dev` — modest values, everything logged.
- `mysql84-staging` — closer to prod, mirrors prod's tuning.
- `mysql84-prod` — the group above.

Every instance in each environment attaches its environment's group. Changes are made once, at the group level.

---

## What you can't do

- **Attach a group to the wrong datastore or version.** The console filters the dropdown to only compatible groups.
- **Edit a group and expect old attached instances to see the change without a restart if the parameter requires one.** You still need to restart (or wait for the next maintenance) for restart-required parameters to take effect.
- **Set arbitrary parameters.** Only parameters the platform allows you to tune are exposed. If you need one that isn't listed, email **`info@thewahda.com`** with the parameter and the use case.
- **Attach multiple groups to one instance.** One group per instance at a time. Detach the old, attach the new.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| The group doesn't appear when attaching | The group's datastore + version don't match the instance's. Check both. |
| Parameter change didn't take effect | It's a restart-required parameter and the instance hasn't restarted. Restart from the instance detail page. |
| Instance went to `ERROR` after applying a group | A value outside the safe operating range for the flavor (e.g. `innodb_buffer_pool_size` larger than the instance's RAM). Detach the group, restart the instance, edit the group's values back to sane numbers, re-attach. |
| Values tab is empty | New group — you haven't set any parameters yet. Add them from the Values tab. |
| Live value on the instance doesn't match the group | The group has been edited since attach and the instance hasn't restarted, or a restart-required parameter was changed. Restart to reconcile. |

---

## Next steps

- [Create an instance →](/databases/create-instance) — attach a group at creation to boot pre-tuned.
- [Replicas →](/databases/replicas) — a common pattern is one group for the primary, another for the replica.
- [Backups & restore →](/databases/backups) — when you restore into a new instance, remember to attach the same group.
- [Overview →](/databases/overview) — the full service picture.
