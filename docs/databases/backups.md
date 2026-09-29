---
title: Backups and restore for managed databases
description: On-demand backups and restore-to-new-instance for managed MySQL, MariaDB and PostgreSQL on The Wahda Cloud.
keywords:
  - database backup
  - managed database backup
  - restore database
  - mysql backup
  - postgresql backup
  - mariadb backup
  - disaster recovery
  - cloud database hosting
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
image: /img/brand/social-card.png
---

# Backups and restore

The backup path is the difference between "we had an incident" and "we lost data." On The Wahda Cloud, you take a **full backup of a managed database instance whenever you decide** — before a migration, before a deploy, on a cadence you own — and the backup is stored in object storage in the same region.

Restore is not in-place. A restore creates a **new instance** from a backup you pick; you cut your app over to the new endpoint when it's ready and delete the original when you're done.

This page covers the workflow end to end.

---

## Concepts in one page

| Concept | What it is |
|---|---|
| **Backup** | A consistent full copy of the instance's data at the moment the backup completed, stored as an object in the region's object storage. |
| **On-demand** | Every backup is one you start from the console. There is no scheduler in the service today — if you want a nightly backup, that cadence is yours to run. |
| **Restore** | Creating a **new** managed database instance whose data is initialized from a chosen backup. The source instance is untouched. |
| **Retention** | Backups stay until you delete them. Nothing rolls off automatically, so prune old ones yourself. |

:::info No scheduler, no point-in-time recovery — yet
Backups are taken when you click **Create Database Backup**, and a restore lands on the moment that backup completed. Scheduled backups and rolling forward through the transaction log are on the roadmap, not shipped. Plan around that: decide how much data you can afford to lose, take a backup at least that often, and always take one before a risky operation.
:::

---

## Take a backup

Do this before every risky operation — a schema migration, a big data cleanup, a version cutover, a demo, a deploy that touches persistence — and on whatever regular cadence your recovery-point objective needs.

<MacFrame
  src="/img/screenshots/databases/backups-list.png"
  alt="Database Backups list"
  title="Databases › Backups"
  caption="The Backups list shows every backup in the project, with its source instance, status and creation time."
/>

1. Open **Databases → Backups**.
2. Click **Create Database Backup**.
3. Pick the **Database Instance** to back up.
4. Give it a **Name** (`before-schema-v42`, `pre-holiday-cutover`). This is what you'll pick in a hurry during a restore — make it obvious.
5. Optional **Description** — 1-line reminder of what was about to happen.
6. Click **Create**.

The backup moves through `NEW` → `BUILDING` → `COMPLETED`. Completion time scales with data size — small instances complete in seconds, a busy `m1.large` in minutes.

**A backup is only trustworthy once it says `COMPLETED`.** Don't start the risky operation until you see that status.

Backups do not roll off automatically. Delete them from the backups list when you no longer need them, so you're not paying storage on old artifacts.

---

## The backups list

Open **Databases → Backups** for a project-wide view of every backup across every instance. An instance's own **Backups** tab shows the same backups filtered to that instance, with:

| Column | Use it to |
|---|---|
| **Name** | Find the backup you want. Name backups descriptively so future-you can spot the right one. |
| **Created At** | When the backup was taken. Restore aims at the newest usable backup before the incident. |
| **Backup File** | Where the backup object lives in object storage. |
| **Incremental** | Whether this backup is incremental to an earlier one (full backups show `false`). |
| **Status** | `COMPLETED` = usable. `BUILDING` = still being taken. `FAILED` = don't rely on it; re-take. |

A backup can only be restored into the same engine and version it came from — a MySQL 8.4 backup restores into MySQL 8.4.

---

## Restore to a new instance

Restore does not overwrite the source instance. It provisions a **new** managed database instance seeded from the backup you pick. The original keeps running, with its data and its address, until you delete it yourself.

1. Go to **Databases → Backups**.
2. Find the backup: the newest `COMPLETED` one before the incident, or the backup you took on purpose. **Restore** is offered only on `COMPLETED` backups.
3. Click **Restore** and fill in **Restore to New Instance**.

| Field | What to put |
|---|---|
| **New Instance Name** | Pre-filled as `<original>-restored`. If this restore is a replacement, give it the name the application will use from now on. |
| **Database Flavor** | Pre-filled with the original's flavor. Choose a larger one if the restored copy will carry more load. |
| **Database Disk (GiB)** | Pre-filled with the original's disk size, which is the minimum: the restored data has to fit. Larger is fine, smaller is not. |
| **Network** | The private network the new instance's address will live on. Normally the same one as the original, so your application servers reach it without a routing change. |
| **After Restore** | A single checkbox that deletes the original once the restored instance reports `ACTIVE`. Off by default, and it should usually stay off. See below. |

The new instance appears in **Databases → Instances** and moves from `BUILD` to `ACTIVE`. How long that takes scales with the size of the data.

:::caution The restored instance has its own address
A restore never reuses the original's address. The new instance gets a new one, so the application has to be pointed at it. Renaming an instance does not move its address. Plan the cutover before you start.
:::

### Cutting over to the restored instance

Do these in order, and keep the original until the last step.

1. Wait for the new instance to reach `ACTIVE`.
2. Connect to it and check the data. Count the rows in the tables you care about, spot-check the most recent records, and run the application's own health checks against it.
3. Re-attach the [configuration group](/databases/config-groups) the original used. A backup does not carry the group attachment.
4. Stop writes to the original, point the application's connection string at the new address, and roll the application.
5. Only when traffic is stable and you trust the data, delete the original from **Databases → Instances** so you stop paying for two.

The **After Restore** checkbox automates step 5 and skips steps 2 to 4, which is why it is off by default. A restore is usually a copy taken to recover a few rows or to try something on real data, and until you have looked at the restored data the original is your only way back. Turn it on only when the original is already unusable. Nothing is deleted if the restore fails, and an original that still has read replicas is never deleted.

:::caution Same engine and version
A backup can only be restored into an instance running the **same datastore and version** it came from. A MySQL 8.4 backup cannot restore into MySQL 8.0.
:::

---

## Restore recipes

### Recover from a bad migration

You ran a schema migration and half the app broke.

1. Stop the app (or put it in read-only mode).
2. Find the on-demand backup you took just before the migration.
3. Restore it into a new instance.
4. Verify.
5. Point the app at the new endpoint. Delete the broken original once you're happy.

### Clone production to staging

You want a copy of production data (or a subset) to test against.

1. Take an on-demand backup of production named `staging-clone-YYYY-MM-DD`.
2. Restore it into a new instance in your staging network.
3. Redact / mask sensitive data in the clone before you let staging users touch it.
4. Delete the clone (and the on-demand backup) when you're done.

### Duplicate an instance for a load test

1. Take an on-demand backup.
2. Restore it into a new instance on a dedicated staging network.
3. Point your load-generator at the new endpoint.
4. Delete the load-test instance (and its on-demand backup) when done.

---

## Delete a backup

Backups never roll off on their own — delete them yourself when they're no longer useful.

1. Open **Databases → Backups**.
2. Find the backup.
3. Click **Delete**.
4. Confirm.

The object-storage footprint stops accruing once the backup is gone.

---

## Billing

Managed database instances are billed per hour of running state. **Backups consume object storage separately**, at the same rate as any other object-storage usage, invoiced in INR with GST. Longer retention and larger databases mean bigger backup storage bills — the tradeoff is more recovery reach.

A rough rule of thumb: budget one backup's worth of object storage for every backup you keep. Take one every night and keep two weeks, and that's roughly fourteen copies.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| Backup stuck in `BUILDING` for a long time | Large instance under heavy write load. Wait it out; if it hasn't reached `COMPLETED` after several hours, email **`info@thewahda.com`** with the backup ID. |
| Backup `FAILED` | Retake it. If it keeps failing, email support with the backup and instance IDs. Do not rely on a `FAILED` backup as an actual restore target. |
| Restored instance stuck in `BUILD` | Same shape as create-instance: it usually clears in minutes. If it is past 30 minutes, email support with the instance ID. |
| Restored instance is missing recent rows | Restore is only as fresh as the backup you picked. Check the backup's creation time against when the incident happened — and take backups more often if that gap hurts. |
| **Restore** missing on a backup | The action is offered only on `COMPLETED` backups. A `FAILED` or still-running backup cannot be restored. |
| Old backups piling up | Nothing deletes them automatically. Prune from the Backups list. |

---

## Next steps

- [Replicas →](/databases/replicas) — replicas are not backups. Keep both, for different failure modes.
- [Configuration groups →](/databases/config-groups) — tune the restored instance to match the source.
- [Overview →](/databases/overview) — the full service picture.
- [Create a VM →](/compute/create-vm) — the app that will consume the restored instance.
