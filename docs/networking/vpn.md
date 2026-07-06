---
title: VPN
description: Site-to-site IPsec VPN on The Wahda Cloud — permanent encrypted tunnel between your cloud project and a remote network. Contact ops to provision.
keywords:
  - site-to-site VPN
  - IPsec VPN
  - IKE VPN
  - cloud VPN
  - encrypted tunnel
  - on-prem to cloud
  - hybrid cloud networking
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
image: /img/brand/social-card.png
---

# VPN

The Wahda Cloud supports **site-to-site IPsec VPN** as a managed service. You get an encrypted tunnel between your project's router and a remote peer — your office edge, another cloud, another region — and after that, VMs in your project talk to hosts on the remote network as if they were on the same private plane.

:::note Assisted provisioning today
The self-serve VPN wizard in the console is **not fully surfaced yet**. Setting up a tunnel today is an assisted flow — you send us the peer's details, we provision the IKE / IPsec policies, the VPN service, endpoint groups and the site connection on your project's router, and hand back the tunnel status. Full self-serve provisioning is on the roadmap.

**How to request one:** email **`info@thewahda.com`** with the checklist below. Turnaround is usually the same business day.
:::

Use it when you want a **permanent, encrypted L3 bridge** between your on-prem network and this project — without exposing either side to the internet.

---

## What you get

- **IPsec tunnels** with modern crypto (AES, AES-CTR, SHA-2, PFS via DH groups 14+).
- **IKEv1 and IKEv2** for interoperability with existing on-prem VPN gateways.
- **Endpoint groups** so one VPN service can carry multiple `local ↔ peer` subnet pairs.
- **Runs on your router**, so it inherits the router's floating IP as the tunnel endpoint.
- Encrypted with **shared secrets** (PSK). Certificate-based auth is on the roadmap.

---

## What we need from you to provision one

Include the following in your email to `info@thewahda.com` and we can stand the tunnel up in one round-trip.

| We need | Details |
|---|---|
| **Peer public IP** | The single public IPv4 the remote VPN gateway terminates on. |
| **Remote CIDR(s)** | Every subnet on the far side you want reachable from this project. |
| **Local CIDR(s)** | Which subnets in this project should be reachable from the remote side. Usually your `demo-network-vpc` subnet. |
| **Shared secret (PSK)** | Both sides must agree on the same PSK. Send us yours over a secure channel — not in the same email as the rest. |
| **IKE version** | `IKEv1` or `IKEv2`. IKEv2 preferred if the peer supports it. |
| **IKE phase 1 crypto** | Encryption + integrity + PFS group + lifetime. Common set: `aes-256`, `sha-256`, DH group `14` (or `19`/`20` for ECC), lifetime `28800` s. |
| **IPsec phase 2 crypto** | Same shape. Common set: `aes-256`, `sha-256`, PFS group `14`, lifetime `3600` s. |
| **Peer identifier** *(optional)* | FQDN or IP the peer uses in its ID payload — needed for some Cisco / Fortinet setups. |
| **Initiator side** | Which end starts the negotiation. Both = OK; peer-only = OK if you can't route through us. |

We reply with:

- The project router's public IP (this becomes your peer's remote-side).
- The tunnel's IKE + IPsec policy IDs (for your records).
- The site-connection ID and current status (`ACTIVE` / `PENDING_CREATE`).

Bring the remote peer up with matching settings; the tunnel comes up when both sides agree.

---

## Peer compatibility

The remote peer is anything that speaks standard IPsec:

- Enterprise gear: **Cisco ASA / IOS**, **Fortinet FortiGate**, **Palo Alto**, **Juniper SRX**, **Check Point**.
- Small-office gear: **MikroTik**, **pfSense**, **OPNsense**, **Ubiquiti EdgeRouter / UniFi Gateway**.
- Linux boxes running **strongSwan** or **Libreswan**.
- Another cloud provider's site-to-site VPN gateway.

Any policy mismatch (encryption, integrity, PFS, lifetime) causes the tunnel to negotiate then instantly drop — check the peer's log for the specific attribute the responder rejected.

---

## When *not* to use one

- **You just need one VM reachable from the internet** — that's a [floating IP](/networking/floating-ips) + a tight [security group](/networking/security-groups). Simpler, cheaper, no coordination with a peer.
- **You need application-level authentication, not network-level** — mTLS between services, or a WireGuard mesh at the app layer, is usually a better fit.
- **The remote peer is a random consumer laptop** — client VPNs (WireGuard, OpenVPN) suit that shape better than site-to-site IPsec. Stand one up on a VM and connect users to it.
- **You need many small tunnels to lots of remote sites** — the operational overhead adds up. A hub-and-spoke SD-WAN overlay usually wins here.

---

## What a healthy tunnel looks like

Once both sides are configured, from a VM in your project you can reach hosts on the remote network by their private IP, and vice versa. No public exposure. No NAT.

- **Reachability test from a project VM**: `ping <remote-host-ip>` should succeed once the tunnel comes up.
- **Which route sends traffic through the tunnel**: `ip route get <remote-host-ip>` should show the router's tunnel interface, not the default gateway.
- **Where to see the tunnel status**: we send you the site-connection ID; ping us or check the ticket for the latest status.

---

## Common patterns

| Pattern | How it looks |
|---|---|
| **On-prem ↔ cloud** | Office edge firewall ↔ project router. Private-side subnets on both sides. Domain-joined app VMs in cloud reach on-prem AD / file shares. |
| **Cloud ↔ cloud** | Project router ↔ another provider's VPN gateway. Multi-cloud database replication over IPsec instead of the public internet. |
| **DR site** | Primary in one location, warm secondary in another. Backup traffic + heartbeat over the tunnel. |
| **Managed-service bridge** | Cloud VMs need to reach a SaaS product's private-connect endpoint. VPN between your project and the SaaS's provided gateway. |

---

## Billing

VPN tunnels are billed **per hour of running state**, invoiced in INR with GST-compliant billing. Traffic through the tunnel counts toward your regular egress billing when it exits the region.

---

## Troubleshooting (once the tunnel is up)

| Symptom | Where to look |
|---|---|
| Ping to remote host times out | Peer side may have a firewall in front of the target host. Get the peer to allow traffic from your local CIDR. |
| Tunnel comes up then drops after ~1 hour | PFS or lifetime mismatch. Both sides must agree on rekey timing. |
| Tunnel intermittently drops on high traffic | MTU mismatch — the tunnel adds overhead. Try clamping MSS on both sides. |
| Can reach some hosts, not others | Peer's routing / firewall isn't advertising the missing subnet through the tunnel. Ask the peer's admin to check. |
| Never comes up at all | Almost always a mismatch in IKE version, PFS group, or PSK. Grab the peer's negotiation log and forward it to `info@thewahda.com` — one round-trip usually finds it. |

---

## Next steps

- [Networking overview →](/networking/overview) — where VPN fits alongside floating IPs and load balancers.
- [Security groups →](/networking/security-groups) — even with the tunnel up, SGs still apply on inbound traffic to your VMs.
- [Floating IPs →](/networking/floating-ips) — the router's floating IP is the tunnel endpoint.
- Ready to request a tunnel? Email **`info@thewahda.com`** with the checklist above.
