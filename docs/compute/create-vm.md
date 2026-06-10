---
title: Create a virtual machine
description: Launch your first Linux VM on The Wahda Cloud in about five minutes — pick a size, an OS, a network, and you're online.
---

# Create a virtual machine

Spin up a Linux virtual machine from the console in about five minutes. This page walks the **Create Instance** wizard end-to-end — sizing, OS, storage, network, access.

> **Before you start**
> - An account on [console.thewahda.com](https://console.thewahda.com)
> - A project with available **instance**, **vCPU**, **memory**, and **volume** quota (the wizard shows you live quota usage on the right)
> - An SSH public key (we'll create one in the wizard if you don't have one)

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

## 1. Sign in

Open [**console.thewahda.com**](https://console.thewahda.com) and sign in with your account.

![Sign-in screen](/img/screenshots/compute/create-vm/01-login-page.png)

After login you land on the project **Home** dashboard with a summary of your project, your role, and quotas in this region.

![Home dashboard for the demo-project](/img/screenshots/compute/create-vm/03-dashboard.png)

:::tip Switch project
Use the project name in the top bar to jump between projects you have access to. Quotas are scoped per project.
:::

---

## 2. Go to Instances

From the left navigation: **Compute → Instances**. The list shows every VM in the current project — empty if this is your first one.

Click **Create** in the top-right.

![Empty Instances list with the Create button](/img/screenshots/compute/create-vm/01-instances-list.png)

---

## 3. Step 1 — Base Config

The longest step. You're picking the physical shape of the VM here.

![Step 1 — empty Base Config form](/img/screenshots/compute/create-vm/02-step1-empty.png)

Five required choices, top to bottom:

### a) Available Zone

Leave the default (e.g. `in-north-az1`). Pick a specific AZ only if you need to pin location for multi-AZ HA.

### b) Specification (flavor)

Each row is a pre-defined size — vCPU, memory, included internal-network bandwidth. Click the radio on the row to select it. The **Selected** chip below the table reflects your pick, and the **Quota** sidebar on the right updates live.

For a first VM, **`m1.small` (1 vCPU / 2 GB RAM)** is a good starting point.

![Flavor selected: m1.small](/img/screenshots/compute/create-vm/03-step1-flavor.png)

| Flavor (typical) | vCPU | RAM | Use case |
|---|---|---|---|
| `m1.tiny` | 2 | 512 MB | Trial / smallest workload |
| `m1.small` | 1 | 2 GB | Single-service container, light web app |
| `m1.medium` | 2 | 4 GB | Web app, CI runner, small worker |
| `m1.large` | 4 | 8 GB | Production app server, small DB |

### c) Start Source & Operating System

Leave **Start Source** on the default **Image** tab (the other tabs let you boot from an existing snapshot or volume).

Under **Operating System**, click the OS family icon — **Ubuntu**, Debian, Fedora, Rocky, Windows, etc. The table below refreshes to show every available image for that family.

![Ubuntu OS family selected](/img/screenshots/compute/create-vm/04-step1-ubuntu.png)

**Click the row** of the image you want (we recommend the latest LTS for Linux). The selection is confirmed by the **Selected Image** chip below.

![Image picked from the catalog](/img/screenshots/compute/create-vm/05-step1-image.png)

:::tip Image rows
You can click anywhere on the row — Name, Project, System Version — to select the image. The blue radio dot on the left appears once selected.
:::

### d) System Disk

Below the image table:

![System Disk section — Type dropdown opened](/img/screenshots/compute/create-vm/07-step1-disk-type-open.png)

| Field | Set it to |
|---|---|
| **Boot From Volume** | `Yes - Create a new system disk` (default). This gives the VM a persistent root disk. |
| **System Disk → Type** | Pick `SSD-GP1` (general-purpose SSD) from the dropdown. |
| **System Disk → Size** | At least **20 GiB**. The minimum is set by the image; the wizard rejects anything smaller. |
| **Deleted with the instance** | Leave checked. Uncheck only if you want the root volume to survive instance deletion. |
| **Data Disk** *(optional)* | Click **Add Data Disks** if you need additional persistent volumes. |
| **Count** | `1` (use higher to launch identical copies of this configuration). |

![Disk type picked and size set](/img/screenshots/compute/create-vm/09-step1-disk-sized.png)

### e) Advance to Step 2

When all required fields have values, the **Next: Network Config** button in the footer becomes active. Click it.

![Hovering Next: Network Config](/img/screenshots/compute/create-vm/10-step1-hover-next.png)

---

## 4. Step 2 — Network Config

Attach the VM to a **private network** inside your project. The wizard lists every network you have access to; pick one row by ticking its checkbox. The subnet is auto-selected from the network's available subnets.

| Field | What to choose |
|---|---|
| **Network** | A private network inside your project. Most projects have a `private` network created automatically. |
| **Subnet** | Inherited from the network's first subnet — change only if you have multiple. |
| **Security Groups** | The firewall ruleset(s) attached to the VM. By default, all inbound traffic is blocked. To SSH in, you must attach a group that allows port 22. See [Security groups →](/networking/security-groups). |

Click **Next: System Config**.

---

## 5. Step 3 — System Config

Set the VM's name and how you'll log in.

| Field | What to enter |
|---|---|
| **Instance Name** | A short hostname — letters, numbers, hyphens. Example: `web-01`. |
| **Login Type** | **Key Pair** (recommended) or **Password**. Production VMs should always use key pairs. |
| **Key Pair** | Pick an existing key pair from your project, or click **Create Key Pair** to generate one in the browser. |
| **User Data** *(optional)* | A cloud-init script that runs on first boot — install packages, write config files, set up users. |

:::caution Download your key
If you generate a new key pair in the browser, you're shown the **private key only once**. Download it and store it somewhere safe (a password manager works). Without it you can't SSH into the VM later.
:::

Click **Next: Confirm Config**.

---

## 6. Step 4 — Confirm Config

Review every choice from the previous three steps. Look for typos in the name, the right OS image, the right network. Anything wrong, click **Previous** to fix; everything good, click **Create**.

---

## 7. Wait for the VM to come up

The wizard closes and your VM appears in the Instances list. The status moves through **Building → Active**. Initialization usually takes 30–90 seconds depending on the image.

![Returned to the Instances list](/img/screenshots/compute/create-vm/11-returned.png)

When status is **Active**, copy the VM's **IP Address** from the list.

---

## 8. Connect

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
