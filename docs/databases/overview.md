---
title: Managed databases (DBaaS) overview
description: Managed MySQL, MariaDB and PostgreSQL on The Wahda Cloud. Backups, read replicas, configuration groups. INR pricing with GST invoicing.
keywords:
  - managed mysql
  - managed postgresql
  - managed mariadb
  - cloud database hosting
  - database as a service
  - high-availability database
  - read replica
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
  - managed database service
image: /img/brand/social-card.png
---

# Managed databases (DBaaS)

Run production-grade **MySQL**, **MariaDB**, or **PostgreSQL** on The Wahda Cloud without babysitting the server. Provisioning, backups, replica setup, and parameter tuning all happen through the same web console you use for VMs — no SSH into the database host, no manual `pg_basebackup`, no cron jobs to remember.

The service is a first-party managed database offering. You pick an engine and a version, choose a flavor, choose a network, and get back a private endpoint your apps can talk to in a few minutes.

<MacFrame
  src="/img/screenshots/databases/instances-list.png"
  alt="Database Instances list in the console"
  title="Databases › Instances"
  caption="The Instances list is home base — every managed database in the project appears here, with its engine, version, flavor and status."
/>

---

## What you get

| Capability | Details |
|---|---|
| **Engines** | MySQL, MariaDB, PostgreSQL — see the version matrix below. |
| **Flavors** | The same compute catalog as VMs — `m1.small`, `m1.medium`, `m1.largex`, `m1.large` — plus a separately sized data disk. |
| **Private endpoint** | Every instance lives on your private network. No public IP unless you place a proxy in front of it. |
| **Backups** | Full backups you take whenever you decide — before a schema migration, before a risky rollout, on your own cadence — stored in object storage. Restore into a new instance. |
| **Read replicas** | Spin up a read-only copy of any instance to offload analytics or scale reads. |
| **Configuration groups** | Version-scoped parameter bundles (`innodb_buffer_pool_size`, `shared_buffers`, `max_connections`, …) that you can attach to one or many instances. |
| **Logs** | Turn the engine's general, slow-query and error logs on per instance and publish them to your project's object storage. |
| **Console-driven** | Everything through `console.thewahda.com`. |
| **Connection details** | Host, port and ready-made connection examples on every instance's detail page. |

---

## Supported engines and versions

Only the versions listed here are supported. Older or newer releases are not exposed to tenants; if you need one, email **`info@thewahda.com`** first and we'll tell you the roadmap.

| Engine | Version | Notes |
|---|---|---|
| **MySQL** | `8.0` | LTS. Safe default for existing 8.x workloads. |
| **MySQL** | `8.4` | Current LTS. Pick this for greenfield MySQL projects. |
| **MariaDB** | `11.4` | LTS. Drop-in for most MySQL 8.x workloads that don't need MySQL-specific features. |
| **PostgreSQL** | `16` | Current stable, long support window. |
| **PostgreSQL** | `17` | Newer stable — improvements in vacuum, logical replication, `EXPLAIN`. |
| **PostgreSQL** | `18` | Latest. Pick this if you want the freshest optimizer and want to stay on a version with the longest remaining support window. |

Once you pick an engine + version pair, that pair is fixed for the life of the instance — there is no version upgrade inside the service. Pick the version you want to stay on.

---

## Flavor guide

| Flavor | vCPU | RAM | Good for |
|---|---|---|---|
| `m1.small` | 1 | 2 GB | Dev, staging, low-traffic side services. |
| `m1.medium` | 2 | 4 GB | Small production apps, a few hundred connections, a few GB of hot data. |
| `m1.largex` | 4 | 4 GB | CPU-heavy but memory-light workloads. |
| `m1.large` | 4 | 8 GB | Serious production workloads — a busy web app's primary store, an analytics warehouse. |

The database disk is **not** part of the flavor — you set **Database Disk (GiB)** separately in the wizard and can grow it later.

:::caution `m1.tiny` is not a database flavor
`m1.tiny` (2 vCPU / 512 MB / 1 GB) is fine for a cirros smoke-test VM but has neither the RAM nor the disk to run a real database. Start at `m1.small`.
:::

If you outgrow `m1.large`, email **`info@thewahda.com`** — larger and memory-optimized shapes can be added on request.

---

## When to use a managed database (and when not to)

### Use managed when

- You want to run **MySQL, MariaDB, or PostgreSQL** and not think about the operator work.
- You want **one-click full backups and restore-to-new-instance** without writing your own `pg_dump` tooling.
- You want to add a **read replica** and route analytics traffic to it without stepping through binlog setup.
- You want **parameter tuning through the console** — attach a configuration group, restart the instance, done.
- You want the database on your **private network** talking to your app VMs with no exposure to the public internet.

### Roll your own on a VM when

- You need an engine we don't offer yet (Redis, MongoDB, ClickHouse, SQL Server, Oracle) — see the engine matrix above.
- You need a MySQL or PostgreSQL version that isn't listed.
- You need direct filesystem or OS-level access — custom extensions from source, `perf`/`strace` on the database process, host-level tuning.
- You're testing a bleeding-edge upstream release for a few hours.

For everything else, managed is faster to stand up, easier to keep running, and cheaper end-to-end once you account for the on-call cost of hand-rolled setups.

---

## Network model

Every managed database instance is **private by default**:

- It gets an address on the private network you chose in the wizard.
- It does **not** get a public IP. You cannot attach a [floating IP](/networking/floating-ips) to a database instance directly.
- Client traffic reaches it from other resources on the same private network — a VM you created with [Create a VM](/compute/create-vm), a Kubernetes cluster, another database (for replication).
- If you need to reach it from your laptop over the internet, the recommended pattern is: SSH into a jump VM on the same private network, then connect to the DB from there. Or run a [VPN](/networking/vpn) into your project's network.

You'll still want a [security group](/networking/security-groups) on the client side (the app VM) — the database instance's own firewalling only accepts traffic on the engine's port (`3306` for MySQL/MariaDB, `5432` for PostgreSQL) from the private network.

---

## High-availability model

The service currently ships **single-primary** database instances with **read replicas** as the scale-out option. Concretely:

- **One writable primary per instance.** The primary is the endpoint your app writes to.
- **Read replicas** are asynchronous read-only copies that trail the primary by a small lag. Add or remove them on demand.
- **Backups** are the disaster-recovery boundary — you take full backups from the console, and you can restore one into a new instance if the primary is lost.
- **Automatic failover** across replicas is on the roadmap, not shipped. If you need synchronous multi-node HA today, run it yourself on VMs and use managed DBaaS for the workloads where async replicas + backups are enough.

The right operational stance today is: **primary + a warm replica for reads**, backups taken often enough to cover your worst-case data loss, and a documented restore drill.

---

## Where to go next

Now you know what the service is. Pick the next step based on where you are:

- **Never created an instance here** → [Create an instance](/databases/create-instance).
- **You have one and want to scale reads** → [Read replicas](/databases/replicas).
- **You care about disaster recovery** → [Backups & restore](/databases/backups).
- **You want to tune engine parameters** → [Configuration groups](/databases/config-groups).
- **You need the app VM that will talk to it** → [Create a VM](/compute/create-vm).
- **You're new to The Wahda Cloud entirely** → [Getting started](/getting-started/overview).

---

## Billing

Managed database instances are billed **per hour of running state**, on the same pay-as-you-go model as VMs, invoiced in INR with GST. The bill includes the flavor's vCPU + RAM + storage; backups consume object storage separately at the standard object-storage rate. Read replicas are billed as separate instances at their own flavor.

If you hit an allocation limit when creating a new instance, email **`info@thewahda.com`** and we'll raise it.
