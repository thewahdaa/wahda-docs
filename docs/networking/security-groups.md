---
title: Security groups
description: Stateful cloud firewall rules on The Wahda Cloud — decide which ports on your cloud VM are reachable, from where, and over which protocol. Deny by default.
keywords:
  - cloud security group
  - cloud firewall
  - stateful firewall
  - cloud network security
  - inbound rules
  - port 22 SSH
  - port 443 HTTPS
  - deny by default
  - cloud VM firewall
  - cloud ingress rules
  - The Wahda Cloud
---

# Security groups

A **security group** is a stateful firewall attached to a VM. It's the single mechanism that decides whether a packet is allowed to reach the VM. Every VM must have at least one security group; you attach them in Step 2 of the [Create VM wizard](/compute/create-vm#3-step-2--network-config).

Two things to know before you touch this page:

1. **Everything is deny-by-default.** A brand-new VM answers nothing until you explicitly open a port.
2. **Rules are stateful.** If you allow inbound TCP 22, the reply traffic is allowed automatically — no return-path rule needed.

---

## Where they live

From the left navigation: **Network → Security Groups**. Every project starts with one security group called `default`.

<MacFrame
  src="/img/screenshots/networking/security-groups/01-list.png"
  alt="Security Groups list — the default group on a fresh project"
  title="Network › Security Groups"
  caption="A fresh project. The default security group is auto-created; add more when you want per-app or per-role rulesets."
/>

The header buttons: **Create Security Group** (new empty group), **Delete** (selected), **Create Rule** on each row (the fast path to open a port on that group).

---

## The default group's rules

Click `default` to open it. The **Rules** tab shows every rule attached to that group, one per row.

<MacFrame
  src="/img/screenshots/networking/security-groups/02-default-rules.png"
  alt="Default security group — the six pre-populated rules"
  title="Network › Security Groups › default"
  caption="The default group ships with an all-outbound-allowed baseline; inbound is peer-to-peer only until you add a rule."
/>

A rule is a five-column decision:

| Column | What it means |
|---|---|
| **Direction** | `Ingress` (traffic coming in) or `Egress` (traffic going out). |
| **Ether Type** | `IPv4` or `IPv6`. Rules only apply to matching traffic. |
| **IP Protocol** | `TCP`, `UDP`, `ICMP`, or `Any` (any protocol). |
| **Port Range** | The destination port (or range like `80:100`). Blank = any port. |
| **Remote** | `CIDR` (an address range) or another security group. If it's a security group, the rule matches traffic from any VM that has that group attached. |

The default group's baseline:

- **All egress allowed** — `Egress IPv4 Any 0.0.0.0/0` and `Egress IPv6 Any ::/0`. Your VMs can reach anything outbound.
- **Peer-to-peer inbound** — `Ingress IPv4/IPv6 Any` from the *same security group*. VMs sharing the default group can talk to each other on any port, but nothing else can.
- **No inbound from the internet.** No SSH, no HTTP, no ping — until you add a rule.

That's the safe baseline. **You add rules to open ports.**

---

## Open port 22 (SSH)

The single most common task. Click **Create Rule** on the `default` row, or open the group and click **Create Rule** inside.

<MacFrame
  src="/img/screenshots/networking/security-groups/04-create-rule.png"
  alt="Create Rule dialog — Custom TCP Rule, Ingress"
  title="Network › Security Groups › default › Create Rule"
  caption="The Create Rule dialog. Protocol + direction + port + remote — four decisions to open a port."
/>

Fill in:

| Field | For SSH |
|---|---|
| **Protocol** | `Custom TCP Rule` |
| **Direction** | `Ingress` |
| **Ether Type** | `IPv4` (unless you're SSHing over IPv6) |
| **Port Type** | `Custom` |
| **Port/Port Range** | `22` |
| **Remote Type** | `CIDR` |
| **Remote IP Prefix** | Your source. `0.0.0.0/0` opens SSH to the whole internet; **prefer your office egress or a specific range** — for example `203.0.113.0/24`. |

Click **OK**. The rule is live in seconds; the VM starts accepting SSH from the source you named.

:::caution `0.0.0.0/0` on port 22 attracts brute-force noise
It's an entire internet's worth of SSH probes. If you must open port 22 to `0.0.0.0/0`, make sure your VM is key-only (no password auth), and consider putting `fail2ban` or `sshguard` in front. Better: restrict the source CIDR to your office egress and use a jump host for anywhere else.
:::

---

## Common port openings

| Service | Protocol | Port | Notes |
|---|---|---|---|
| SSH | TCP | 22 | Ingress, restrict source to trusted CIDR if possible |
| HTTP | TCP | 80 | Ingress from `0.0.0.0/0` for a public site |
| HTTPS | TCP | 443 | Ingress from `0.0.0.0/0` for a public site |
| RDP (Windows) | TCP | 3389 | Ingress, restrict source aggressively |
| PostgreSQL | TCP | 5432 | Ingress from the **application security group** (peer-to-peer), not the internet |
| MySQL | TCP | 3306 | Same — peer-to-peer only |
| Ping (ICMP) | ICMP | — | Ingress from a trusted CIDR when you actually need it |

Notice the pattern: **user-facing ports** (80, 443, sometimes 22) open to a CIDR; **internal ports** (databases, caches, admin) open to another security group, not to an address range. That way, only VMs that carry the app's SG can reach the database — no matter where they sit on the network.

---

## Creating a new security group

For most projects, one group per role beats a giant `default` with everything in it. Common shapes:

| Group | Attached to | Ingress rules |
|---|---|---|
| `web` | Public-facing web VMs | 80, 443 from anywhere |
| `app` | Backend app VMs | 22 from bastion, app port from `web` |
| `db` | Database VMs | DB port from `app` only |
| `bastion` | The single jump host | 22 from office CIDR only |

Click **Create Security Group** on the list page.

<MacFrame
  src="/img/screenshots/networking/security-groups/03-create-sg.png"
  alt="Create Security Group dialog — name and description"
  title="Network › Security Groups › Create Security Group"
  caption="A new group starts empty except for the peer-to-peer and all-egress baseline. Add rules with Create Rule."
/>

Fill **Name** and an optional **Description** and click **OK**. The new group appears in the list; open it and add rules as needed.

---

## Attach a security group to a VM

- **At launch.** In [Step 2 of the Create VM wizard](/compute/create-vm#3-step-2--network-config), tick every group you want attached in the **Security Groups** section.
- **After launch.** Open the VM in **Compute → Instances**, click it to open detail, and use **More Actions → Manage Security Group**. Add or remove groups; changes apply within seconds — no reboot needed.

A VM can carry **multiple** security groups. The effective ruleset is the *union* of rules from every attached group — a packet is allowed if *any* attached group permits it.

---

## Egress rules

Every group starts with an "allow all egress" baseline. Delete those rules and add restrictive ones if you want to lock down what your VMs can reach outbound — for example, "only allow egress to our object storage bucket's CIDR and the platform's DNS server."

This is genuinely useful for hardening VMs that shouldn't be phoning home, but it also breaks things — packages install, image pulls, external APIs — so plan the allow-list carefully.

---

## Deleting a security group

You can delete a group from the list page (**Delete** header button). The platform blocks the delete if any VM still uses it — remove it from every VM first, then delete.

The `default` group can't be deleted, but you can strip its rules to nothing.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| `Connection timed out` on a port you *think* you opened | You opened it on the *wrong* security group. Compare the VM's attached groups vs. the group you edited. |
| `Connection refused` | The VM has the port open, but the service isn't listening. Not a firewall problem. |
| Rule looks correct but still no traffic | Wrong Ether Type — you allowed IPv4 but you're connecting from an IPv6 address, or vice versa. |
| App-to-database traffic dropped after refactor | You're using CIDR-based rules where a peer group would be more resilient. Switch to "Remote: security group `app`". |

---

## Next steps

- [Create a VM →](/compute/create-vm) — attach the right groups in Step 2.
- [Floating IPs →](/networking/floating-ips) — make the VM reachable from the internet.
- [Connect over SSH →](/compute/connect-ssh) — the reason you opened port 22 in the first place.
