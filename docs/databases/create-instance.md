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
| **A flavor** | `m1.small`, `m1.medium`, or `m1.large`. See [Overview → Flavor guide](/databases/overview#flavor-guide). |
| **A private network + subnet** | The instance will get its address here. Put it on the same private network as the app VMs that will talk to it, so traffic never leaves the private plane. |
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

Click **Create Instance** in the top-right.

---

## Step 1 — Base config

<MacFrame
  src="/img/screenshots/databases/create-instance-step1.png"
  alt="Create Instance — Step 1 · Base Config"
  title="Create Instance — Step 1 · Base Config"
  caption="Pick the engine, version, flavor, name and storage size."
/>

| Field | What to enter |
|---|---|
| **Name** | Recognizable label — `app-prod-mysql`, `analytics-pg-17`. Letters, digits, `-`, `_`, `.`. Keep it stable; it appears in dashboards, alerts, and log lines. |
| **Description** | Optional one-liner — what this database is for, who owns it. |
| **Datastore** | `mysql`, `mariadb`, or `postgresql`. Locked after creation. |
| **Datastore version** | The supported versions for the datastore you picked. `8.0` or `8.4` for MySQL; `11.4` for MariaDB; `16`, `17`, or `18` for PostgreSQL. Also locked. |
| **Flavor** | `m1.small` / `m1.medium` / `m1.large`. You can resize later; you can't shrink below what the data uses. |
| **Volume Size (GB)** | The dedicated persistent storage for the database files. Start with the flavor default (20 / 40 / 80 GB); the wizard lets you go higher. You can grow storage later; you can't shrink it. |
| **Volume Type** | Leave the default unless the platform team asked you to pick a specific tier. |

:::tip Sizing storage
Include enough headroom for a full-size backup restore *plus* a few days of write growth. If your working set is 30 GB and grows at 1 GB/day, 40 GB will be tight in a month — pick 80. Growing later is cheap; running out at 2am isn't.
:::

---

## Step 2 — Network

Which private network the instance's endpoint will live on. This is a locked choice.

| Field | Notes |
|---|---|
| **Network** | The private network your app VMs are on. If you're using the default project network, pick that. |
| **Subnet** | Optional. If the network has multiple subnets and you want to pin the DB to one, pick it here. Otherwise the platform picks a subnet with free addresses. |
| **Security context** | The database instance's own firewall accepts the engine's port (`3306` for MySQL/MariaDB, `5432` for PostgreSQL) from the private network. Outbound rules on the client VM's [security group](/networking/security-groups) still apply. |

:::caution No public IP
Managed database instances are **private by default** and cannot have a [floating IP](/networking/floating-ips) attached. If you need to reach the DB from outside the cloud, put an app VM or a jump host on the same private network and connect through it, or run a [VPN](/networking/vpn).
:::

---

## Step 3 — Initial database and user

The wizard lets you create the first database and its owning user in one shot.

| Field | Notes |
|---|---|
| **Initial Database** | The first schema name (`app_prod`, `analytics`). Lowercase, no spaces, digits and underscores fine. For PostgreSQL this becomes the initial database; for MySQL/MariaDB, the initial schema. |
| **Username** | The first application user (`app`, `analytics_ro`). Keep this **separate from any admin account** — never let your app connect as root. |
| **Password** | Set a strong one. Store it in your secret manager immediately — the console will not show it again. |
| **Host** | For MySQL/MariaDB, restricts which hosts the user can connect from. `%` allows any host inside the private network; a specific address restricts to that IP. |

Additional databases and users can be added later from the instance detail page's **Databases** and **Users** tabs.

---

## Step 4 — Backups and configuration (optional)

You can leave both blank and change them after creation.

| Field | Notes |
|---|---|
| **Configuration Group** | Attach a configuration group so the instance boots with tuned parameters. Only groups matching this instance's datastore + version show up. See [Configuration groups](/databases/config-groups). |
| **Backup Window / Schedule** | If you want automated backups from day one, set the schedule here. Otherwise use the instance's **Backups** tab afterwards to enable it. See [Backups & restore](/databases/backups). |
| **Backup Retention** | How many days of automated backups to keep. Balance restore reach against object-storage cost. |

---

## Step 5 — Review and create

The Review step summarizes every choice with an editable pencil next to each. Read every field, then click **Create**.

The instance moves through:

1. **`BUILD`** — the platform provisions the VM behind the endpoint and lays down the storage. 30–90 seconds.
2. **`BACKUP` / `RESTORE_BACKUP`** — transient states you may see if the instance is being cloned or restored from a backup.
3. **`ACTIVE`** — ready for connections. The **Endpoint** row on the detail page shows the private IP and port.

If it stalls on `BUILD` for more than 10 minutes, email **`info@thewahda.com`** with the instance ID.

---

## Connect for the first time

Grab the endpoint from **Databases → Instances → \<your-instance\> → Detail**. It's a private address plus the engine's default port.

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
- **Turn on automated [backups](/databases/backups)** and take an on-demand backup right now. A production database with no proven backup path is a foot-gun.
- **Consider a [read replica](/databases/replicas)** if you'll ever have analytics or reporting queries competing with your app's writes.
- **Wire your app** to the endpoint. Store the endpoint, port, database name, user and password in your app's secret manager — never in source.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| Stuck in `BUILD` past 10 minutes | Rare. Grab the instance UUID from the URL and email **`info@thewahda.com`**. |
| Instance goes `ACTIVE` but the app can't connect | Check that the app VM is on the **same private network** as the DB. Check the app-side [security group](/networking/security-groups) allows egress on `3306` / `5432`. |
| `Access denied` for the first user | Password mismatch or, for MySQL/MariaDB, the user's `Host` doesn't match the client's private IP. Reset the password from the **Users** tab and set `Host` to `%` if you're not sure. |
| `Too many connections` right after launch | Default `max_connections` is conservative. Attach a [configuration group](/databases/config-groups) that raises it; restart the instance. |
| Ran out of storage | Grow the volume from the instance's detail page — you can't shrink it back, so grow in reasonable steps. |
| Can't remember the password | The console can't show it — reset it from the **Users** tab and roll the app's secret. |

---

## Next steps

- [Read replicas →](/databases/replicas) — add a read-only copy for analytics or scale.
- [Backups & restore →](/databases/backups) — schedule automated backups, take on-demand ones, restore into a new instance.
- [Configuration groups →](/databases/config-groups) — tune parameters through the console.
- [Create a VM →](/compute/create-vm) — the app server that will consume the database.
- [Security groups →](/networking/security-groups) — control who can talk to the app VM.
