---
title: Projects
description: How projects group your resources, and what to do when you outgrow a soft limit.
---

# Projects

A **project** is the box everything you build lives in. Instances, networks, volumes, floating IPs, security groups, database instances — all of it belongs to exactly one project. This page covers how to work with projects, how projects and billing line up, and what happens when you outgrow a soft limit.

---

## Why projects

Three practical reasons to use more than one:

- **Isolation.** VMs and networks in different projects are isolated at the network layer by default. `dev` cannot reach `prod` unless you build the connection yourself.
- **Independent budgets.** Compute, memory, and storage headroom is tracked per project — one team consuming their budget doesn't stall another team's work.
- **Billing clarity.** Usage is broken down per project on the invoice — so you can see exactly what `staging` cost this month.

A common layout for a small engineering team:

| Project | Used for | Access |
|---|---|---|
| `dev` | Personal sandboxes, throwaway experiments | Everyone on the team |
| `staging` | Pre-production, CI-deployed builds | Everyone on the team |
| `prod` | Customer-facing workloads | Operators only |

---

## The current project

The **project selector** in the top bar of the console shows which project you're currently acting in. Click it to switch. Every action — create instance, open volumes list, view network topology — is scoped to the selected project.

:::tip Wrong-project mistake
Almost every "why can't I see my VM?" turns out to be *"you're looking at the wrong project."* Check the selector first.
:::

---

## Adding a project

Right now, additional projects are created for you by the operations team — send a note to **`info@thewahda.com`** with:

- The project name (short, kebab-case works well — `dev`, `staging`, `prod`).
- Which of your existing users should have access, and their role (`admin` / `member`).
- Anything unusual about the workload (large VMs, high egress, dedicated DBaaS) so we can pre-size compute and storage headroom for you.

Self-serve project creation is on the roadmap.

---

## Checking your usage

The **Home** dashboard shows current usage for compute, storage, and networking in the region. The **Instances**, **Volumes**, **Networks**, and **Floating IPs** pages each have a live panel on the right with the current numbers.

You pay only for what you actually use — running instances, allocated block storage, attached floating IPs, active load balancers, active database instances. Networks, subnets, routers, security groups, key pairs, server groups don't cost anything; use as many as you need.

---

## Hit a soft limit?

If you try to create something and Skyline says you've reached a limit — more vCPU, more block storage, more floating IPs than the project currently has room for — that's a **soft limit** we set to keep runaway automation from surprising you on the next invoice. It's not a product cap.

Email **`info@thewahda.com`** with the project name and what you need — new compute headroom, more block storage, extra floating IPs, a bigger DBaaS quota — and we'll raise it. Same business day is normal.

If you know up front that you'll be running large workloads (dozens of VMs, hundreds of GB of block storage, a big DBaaS instance), mention it in the initial account request and we'll size headroom for you before you hit anything.

---

## Next steps

- [Create your first VM →](/compute/create-vm) — put the project to use.
- [Security groups →](/networking/security-groups) — set up firewall rules for the VMs you'll create.
- [Sign up & first login →](/getting-started/sign-up) — if you haven't opened the console yet.
