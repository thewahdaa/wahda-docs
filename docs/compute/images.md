---
title: Images
description: Public images available on The Wahda Cloud, and how to upload your own custom OS image.
---

# Images

An **image** is a bootable OS template. When you create a VM you pick an image, and the VM boots into that OS with cloud-init handling the first-boot customization.

Two things you can do on the Images page:

1. **Browse** the public catalog — Ubuntu, AlmaLinux, Rocky, CentOS, Kali, and more. Ready to boot straight from the [Create VM wizard](/compute/create-vm).
2. **Upload your own** — bring a custom OS image (a golden image, a specific distro version, a hardened build) into your project and boot VMs from it.

---

## Where to find them

From the left navigation: **Compute → Images**. The page has four tabs across the top:

| Tab | What's in it |
|---|---|
| **Current Project Images** | Images you (or a teammate on this project) uploaded. Empty on a fresh project. |
| **Public Images** | The platform-wide catalog. Every project sees these. |
| **Shared Images** | Images another project has shared explicitly with yours. |
| **All Images** | Everything you have any right to see, in one list. |

<MacFrame
  src="/img/screenshots/compute/images/01-list-empty.png"
  alt="Current Project Images tab — empty state on a fresh project"
  title="Skyline — Compute › Images"
  caption="Fresh project. Empty on Current Project Images; browse Public for the catalog."
/>

---

## Public catalog

Open **Public Images** to see everything ready to boot. There are 23 images available today — Linux distributions and utilities you'll recognize.

<MacFrame
  src="/img/screenshots/compute/images/02-public-images.png"
  alt="Public Images tab — catalog of ready-to-boot OS images"
  title="Skyline — Compute › Images › Public Images"
  caption="Public catalog: Kali, AlmaLinux 8/9, Ubuntu 24.04, Rocky Linux 8, CentOS Stream 9, and more."
/>

### What you'll find

| Family | Typical entries |
|---|---|
| **Ubuntu** | 24.04 LTS (noble), 26.04 LTS, 22.04 (jammy) server cloud image |
| **AlmaLinux** | 8, 9 |
| **Rocky Linux** | 8 |
| **CentOS** | Stream 9 |
| **Kali** | Latest rolling |
| **Utilities** | cirros (tiny test image for smoke checks) |

Every image ships with:

- **cloud-init** — so your keypair, hostname, and user-data script are applied on first boot.
- **QEMU guest agent** where the image supports it — enables graceful shutdown and console access from the platform.
- Distribution security updates as of the build date.

:::tip Which image to pick
For most new projects: **Ubuntu 24.04 LTS**. It's current, has the longest support window, and matches what most tutorials assume. Pick a specific version only if you have a hard dependency (RHEL-family binary compatibility → Rocky/AlmaLinux; short-lived experiments → cirros).
:::

### Reading a row

| Column | What it means |
|---|---|
| **ID/Name** | Human name + short image ID. Click either to open the details page. |
| **Container Format** | Almost always `Bare` — the disk is a raw OS root, not wrapped in an OVF/OVA container. |
| **Type** | The OS family icon (Ubuntu circle, Rocky feather, AlmaLinux, etc.). |
| **Status** | `Active` means bootable right now. Anything else means the image is still being imported or hidden. |
| **Visibility** | `Public` for the catalog. Your custom uploads default to `Private`. |
| **Disk Format** | `QCOW2` (thin, growable — most images) or `RAW` (bit-for-bit, faster but bigger). |
| **Size** | On-disk footprint of the image itself, not the VM's root disk. |

---

## Upload your own image

The main reason to use this page: **bring your own image**. A hardened Debian, a specific Windows Server build, a golden image with your stack baked in — anything you can produce as a QCOW2 or RAW file.

Click **Create Image** in the top-left.

<MacFrame
  src="/img/screenshots/compute/images/03-create-image.png"
  alt="Create Image form — Upload File tab with all fields visible"
  title="Skyline — Compute › Images › Create Image"
  caption="Upload flow: name, file (or URL), disk & container format, OS metadata, minimum requirements."
/>

Fill it top to bottom.

### Fields

| Field | Notes |
|---|---|
| **Name** | 1–128 chars, letters/digits/`-`/`_`/`.`/`()[]`. Pick something you'll recognize later — `debian-12-nginx-2026-07` beats `image1`. |
| **Upload Type** | **Upload File** *(browser upload)* or **File URL** *(pull from an HTTP/HTTPS URL Glance can reach)*. |
| **File** | The image blob. Click **Click to Upload** and pick your `.qcow2` / `.raw` / `.vmdk` file. |
| **Disk Format** | `QCOW2` (recommended), `RAW`, `VMDK`, `VHD`, `ISO`. Must match the file you're uploading — a mismatch causes launch failures with no useful error. |
| **Container Format** | Leave `Bare` unless you know you're uploading an OVA/OVF/AKI/AMI. |
| **OS** | The family — `linux`, `windows`, `other`. Drives which VM console features (RDP, VNC) are offered. |
| **OS Version** | Free text — `22.04`, `12`, `2022`. Used only for display in the catalog. |
| **OS Admin** | Default admin username baked into the image. `root` for most Linux, `administrator` for Windows. **The Create VM wizard uses this to prefill Login Name in Step 3**, so it matters. |
| **Min System Disk (GiB)** | The minimum root disk the wizard should allow. Set it to your image's uncompressed size + a working margin. |
| **Min Memory (GiB)** | Minimum RAM a flavor must offer for this image to be selectable. Under-set means people boot with too little RAM and blame the OS. |
| **Protected** | If checked, the image cannot be deleted until unchecked. Turn on for anything a production VM boots from. |
| **Usage Type** | `Common Server` for normal images. Other options exist but are for specialized workloads. |

Click **Confirm**. Upload progress shows in the header notification; the row appears under **Current Project Images** and moves from `queued` → `saving` → `active` as Glance ingests it.

:::caution First-boot readiness
Your image needs **cloud-init installed and enabled**. Without it, the keypair, hostname, and user-data script the Create VM wizard sends over don't get applied — and you can't SSH in. If you're building from a stock ISO, install `cloud-init` and enable `cloud-init.service` before you snapshot.
:::

### Preparing an image (checklist)

Before you upload, the image should:

- Have `cloud-init` installed and enabled (`systemctl enable cloud-init`).
- Boot on QEMU/KVM without special drivers. Most cloud-friendly ISOs already do.
- Have SSH server installed (`openssh-server`) and enabled.
- Not have any hard-coded MAC address, IP, or hostname (cloud-init will assign these).
- Not have any user's SSH keys baked in — the wizard installs your keypair on first boot.
- Have `qemu-guest-agent` installed (optional but recommended — enables clean shutdown).

Then export to QCOW2:

```bash
qemu-img convert -O qcow2 source.img output.qcow2
```

Or, on a VM you already built somewhere else, snapshot to QCOW2 directly.

---

## Sharing an image with other projects

By default, an uploaded image is **Private** to the project that uploaded it. To share it with another project, open the image details, change **Visibility** to **Shared**, and provide the target project ID. The other project accepts the share from their **Shared Images** tab.

---

## Delete an image

Under **Current Project Images**, tick the image row → **Delete** button in the header. Public images cannot be deleted from a tenant view; ask the ops team if a public entry is stale.

---

## Next steps

- [Create a VM →](/compute/create-vm) — pick your new image in Step 1 of the wizard.
- [Flavors →](/compute/flavors) — the sizes you can boot the image at.
- [Key pairs →](/compute/keypairs) — the SSH keys the wizard installs on first boot.
