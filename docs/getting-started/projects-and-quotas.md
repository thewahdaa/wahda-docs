---
title: Projects & quotas
description: How projects group your resources, the default quotas on a new account, and how to request more.
---

# Projects & quotas

A **project** is the box everything you build lives in. Instances, networks, volumes, floating IPs, security groups, database instances — all of it belongs to exactly one project. This page covers how to work with projects and how to grow their capacity.

---

## Why projects

Three practical reasons to use more than one:

- **Isolation.** VMs and networks in different projects are isolated at the network layer by default. `dev` cannot reach `prod` unless you build the connection yourself.
- **Per-team quotas.** Each project has its own quota for CPUs, memory, storage, and floating IPs. One team consuming their limit doesn't stall another team.
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

- The project name (short, kebab-case works well — `dev`, `staging`, `prod`)
- Which of your existing users should have access, and their role (`admin` / `member`)
- Any starting quota beyond the defaults

Self-serve project creation is on the roadmap.

---

## Default quotas

Every new project starts with these limits:

| Resource | Default |
|---|---|
| Instances | 10 |
| vCPUs | 20 |
| Memory | 50 GB |
| Block volumes | 10 |
| Block volume storage | 1 000 GB |
| Snapshots | 10 |
| Floating IPs | 5 |
| Security groups | 10 |
| Load balancers | 2 |
| Networks | 10 |
| Subnets | 10 |
| Routers | 5 |

These cover most small-team workloads. If you need more, raising them is a quick email.

:::note What quotas actually mean
Quotas are **caps**, not reservations. You aren't billed for headroom — only for what you actually use. Sizing the quota to a comfortable ceiling above your real usage is fine.
:::

---

## Checking your usage

The **Home** dashboard shows current usage vs. quota in the region for each resource type. The **Instances**, **Volumes**, **Networks**, and **Floating IPs** pages each have a "Quota" panel on the right with live numbers.

If you're consistently sitting above 80 % on any line item, plan the ask before you hit the ceiling — it takes a minute to raise, but zero minutes if you do it in advance.

---

## Requesting more

To raise a quota:

1. Note which limit you're hitting — e.g. `instances` or `volume_storage`.
2. Email **`info@thewahda.com`** with the project name, the resource, and the new limit you need.
3. Include one line on the workload if it's a big jump — helps the team fast-track it.

Turnaround is usually the same business day.

---

## Next steps

- [Create your first VM →](/compute/create-vm) — start using the compute quota.
- [Security groups →](/networking/security-groups) — set up firewall rules for the VMs you'll create.
- [Sign up & first login →](/getting-started/sign-up) — if you haven't opened the console yet.
