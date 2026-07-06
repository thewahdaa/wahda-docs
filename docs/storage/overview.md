---
title: Storage
description: Block storage volumes and S3-compatible object storage on The Wahda Cloud. Attach persistent SSD disks to cloud VMs, snapshot for backup, host static assets. Pay-as-you-go INR pricing with GST invoicing.
keywords:
  - block storage
  - SSD volume
  - persistent disk
  - S3-compatible object storage
  - cloud storage bucket
  - volume snapshot
  - volume backup
  - cloud VM disk
  - static asset hosting
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
image: /img/brand/social-card.png
---

# Storage

Two kinds of storage on The Wahda Cloud:

1. **Block storage** — persistent SSD volumes you attach to a VM. Behaves like a physical disk: format it, mount it, put a database on it. Snapshot it for point-in-time copies, back it up for durable off-instance recovery.
2. **Object storage** — S3-compatible bucket storage for anything you'd normally put in AWS S3: static site assets, media libraries, application uploads, backup archives, data-lake dumps. Reach it with any S3-compatible client.

Both live under **Storage** in the left navigation of [`console.thewahda.com`](https://console.thewahda.com).

---

## Block storage volumes

Every VM you launch through the [Create VM wizard](/compute/create-vm) already gets one block volume — its **System Disk** — created automatically. You can attach additional volumes at any time for data that outlives the instance or needs to move between VMs.

### The volume type

The public catalog has one tier today:

| Type | Media | Use case |
|---|---|---|
| **SSD-GP1** | General-purpose SSD | Almost everything — root disks, database storage, application data, media libraries. |

### Where the volumes list lives

From the left navigation: **Storage → Volumes**.

<MacFrame
  src="/img/screenshots/storage/volumes-list.png"
  alt="Storage › Volumes list showing attached volumes"
  title="Storage › Volumes"
  caption="Volumes list. Each row shows Size, Status, Type, which VM the volume is attached to, whether it's bootable, and when it was created."
/>

The header offers **Create Volume**, **Accept Volume Transfer** (paired with another project sending it), and **Delete**. Row actions include **Edit** and **More** (attach/detach, resize, snapshot, transfer).

The row's `Status` values you'll see day-to-day:

| Status | What it means |
|---|---|
| `Available` | Not attached to any VM. Safe to attach, snapshot, or delete. |
| `In-use` | Attached to a VM. The `Attached To` column tells you which one and at which device (`/dev/vda`, `/dev/vdb`). |
| `Reserved` | Being attached — transient. |
| `Creating` / `Deleting` | Provisioning or teardown — transient. |
| `Error` | Something went wrong. Email **`info@thewahda.com`** with the volume ID. |

### Create a volume

Click **Create Volume** at the top of the list.

<MacFrame
  src="/img/screenshots/storage/create-volume.png"
  alt="Create Volume dialog — data source, volume type, capacity, name"
  title="Storage › Volumes › Create Volume"
  caption="Blank volume, image, or snapshot as data source; SSD-GP1 as the only public type; capacity from 1 GiB to 920 GiB via the slider."
/>

| Field | What to enter |
|---|---|
| **Available Zone** | Leave `Not select` unless you need to pin the volume to a specific AZ (multi-AZ layouts). |
| **Data Source Type** | `Blank Volume` for a fresh empty disk, `Image` to seed from an OS image (used automatically when the Create VM wizard makes a boot volume), or `Volume Snapshot` to restore from an existing snapshot. |
| **Volume Type** | Pick `SSD-GP1`. |
| **Capacity (GiB)** | The size you want. The slider goes from 1 GiB to 920 GiB; type an exact number in the box on the right. |
| **Name** | 1–128 chars, letters/digits/`-`/`_`/`.`. Pick something you'll recognize — `webapp-data-2026`, not `vol1`. |
| **Count** | Leave `1` unless you're batch-creating identical disks. |

Click **Confirm**. The volume moves through `Creating` → `Available` in a few seconds.

### Attach a volume to a VM

From the volume's row → **More → Attach**, pick the VM, and confirm. The device name (`/dev/vdb`, `/dev/vdc`, …) is picked by the platform.

On the VM, format the fresh volume once and mount it:

```bash
sudo mkfs.ext4 /dev/vdb
sudo mkdir -p /mnt/data
sudo mount /dev/vdb /mnt/data
```

Persist the mount across reboots by adding to `/etc/fstab` — get the volume's UUID with `sudo blkid /dev/vdb` and add:

```text
UUID=<uuid> /mnt/data ext4 defaults,nofail 0 2
```

`nofail` matters — if the volume is ever detached, the VM will still boot without dropping into an emergency shell.

### Resize (grow) a volume

From the volume's row → **More → Extend Volume**. Type the new (larger) size and confirm. You can only grow — never shrink.

After the platform grows the underlying storage, tell the guest OS:

```bash
# ext4
sudo resize2fs /dev/vdb

# xfs
sudo xfs_growfs /mnt/data
```

### Detach and reattach

Detach frees the volume from the current VM without deleting it. Reattach it to any other VM in the same project. Great for one-shot data migrations: create fresh VM → detach old VM's data volume → attach to new VM → cut over.

### Delete a volume

The volume must be `Available` (detached) before you can delete it. Tick the row → **Delete** in the header. If you might want the data later, take a snapshot first — deleting is irreversible.

---

## Snapshots vs. backups

Two similar-sounding but distinct concepts. Pick based on what you need to survive.

| | **Volume Snapshot** | **Volume Backup** |
|---|---|---|
| **What it is** | Point-in-time reference to a volume's data, stored on the same underlying storage system. | Full copy of the volume's data written to durable object storage, independent of the source volume. |
| **Speed** | Near-instant to create. | Slower — proportional to volume size. |
| **Where the data sits** | Same storage backend as the source. If that backend has a bad day, both go together. | Separate object storage. Survives loss of the source volume. |
| **Cost** | Small — only differential blocks are stored. | Larger — full data copy, billed per GB of backup storage. |
| **Restore path** | Create a new volume with **Data Source Type = Volume Snapshot**. | Restore into a new volume from **Storage → Volume Backups → Restore**. |
| **When to use** | Fast, cheap rollback points during a risky config change or before a deploy. | Disaster recovery. Compliance retention. Off-site copy for a critical database. |

**Rule of thumb**: snapshots for "I might want to roll this back in the next hour"; backups for "I need this data next month if everything else is gone."

Both are managed under **Storage → Volume Snapshots** and **Storage → Volume Backups**.

---

## Object storage (S3-compatible)

For unstructured data — static site assets, images, videos, application uploads, backup archives, log dumps — use object storage. Buckets look and feel like AWS S3, and any S3-compatible tool works against them.

### Where buckets live

From the left navigation: **Storage → Object Storage**. The page lists every bucket in the current project. Fresh project → empty list.

### The endpoint

```
https://api.thewahda.com:6780/swift/v1
```

This one endpoint serves the S3-compatible API. Point any AWS SDK, `aws-cli`, or third-party S3 tool at it.

### Configure `aws-cli`

Create a profile that talks to the endpoint above with your credentials:

```bash
aws configure --profile wahda
# AWS Access Key ID:     <your access key>
# AWS Secret Access Key: <your secret>
# Default region name:   in-north-1
# Default output format: json
```

You get access credentials from the console — see [Application credentials](/identity/users-and-projects#application-credentials) for the recommended way to create machine credentials.

Then override the endpoint on every call:

```bash
aws --profile wahda --endpoint-url https://api.thewahda.com:6780/swift/v1 s3 ls
```

### Common recipes

**Create a bucket and upload a file:**

```bash
aws --profile wahda --endpoint-url https://api.thewahda.com:6780/swift/v1 s3 mb s3://my-assets
aws --profile wahda --endpoint-url https://api.thewahda.com:6780/swift/v1 s3 cp \
    ./photo.jpg s3://my-assets/photo.jpg
```

**Host a static site's assets:**

```bash
aws --profile wahda --endpoint-url https://api.thewahda.com:6780/swift/v1 s3 sync \
    ./dist/ s3://my-assets/site/ --delete
```

**Nightly offsite database dump:**

```bash
# in a cron / systemd timer on a jump VM
pg_dump -h db-endpoint -U analytics analytics | gzip | \
  aws --profile wahda --endpoint-url https://api.thewahda.com:6780/swift/v1 \
    s3 cp - s3://backups/pg-$(date +%F).sql.gz
```

**Download an entire bucket:**

```bash
aws --profile wahda --endpoint-url https://api.thewahda.com:6780/swift/v1 s3 sync \
    s3://my-assets ./local-copy/
```

### Public vs. private objects

By default, every object you upload is private — only requests carrying your credentials can read it. If you want a bucket's contents publicly readable (e.g. static site assets), grant public read via ACL or bucket policy on that specific bucket. Do **not** make a bucket world-writeable — that's how you end up hosting other people's malware.

---

## Region and availability

Both block volumes and object storage buckets are **region-scoped**. Today the only region is `in-north-1` (Hyderabad datacenter, single AZ `in-north-az1`). Multi-region replication is not exposed yet — if you need offsite copies today, run a scheduled sync into a remote provider from a jump VM.

---

## Cost model

Pay-as-you-go:

- **Block volumes** — billed per GB per month for the allocated capacity, whether attached or detached, whether the VM is running or stopped. Delete volumes you're not using.
- **Volume backups** — billed per GB of backup storage consumed.
- **Object storage** — billed per GB stored + egress out of the region. Ingress and intra-region transfer are free.

Invoiced in INR with GST-compliant billing.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| Volume stuck in `Creating` for more than 60 seconds | Rare. Email **`info@thewahda.com`** with the volume ID. |
| Cannot detach — "volume in use" | The VM's OS is still writing to the mount. `sudo umount /mnt/data` first, then detach. |
| `resize2fs` says "nothing to do" after Extend | The extend didn't propagate yet. Check the volume shows the new size in the console; wait a moment; retry. |
| `aws s3 ls` returns `Could not connect` | The `--endpoint-url` is missing or the client machine can't reach `api.thewahda.com:6780`. Confirm both. |
| `aws s3 ls` returns `403 Forbidden` | The credentials profile is wrong or lacks permission on the bucket. Regenerate the [application credential](/identity/users-and-projects#application-credentials) and retry. |
| Uploaded object isn't publicly reachable | Objects are private by default. Set a bucket policy or per-object ACL for public read. |

---

## Next steps

- [Create a VM →](/compute/create-vm) — the compute that attaches your volumes.
- [Backups & restore →](/databases/backups) — how managed databases use object storage for backups.
- [Application credentials →](/identity/users-and-projects#application-credentials) — machine access keys for CI and scripts.
