---
title: Create a virtual machine
description: Launch your first Linux VM on The Wahda Cloud in about five minutes — pick a size, an OS, a network, and you're online.
---

# Create a virtual machine

Spin up a Linux virtual machine from the console in about five minutes. This page walks the **Create Instance** wizard end-to-end — sizing, OS, storage, network, access — one screen per step.

> **Before you start**
> - An account on [console.thewahda.com](https://console.thewahda.com) — see [Sign up & first login →](/getting-started/sign-up).
> - A project with available **instance**, **vCPU**, **memory**, and **volume** quota. The wizard shows live quota usage on the right as you build.
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

## 1. Open the Instances list

From the left navigation: **Compute → Instances**. The list shows every VM in the current project — empty if this is your first one.

Click **Create** in the top-right.

<MacFrame
  src="/img/screenshots/compute/create-vm/01-instances-list.png"
  alt="Empty Instances list with the Create button in the top-right"
  title="Skyline — Compute › Instances"
  caption="The Instances page. Click Create to launch the wizard."
/>

---

## 2. Step 1 — Base Config

The longest step of the wizard. You're picking the physical shape of the VM here: zone, size, OS image, and root disk.

<MacFrame
  src="/img/screenshots/compute/create-vm/02-step1-base-config.png"
  alt="Step 1 of the Create Instance wizard, fully filled in"
  title="Create Instance — Step 1 · Base Config"
  caption="Step 1 filled: AZ, m1.small flavor, Ubuntu image, 20 GB SSD-GP1 root disk."
/>

Fill it in top to bottom:

### a) Available Zone

Leave the default (e.g. `in-north-az1`). Pick a specific AZ only if you need to pin location for multi-AZ HA.

### b) Specification (flavor)

Each row is a pre-defined size — vCPU, memory, included internal-network bandwidth. Click the radio on the row to select it. The **Selected** chip below the table reflects your pick, and the **Quota** sidebar on the right updates live.

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

Click **Next: Network Config**.

---

## 3. Step 2 — Network Config

Attach the VM to a **private network** inside your project. Tick the checkbox on the network row; the subnet auto-selects from the network's first subnet.

<MacFrame
  src="/img/screenshots/compute/create-vm/06-step2-network-selected.png"
  alt="Step 2 of the wizard — a private network selected and a security group attached"
  title="Create Instance — Step 2 · Network Config"
  caption="Step 2: private network picked, security group attached."
/>

| Field | What to choose |
|---|---|
| **Network** | A private network inside your project. Most projects come with a `private` network created automatically. |
| **Subnet** | Inherited from the network's first subnet — change only if you have multiple. |
| **Security Groups** | The firewall ruleset(s) attached to the VM. Defaults block all inbound traffic. **To SSH in, attach a group that allows port 22.** See [Security groups →](/networking/security-groups). |

Click **Next: System Config**.

---

## 4. Step 3 — System Config

Give the VM a name and pick how you'll log in.

<MacFrame
  src="/img/screenshots/compute/create-vm/07-step3-system-config.png"
  alt="Step 3 of the wizard — instance name, key pair, and optional cloud-init user data"
  title="Create Instance — Step 3 · System Config"
  caption="Step 3: hostname, key-pair login, optional cloud-init user data."
/>

| Field | What to enter |
|---|---|
| **Instance Name** | A short hostname — letters, numbers, hyphens. Example: `web-01`. |
| **Login Type** | **Key Pair** *(recommended)* or Password. Production VMs should always use key pairs. |
| **Key Pair** | Pick an existing key pair from your project, or click **Create Key Pair** to generate one in the browser. |
| **User Data** *(optional)* | A cloud-init script that runs on first boot — install packages, write config, create users. |

:::caution Download your key
If you generate a new key pair in the browser, you're shown the **private key only once**. Download it and store it somewhere safe (a password manager works). Without it you can't SSH into the VM later.
:::

Click **Next: Confirm Config**.

---

## 5. Step 4 — Confirm Config

Review every choice from the previous three steps. Look for typos in the name, the right OS image, the right network. Anything wrong → **Previous** to fix. Everything good → **Create**.

<MacFrame
  src="/img/screenshots/compute/create-vm/08-step4-confirm.png"
  alt="Step 4 of the wizard — the confirm-config summary screen"
  title="Create Instance — Step 4 · Confirm Config"
  caption="Step 4: summary of everything you configured. Last chance to correct anything."
/>

---

## 6. Wait for the VM to come up

The wizard closes and your VM appears in the Instances list. Its status moves through **Building → Active**. Initialization usually takes 30–90 seconds.

<MacFrame
  src="/img/screenshots/compute/create-vm/11-returned.png"
  alt="Instances list showing the newly created VM in Active state"
  title="Skyline — Compute › Instances"
  caption="Back on the Instances list, VM in Active state and ready to log in to."
/>

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
