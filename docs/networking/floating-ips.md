---
title: Floating IPs
description: Give a VM a stable public IPv4 address — allocate one from the pool and associate it to your instance.
---

# Floating IPs

A **floating IP** (FIP) is a public IPv4 address you allocate to your project and attach to a VM. That's the single step that turns a private, internal-only VM into one anyone on the internet can reach at a fixed address.

Two things to know:

- **Floating IPs are billed while allocated**, whether the VM is running or not. Release the ones you're not using.
- **Attaching or detaching is fast and doesn't touch the VM.** You can move an FIP from one VM to another in seconds — great for blue/green cutovers and zero-downtime replacements.

---

## Where they live

From the left navigation: **Network → Floating IPs**. The page lists every FIP allocated to the current project.

<MacFrame
  src="/img/screenshots/networking/floating-ips/01-list.png"
  alt="Floating IPs page — empty on a fresh project"
  title="Network › Floating IPs"
  caption="A fresh project has none. Click Allocate IP to reserve one from the public pool."
/>

Header buttons: **Allocate IP** (reserve a fresh one), **Release** (give the selected one back). Each row's `Associated Resource` column shows which VM (if any) the FIP is currently attached to.

---

## Allocate one

Click **Allocate IP**.

<MacFrame
  src="/img/screenshots/networking/floating-ips/02-allocate.png"
  alt="Allocate IP dialog — pick the network to draw from"
  title="Network › Floating IPs › Allocate IP"
  caption="Pick the external network and click OK. The platform hands back the next available public address."
/>

| Field | What to enter |
|---|---|
| **Network** | Pick `Public1` — the platform's external network. This is the only source of public IPv4 on The Wahda Cloud today. |
| **Batch Allocate** | Optional — tick this and enter a count if you need several at once. |
| **Description** | Optional — a short reminder of what the IP is for (`web-prod`, `bastion`, `staging-lb`). Handy when the list grows. |
| **QoS Policy** | Advanced — apply a bandwidth-cap or DSCP policy. Leave empty unless you know you need one. |

Click **OK**. A new IP appears in the list, `Associated Resource` empty, ready to attach.

:::note What "the pool" means
Public IPv4 is a global scarce resource. The platform holds a pool of addresses from `165.99.104.0/24` and hands them out one at a time. If an allocation ever fails with "no address available", email **`info@thewahda.com`** — the pool gets grown regularly and we'll bump it for you.
:::

---

## Attach it to a VM

The IP by itself does nothing. You need to attach it to a specific VM's private-network port.

Two paths:

### From the Floating IPs page

1. On the FIP row, click **More → Associate**.
2. Pick the target VM's port from the dropdown.
3. Click **OK**. The IP is now live on that VM. Test it: `ping <fip>` from your laptop.

### From the VM's detail page

1. Open **Compute → Instances → your VM**.
2. In **More Actions**, pick **Associate Floating IP**.
3. Pick an FIP from the list (or allocate a fresh one inline).
4. Click **OK**.

Both paths do the same thing under the hood.

:::caution SSH still needs an open port
Attaching a floating IP is only half the job. If your security group doesn't allow inbound port 22, SSH still times out. Open the port in [Security groups →](/networking/security-groups) *and* attach the FIP.
:::

---

## Detach — or move to another VM

Same **More → Disassociate** action from the list (or **Disassociate Floating IP** on the VM). The IP stays allocated to your project — it just isn't attached to anything.

To move an FIP to a different VM, disassociate first, then associate to the new target. The switch is atomic: seconds, no rebooting either VM.

This is exactly the shape you want for zero-downtime deploys — bring up the new VM, health-check it, move the FIP, then delete the old VM.

---

## Release (give it back)

When you're done with an IP, **release** it — otherwise you keep paying for it.

On the row, select and click **Release** in the header. The IP goes back into the pool for the next project. Any resource still using it must be detached first; the platform refuses the release otherwise.

---

## Reverse DNS / PTR records

By default, the reverse DNS for an FIP points at a generic hostname the platform owns. If you're running mail (SMTP) or anything else that checks PTR alignment, request a PTR record pointing at your domain — email **`info@thewahda.com`** with the FIP and the hostname you want.

---

## Common patterns

| Pattern | How it looks |
|---|---|
| **Single public web server** | One VM, one FIP. Attach → open 80/443 in the security group → done. |
| **Load-balanced service** | One FIP on the [load balancer](/networking/load-balancer), zero FIPs on the backends. Backends stay private and unreachable directly. |
| **Bastion + private VMs** | One FIP on the bastion (with port 22 open to your office CIDR), no FIPs on anything else. Reach private VMs via `ssh -J bastion` — see [Connect over SSH](/compute/connect-ssh#3-through-a-bastion-jump-host). |
| **Zero-downtime deploy** | Two VMs, one FIP. Health-check the new VM, disassociate the FIP from the old one, associate to the new one. |

---

## Troubleshooting

| Symptom | Most likely cause |
|---|---|
| `Destination host unreachable` on ping | The FIP is allocated but not attached to a VM. Attach it. |
| `Request timed out` on ping and SSH | FIP is attached, but the security group blocks ICMP (ping) and/or TCP 22. Open the ports. |
| SSH works but HTTP doesn't | Same FIP, wrong port in the security group. Open 80/443. |
| "The FIP was reachable, now it's not" | Someone detached it, or moved it to a different VM. Check **Associated Resource** on the list. |
| "Someone else has our IP" | An IP you released was reassigned to another project. Public IPv4 is a shared pool. Book the ones you plan to keep. |

---

## Next steps

- [Security groups →](/networking/security-groups) — open the ports the FIP is going to expose.
- [Connect over SSH →](/compute/connect-ssh) — log into the VM once the FIP + SG are wired up.
- [Load balancer →](/networking/load-balancer) — a better pattern than one FIP per VM once you have more than one backend.
