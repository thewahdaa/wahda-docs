---
title: Flavors
description: The available VM shapes on The Wahda Cloud — vCPU, RAM, and root disk sizing.
---

# Flavors

A **flavor** is a pre-defined VM shape — how many virtual CPUs, how much RAM, and how big the default root disk. You pick a flavor every time you create a VM. Flavors are read-only from a tenant's point of view; the platform team publishes them, and everyone shares the same catalog.

---

## The catalog

Four public flavors ship on the platform today:

| Flavor | vCPU | RAM | Disk | What it's good for |
|---|---|---|---|---|
| `m1.tiny` | 2 | 512 MB | 1 GB | Smoke tests and cirros bootstraps only — too small for a real distro |
| `m1.small` | 1 | 2 GB | 20 GB | Single-service containers, a light web app, a jump host |
| `m1.medium` | 2 | 4 GB | 40 GB | Typical web app, CI runner, small worker |
| `m1.large` | 4 | 8 GB | 80 GB | Production app server, small database, build box |

:::caution `m1.tiny` on a real distro
`m1.tiny`'s 1 GB root disk will not fit Ubuntu, Rocky, or CentOS. Use it for `cirros` (which is 8 MB) or as a starting point when you provision your own tiny image. For anything else, start at `m1.small`.
:::

---

## How you pick one

Flavors don't have a dedicated Skyline page for tenants — you choose them inside the **Create Instance** wizard, at Step 1 · Base Config. Every visible row is a flavor, and the **Selected** chip below the table confirms your pick. See [Create a VM → Step 1 · Base Config](/compute/create-vm#2-step-1--base-config).

The wizard's usage panel on the right updates live as you pick — so you can see how the flavor fits your project's current compute allocation.

---

## Which one for what

- **First VM, playing around** — `m1.small`.
- **Web app + Postgres side by side** — `m1.medium`.
- **Node.js / Django in production with a DB elsewhere** — `m1.large`.
- **Anything that starts hitting swap on `m1.medium`** — move up, don't tune around it. The next flavor up is one click in the wizard.
- **Testing a boot image at minimum footprint** — `m1.tiny` with `cirros`.

If you need something between two flavors — say 3 vCPU / 6 GB RAM — pick the next size up. Custom shapes are not exposed to tenants; if you need a truly different profile, ask the platform team.

---

## Bigger flavors

If your workload doesn't fit `m1.large`, email **`info@thewahda.com`** with the target shape (vCPU + RAM + disk) and what you're running. Larger, memory-optimized, and CPU-optimized shapes can be added — they're not published on the shared catalog by default.

---

## Related concepts

- **Root disk size**. The flavor sets a *default* root disk. The Create VM wizard lets you raise it (Step 1 · Base Config → System Disk → Size). You can't shrink it below what the image needs — a `Please set a size no less than N GiB` error means bumping to `N`.
- **Ephemeral disk**. None of the standard flavors expose ephemeral (non-persistent) storage. Everything you attach through the wizard is persistent block storage.
- **Bandwidth**. The **Internal Network Bandwidth** column in the wizard is populated for flavors that guarantee a floor; where it shows `-`, bandwidth follows fair-share.

---

## Next steps

- [Create a VM →](/compute/create-vm) — put a flavor to work.
- [Images →](/compute/images) — the OS that will run on it.
- [Projects →](/getting-started/projects-and-quotas) — how projects group your resources and what to do when you need more room.
