---
title: Create a virtual machine
description: Launch your first Linux VM on The Wahda Cloud in about five minutes — pick a size, an OS, a network, and you're online.
---

# Create a virtual machine

Spin up a Linux virtual machine from the console in about five minutes. This page walks the **Create Instance** wizard end-to-end — sizing, OS, storage, network, access — one screen per step.

> **Before you start**
> - An account on [console.thewahda.com](https://console.thewahda.com) — see [Sign up & first login →](/getting-started/sign-up).
> - Enough room in the project for the VM. The wizard shows live usage of the project's compute and storage allocation on the right as you build; if you're bumping against it, [raise it →](/getting-started/projects-and-quotas#hit-a-soft-limit).
> - An SSH public key. Don't have one? The wizard can generate one for you in Step 3.

---

## Concepts

| Concept | What it is |
|---|---|
| **Project** | The tenant boundary. Instances, networks, volumes, and IPs all live inside one project. |
| **Availability zone** | A failure-isolated location inside a region. Pick the default unless you're explicitly running multi-AZ. |
| **Specification** | A pre-defined VM size — vCPU + memory + included internal-network bandwidth. |
| **Image** | A bootable OS template — Ubuntu, Debian, Rocky Linux, Windows, etc. |
| **System Disk** | The root disk created at launch, attached as a persistent volume. |
| **Network** | A private network inside your project, optionally connected to the internet via a router. |
| **Security Group** | A firewall ruleset attached to the VM. Defaults block all inbound traffic. |
| **Key Pair** | The SSH keypair installed at boot so you can log into the VM. |

---

## 1. Open the wizard

From the left navigation: **Compute → Instances**. The list shows every VM in the current project.

<MacFrame
  src="/img/screenshots/compute/create-vm/01-instances-list.png"
  alt="Compute › Instances list with the Create Instance button in the top-left"
  title="Skyline — Compute › Instances"
  caption="Click Create Instance to launch the wizard."
/>

Click **Create Instance** in the top-left of the table.

---

## 2. Step 1 — Base Config

The longest step of the wizard. You're picking the physical shape of the VM: zone, size, OS image, and root disk. The stepper at the top always shows where you are; the usage panel on the right updates live as you make choices.

<MacFrame
  src="/img/screenshots/compute/create-vm/02-step1-empty.png"
  alt="Step 1 of the Create Instance wizard — empty Base Config form"
  title="Create Instance — Step 1 · Base Config (empty)"
  caption="Fresh Step 1: stepper at top, live usage panel on the right, form waiting to be filled."
/>

Fill it in top to bottom.

### a) Available Zone

Leave the default (e.g. `in-north-az1`). Pick a specific AZ only if you need to pin location for multi-AZ HA.

### b) Specification (flavor)

Each row is a pre-defined size — vCPU, memory, included internal-network bandwidth. Click the radio on the row to select it. The **Selected** chip below the table reflects your pick, and the usage panel on the right updates so you can see how the shape fits your project's current allocation.

For a first VM, **`m1.small` (1 vCPU / 2 GB RAM)** is a good starting point.

| Flavor (typical) | vCPU | RAM | Use case |
|---|---|---|---|
| `m1.tiny` | 2 | 512 MB | Trial / smallest workload |
| `m1.small` | 1 | 2 GB | Single-service container, light web app |
| `m1.medium` | 2 | 4 GB | Web app, CI runner, small worker |
| `m1.large` | 4 | 8 GB | Production app server, small DB |

### c) Start Source & Operating System

Leave **Start Source** on the default **Image** tab. The other tabs let you boot from an existing snapshot or volume.

Under **Operating System**, click the OS family icon — **Ubuntu**, Debian, Fedora, Rocky, Windows, etc. — then click the row of the image you want in the table below. We recommend the latest LTS for Linux.

:::tip Click anywhere on the row
Name, Project, System Version — any cell selects the image. The blue radio dot on the left appears once selected.
:::

### d) System Disk

| Field | Set it to |
|---|---|
| **Boot From Volume** | `Yes - Create a new system disk` *(default)*. Gives the VM a persistent root disk. |
| **System Disk → Type** | `SSD-GP1` (general-purpose SSD). |
| **System Disk → Size** | At least **20 GiB**. The image sets the minimum; the wizard rejects anything smaller. |
| **Deleted with the instance** | Leave checked. Uncheck only if you want the root volume to survive instance deletion. |
| **Data Disk** *(optional)* | Click **Add Data Disks** for additional persistent volumes. |
| **Count** | `1` — bump higher to launch identical copies of this configuration. |

When everything is filled you'll see the whole step summarized like this — flavor selected, image selected, disk type + size set — and the **Next: Network Config** button lights up in the bottom-right:

<MacFrame
  src="/img/screenshots/compute/create-vm/03-step1-filled.png"
  alt="Step 1 filled — flavor, Ubuntu image, and 20 GB SSD-GP1 root disk"
  title="Create Instance — Step 1 · Base Config (filled)"
  caption="m1.small + Ubuntu 22.04 LTS + SSD-GP1 20 GiB. Next: Network Config is active."
/>

Click **Next: Network Config**.

---

## 3. Step 2 — Network Config

Attach the VM to a **private network** inside your project. On landing you see the empty form with tabs for Current Project / Shared / External / All networks and the Security Group section further down.

<MacFrame
  src="/img/screenshots/compute/create-vm/04-step2-empty.png"
  alt="Step 2 of the wizard — empty Network Config form"
  title="Create Instance — Step 2 · Network Config (empty)"
  caption="Step 2 landing. Pick one network row, then attach a security group below."
/>

Tick the checkbox on the network row you want; the subnet auto-selects from the network's first subnet.

<MacFrame
  src="/img/screenshots/compute/create-vm/05-step2-selected.png"
  alt="Step 2 with a network selected — demo-network-vpc row checked"
  title="Create Instance — Step 2 · Network Config (selected)"
  caption="Network selected. Virtual LAN is automatically assigned; scroll down to tick a security group."
/>

| Field | What to choose |
|---|---|
| **Network** | A private network inside your project. Most projects come with a `demo-network-vpc` created automatically. |
| **Virtual LAN** | Inherited from the network's first subnet — change only if you have multiple. |
| **Security Groups** | The firewall ruleset(s) attached to the VM. Defaults block all inbound traffic. **To SSH in, attach a group that allows port 22.** See [Security groups →](/networking/security-groups). |

Click **Next: System Config**.

---

## 4. Step 3 — System Config

Give the VM a name and pick how you'll log in.

<MacFrame
  src="/img/screenshots/compute/create-vm/06-step3-empty.png"
  alt="Step 3 of the wizard — empty System Config form"
  title="Create Instance — Step 3 · System Config"
  caption="Step 3 lands empty: name, login type, and key-pair selection are all required."
/>

| Field | What to enter |
|---|---|
| **Name** | A short hostname — letters, numbers, hyphens. Example: `web-01`. |
| **Login Type** | **Keypair** *(recommended)* or Password. Production VMs should always use keypairs. |
| **Keypair** | Pick an existing key pair from your project, or click **Create Keypair** to generate one right here. |
| **Advanced Options** *(optional)* | Expand to add cloud-init user data — a script that runs on first boot to install packages, write config, or create users. |

:::caution Download your key
If you generate a new key pair in the browser, you're shown the **private key only once**. Download it and store it somewhere safe (a password manager works). Without it you can't SSH into the VM later.
:::

Click **Next: Confirm Config**.

---

## 5. Step 4 — Confirm Config

Review every choice from the previous three steps. Look for typos in the name, the right OS image, the right network. Anything wrong → **Previous** to fix. Everything good → **Create**.

---

## 6. Wait for the VM to come up

The wizard closes and your VM appears in the Instances list. Its status moves through **Building → Active**. Initialization usually takes 30–90 seconds.

When status is **Active**, copy the VM's **IP Address** from the list.

---

## 7. Connect

```bash
ssh -i ~/Downloads/my-key.pem ubuntu@<vm-ip>
```

The default user depends on the image:

| Image family | Default user |
|---|---|
| Ubuntu | `ubuntu` |
| Debian | `debian` |
| Rocky Linux / AlmaLinux | `rocky` / `almalinux` |
| Fedora | `fedora` |
| Windows | use RDP — see [Connect over SSH/RDP →](/compute/connect-ssh) |

If you can't reach the VM from your laptop, the most common cause is the **security group blocking port 22**. See [Security groups →](/networking/security-groups) for the recommended SSH-only ruleset.

---

## Next steps

- [Connect to your VM →](/compute/connect-ssh) — bastion, floating IP, SSH config
- [Security groups →](/networking/security-groups) — open ports the right way
- [Floating IPs →](/networking/floating-ips) — give the VM a public IPv4
- [Choose an image →](/compute/images) — full catalog and bring-your-own
