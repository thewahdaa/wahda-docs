---
title: Backups and restore for managed databases
description: Automated backups, on-demand backups, and restore-to-new-instance for managed MySQL, MariaDB and PostgreSQL on The Wahda Cloud.
keywords:
  - database backup
  - managed database backup
  - point-in-time recovery
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

The backup path is the difference between "we had an incident" and "we lost data." On The Wahda Cloud, managed database instances get **automated nightly backups** and **on-demand backups you can trigger any time** — both stored in object storage in the same region.

Restore is not in-place. A restore creates a **new instance** from a backup you pick; you cut your app over to the new endpoint when it's ready.

This page covers the workflow end to end.

---

## Concepts in one page

| Concept | What it is |
|---|---|
| **Backup** | A consistent full copy of the instance's data at a point in time, stored as an object in the region's object storage. |
| **Automated backup** | A backup the platform takes on the schedule you set (e.g. nightly). Retained for the number of days you configure. |
| **On-demand backup** | A backup you kick off manually from the console. Retained until you delete it. |
| **Restore** | Creating a **new** managed database instance whose data is initialized from a chosen backup. The source instance is untouched. |
| **Retention** | How many days of automated backups the platform keeps. Older ones roll off automatically. |
| **Backup window** | The time-of-day range the automated backup is allowed to run in. Pick low-traffic hours. |

:::info Point-in-time recovery
Today the service restores to the moment a backup completed. Rolling forward through the transaction log to an arbitrary second between backups is not yet exposed. Plan retention around your recovery-point objective: a nightly backup means you may lose up to a day of writes on a full-restore scenario. Take on-demand backups before risky operations.
:::

---

## Turn on automated backups

Open **Databases → Instances**, click into the instance, and open the **Backups** tab.

<MacFrame
  src="/img/screenshots/databases/backups-list.png"
  alt="Database Backups list"
  title="Databases › Backups"
  caption="The Backups list shows every automated and on-demand backup for the project, with status, size, source instance and creation time."
/>

From the instance's backup settings you can configure:

| Field | Notes |
|---|---|
| **Automated Backups** | Toggle on. Off means no scheduled backups — you can still take on-demand ones. |
| **Backup Window** | The hour range the platform is allowed to start the daily backup in. Pick low-traffic hours (`02:00–03:00` is common). |
| **Retention (days)** | How many days of automated backups to keep. Common choices: `7` for staging, `14`–`30` for production. Longer = more object storage cost. |

Save. The first automated backup will run in the next backup window; from then on the platform maintains the retention window for you.

:::tip Start with 14 days
14 days of retention on production catches most "we noticed the bug two days ago and can't tell when the bad row was written" incidents without piling up object storage cost. Bump up if you have compliance obligations that require longer retention.
:::

---

## Take an on-demand backup

Do this before every risky operation — a schema migration, a big data cleanup, a version cutover, a demo, a deploy that touches persistence.

1. Open the instance's **Backups** tab.
2. Click **Create Backup**.
3. Give it a **Name** (`before-schema-v42`, `pre-holiday-cutover`). This is what you'll pick in a hurry during a restore — make it obvious.
4. Optional **Description** — 1-line reminder of what was about to happen.
5. Click **Create**.

The backup moves through `NEW` → `BUILDING` → `COMPLETED`. Completion time scales with data size — small instances complete in seconds, a busy `m1.large` in minutes.

**A backup is only trustworthy once it says `COMPLETED`.** Don't start the risky operation until you see that status.

On-demand backups do not roll off automatically. Delete them from the backups list when you no longer need them, so you're not paying storage on old artifacts.

---

## The backups list

Open **Databases → Backups** for a project-wide view of every backup — automated and on-demand — across every instance.

Columns you'll rely on:

| Column | Use it to |
|---|---|
| **Name** | Find the backup you want. Name on-demand ones descriptively so future-you can spot the right one. |
| **Source Instance** | Which instance the backup came from. Critical during a restore. |
| **Datastore / Version** | Locked to the source. A MySQL 8.4 backup can only restore into a MySQL 8.4 instance. |
| **Status** | `COMPLETED` = usable. `BUILDING` = still being taken. `FAILED` = don't rely on it; re-take. |
| **Created** | When the backup was taken. Restore aims at the newest usable backup before the incident. |
| **Size** | Rough object-storage footprint of this backup. |

Sort by **Created** desc when you need "the most recent good backup fast."

---

## Restore to a new instance

Restore does not overwrite the source instance. It provisions a **new** managed database instance and seeds it from the backup you picked.

1. Open **Databases → Backups**.
2. Find the backup — the newest `COMPLETED` one before the incident, or the on-demand backup you named on purpose.
3. Click **Restore**.
4. In the restore wizard, fill in:

| Field | Notes |
|---|---|
| **Name** | Name the new instance clearly — `app-prod-mysql-restored-2026-07-06`. Do not overwrite the source's name; you may want both running side by side. |
| **Flavor** | Usually the same as the source. Bigger is fine (e.g. restore to `m1.large` to accelerate verification), then rightsize later. |
| **Volume Size** | Must be at least the source's data size. Bigger is fine. |
| **Network / Subnet** | Same private network as the source, so app VMs can reach the new endpoint without extra routing. |
| **Configuration Group** | Attach the same group the source had, so the restored instance boots with the same tuning. |

Click **Create**. The new instance moves through `BUILD` → `BACKUP` / `RESTORE_BACKUP` → `ACTIVE`. Restore time scales with data size.

Once the new instance is `ACTIVE`:

1. Connect and sanity-check the data — count key tables, spot-check recent rows, run the app's health checks against the new endpoint.
2. Update your app's connection string to point at the new instance's endpoint.
3. Roll the app.
4. Once traffic is stable, decide the fate of the original instance — keep it as a "trailer" for forensics, or delete it once you're certain the new one is authoritative.

:::caution Same engine and version
A backup can only be restored into an instance running the **same datastore and version** it came from. A MySQL 8.4 backup cannot restore into MySQL 8.0. To change engine version, restore into the same version, then use logical dump/load to move to the target version.
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

### Version upgrade (major)

The service doesn't do in-place major-version upgrades. To move a workload from PostgreSQL 16 to 18, or MySQL 8.0 to 8.4:

1. Create a new instance on the target version, empty.
2. Use engine-native logical dump/load — `pg_dump` / `pg_restore` for PostgreSQL, `mysqldump` for MySQL/MariaDB — to move schema and data.
3. Validate.
4. Cut the app over. Keep the old instance for a few days, then delete.

For minor version upgrades within the same major, the platform handles patches transparently.

### Duplicate an instance for a load test

1. Take an on-demand backup.
2. Restore it into a new instance on a dedicated staging network.
3. Point your load-generator at the new endpoint.
4. Delete the load-test instance (and its on-demand backup) when done.

---

## Delete a backup

Automated backups roll off after the retention window. On-demand backups do not — delete them yourself when they're no longer useful.

1. Open **Databases → Backups**.
2. Find the backup.
3. Click **Delete**.
4. Confirm.

The object-storage footprint stops accruing once the backup is gone.

---

## Billing

Managed database instances are billed per hour of running state. **Backups consume object storage separately**, at the same rate as any other object-storage usage, invoiced in INR with GST. Longer retention and larger databases mean bigger backup storage bills — the tradeoff is more recovery reach.

A rough rule of thumb: budget roughly one backup's worth of object storage per day of retention (backups compress and dedupe, but the accounting is close enough to plan against).

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| Backup stuck in `BUILDING` for a long time | Large instance under heavy write load. Wait it out; if it hasn't reached `COMPLETED` after several hours, email **`info@thewahda.com`** with the backup ID. |
| Backup `FAILED` | Retake it. If it keeps failing, email support with the backup and instance IDs. Do not rely on a `FAILED` backup as an actual restore target. |
| Restore stuck in `BUILD` | Same shape as create-instance: usually resolves in minutes; contact support past 30 min for the instance ID. |
| Restored instance is missing recent rows | Restore is only as fresh as the backup you picked. Check the backup's `Created` timestamp against when the incident happened. |
| Can't find the `Restore` action | You're on the instance's **Backups** tab, not the project-wide **Backups** page. Both show the button; make sure the backup is `COMPLETED`. |
| Old on-demand backups piling up | Nothing deletes them automatically. Prune from the Backups list. |

---

## Next steps

- [Replicas →](/databases/replicas) — replicas are not backups. Keep both, for different failure modes.
- [Configuration groups →](/databases/config-groups) — tune the restored instance to match the source.
- [Overview →](/databases/overview) — the full service picture.
- [Create a VM →](/compute/create-vm) — the app that will consume the restored instance.
