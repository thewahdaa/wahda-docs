---
title: Create a managed database instance
description: Provision managed MySQL, MariaDB or PostgreSQL on The Wahda Cloud. Wizard walkthrough — flavors, networks, credentials, first connection.
keywords:
  - create managed database
  - provision mysql
  - provision postgresql
  - provision mariadb
  - cloud database hosting
  - database wizard
  - managed database service
  - private database endpoint
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
image: /img/brand/social-card.png
---

# Create a managed database instance

Provisioning a managed database is a one-form job. You pick an engine and version, a flavor, a network, a name, and a first user. A couple of minutes later you have a private endpoint your apps can talk to.

This page walks the wizard end to end and calls out the choices that are hard to change later.

---

## Before you start

Have these ready — the wizard is short but it doesn't let you jump back to fix a bad choice cleanly.

| You need | Why |
|---|---|
| **The engine and version** | MySQL `8.0`/`8.4`, MariaDB `11.4`, PostgreSQL `16`/`17`/`18`. Locked once the instance is created — a version change means restoring a backup into a new instance. See [Overview](/databases/overview#supported-engines-and-versions). |
| **A flavor** | `m1.small`, `m1.medium`, `m1.largex` or `m1.large`. Fixed for the life of the instance. See [Overview → Flavor guide](/databases/overview#flavor-guide). |
| **A private network** | The instance will get its address here. Put it on the same private network as the app VMs that will talk to it, so traffic never leaves the private plane. |
| **A first database name and user** | You'll create the first application user during the wizard. Extra users and databases can be added later from the instance detail page. |
| **A strong password** | Written down somewhere safe. The console will not let you retrieve it later — you'll have to reset it. |

---

## Open the wizard

From the left navigation of `console.thewahda.com`, go to **Databases → Instances**. The list page shows every managed database in the current project.

<MacFrame
  src="/img/screenshots/databases/instances-list.png"
  alt="Database Instances list"
  title="Databases › Instances"
  caption="The Instances list. Click Create Instance to start the wizard."
/>

Click **Create Database Instance** in the top-left.

---

## Step 1 — Details

<MacFrame
  src="/img/screenshots/databases/create-instance-step1.png"
  alt="Create Database Instance — Step 1 · Details"
  title="Create Database Instance — Step 1 · Details"
  caption="Four steps across the top: Details → Networking → Initialize Databases → Advanced. Pick zone, name, standalone-vs-replica, disk, engine, flavor."
/>

| Field | What to enter |
|---|---|
| **Availability Zone** | Leave the default (`in-north-az1`). Pick a specific AZ only for a multi-AZ layout. |
| **Database Instance Name** | Recognizable label — `app-prod-mysql`, `analytics-pg-17`. Letters, digits, `-`, `_`, `.`. Keep it stable; it appears in dashboards, alerts, and log lines. |
| **Instance Type** | `Standalone` for a fresh primary. Switch to `Replica` when you're adding a read-only copy of an existing instance — see [Read replicas](/databases/replicas). |
| **Database Disk (GiB)** | The dedicated persistent storage for the database files. Include headroom for a full backup restore plus write growth (see the tip below). You can grow the disk later; you can't shrink it. |
| **Datastore Type** | `mysql`, `mariadb`, or `postgresql`. Locked after creation. |
| **Datastore Version** | The supported versions for the datastore you picked. `8.0` or `8.4` for MySQL; `11.4` for MariaDB; `16`, `17`, or `18` for PostgreSQL. Also locked. |
| **Database Flavor** | `m1.small` / `m1.medium` / `m1.largex` / `m1.large`. Filter with the tabs (`All Flavors`, `X86 Architecture`, `Heterogeneous Computing`, `Custom`). The flavor is fixed after creation — only the disk can be grown later — so size for the workload you expect, not the one you have today. |

:::tip Sizing storage
Include enough headroom for a full-size backup restore *plus* a few days of write growth. If your working set is 30 GB and grows at 1 GB/day, 40 GB will be tight in a month — pick 80. Growing later is cheap; running out at 2am isn't.
:::

---

## Step 2 — Networking

Which private network the instance's endpoint will live on. This is a locked choice.

| Field | Notes |
|---|---|
| **Network** | The private network your app VMs are on. If you're using the default project network, pick that. The platform picks a free address on it. |

The database instance's own firewall accepts the engine's port (`3306` for MySQL/MariaDB, `5432` for PostgreSQL) from the private network. Outbound rules on the client VM's [security group](/networking/security-groups) still apply.

:::caution No public IP
Managed database instances are **private by default** and cannot have a [floating IP](/networking/floating-ips) attached. If you need to reach the DB from outside the cloud, put an app VM or a jump host on the same private network and connect through it, or run a [VPN](/networking/vpn).
:::

---

## Step 3 — Initialize Databases

The wizard lets you create the first database and its owning user in one shot.

| Field | Notes |
|---|---|
| **Initial Databases** | The first schema name (`app_prod`, `analytics`). Lowercase, no spaces, digits and underscores fine. For PostgreSQL this becomes the initial database; for MySQL/MariaDB, the initial schema. |
| **Initial Admin User** | The first application user (`app`, `analytics_ro`), granted access to that database. Keep it **separate from any engine superuser** — never let your app connect as root. |
| **Password** / **Confirm Password** | Set a strong one. Store it in your secret manager immediately — the console will not show it again, and there is no reset: a lost password means deleting the user and creating it again. |

Additional databases and users can be added later from the instance detail page's **Databases** and **Users** tabs.

---

## Step 4 — Advanced (optional)

You can leave both blank and change them after creation.

| Field | Notes |
|---|---|
| **Configuration Group** | Attach a configuration group so the instance boots with tuned parameters. Only groups matching this instance's datastore + version show up. See [Configuration groups](/databases/config-groups). |
| **Locality** | `Affinity` / `Anti-Affinity` placement hint. Leave it unset for a single instance. |

---

## After you click Create

Click **Create** in the bottom-right of Step 4. The instance moves through:

1. **`BUILD`** — the platform provisions the compute behind the endpoint and lays down the storage. 30–90 seconds.
2. **`BACKUP` / `RESTORE_BACKUP`** — transient states you may see if the instance is being cloned or restored from a backup.
3. **`ACTIVE`** — ready for connections. The endpoint address for your app appears on the instance's detail page.

If it stalls on `BUILD` for more than 10 minutes, email **`info@thewahda.com`** with the instance ID.

---

## Connect for the first time

Grab the endpoint from **Databases → Instances → \<your-instance\> → Detail**, in the **Connection Information** section: **Host**, **Database Port**, and ready-made **Connection Examples** you can paste.

### From a VM on the same private network

**MySQL / MariaDB**

```bash
mysql -h <endpoint> -P 3306 -u <username> -p <initial-db>
```

**PostgreSQL**

```bash
psql -h <endpoint> -p 5432 -U <username> -d <initial-db>
```

You'll be prompted for the password you set in Step 3.

### Smoke test

Once connected, run one query to prove the round-trip works.

```sql
-- MySQL / MariaDB
SELECT VERSION(), NOW();

-- PostgreSQL
SELECT version(), now();
```

You should see the engine version you picked and the current server time.

---

## After the instance is up

- **Attach a [configuration group](/databases/config-groups)** if you didn't during creation. Parameter tuning (`innodb_buffer_pool_size`, `shared_buffers`, `max_connections`) makes a big difference on `m1.medium` and `m1.large`.
- **Take a [backup](/databases/backups)** right now, and decide how often you'll take one. A production database with no proven backup path is a foot-gun.
- **Consider a [read replica](/databases/replicas)** if you'll ever have analytics or reporting queries competing with your app's writes.
- **Wire your app** to the endpoint. Store the endpoint, port, database name, user and password in your app's secret manager — never in source.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| Stuck in `BUILD` past 10 minutes | Rare. Grab the instance UUID from the URL and email **`info@thewahda.com`**. |
| Instance goes `ACTIVE` but the app can't connect | Check that the app VM is on the **same private network** as the DB. Check the app-side [security group](/networking/security-groups) allows egress on `3306` / `5432`. |
| `Access denied` for the first user | Password mismatch, or the user has no access to that database. Check the **Users** tab — **Grant Databases Access** fixes the latter; for a wrong password, delete the user and create it again. |
| `Too many connections` right after launch | Default `max_connections` is conservative. Attach a [configuration group](/databases/config-groups) that raises it; restart the instance. |
| Ran out of storage | Grow the disk: row action menu → **Configuration Update → Resize Volume**. You can't shrink it back, so grow in reasonable steps. |
| Can't remember the password | The console can't show it and can't reset it — delete the user from the **Users** tab, create it again with a new password, re-grant its databases, and roll the app's secret. |

---

## Next steps

- [Read replicas →](/databases/replicas) — add a read-only copy for analytics or scale.
- [Backups & restore →](/databases/backups) — take backups, restore into a new instance.
- [Configuration groups →](/databases/config-groups) — tune parameters through the console.
- [Create a VM →](/compute/create-vm) — the app server that will consume the database.
- [Security groups →](/networking/security-groups) — control who can talk to the app VM.
