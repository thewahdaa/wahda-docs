---
title: VPN
description: Site-to-site IPsec tunnel from your Wahda Cloud project to a remote network.
---

# VPN

The Wahda Cloud supports **site-to-site IPsec VPN** through Neutron's VPNaaS. You configure an encrypted tunnel between your project's router and a remote peer (your office edge, another cloud, another region) — after that, VMs in your project talk to hosts on the remote network as if they were on the same private plane.

Use it when you want a **permanent, encrypted L3 bridge** between your on-prem network and this project without exposing either side to the internet.

---

## What you get

- **IPsec tunnels** with modern crypto (AES, AES-CTR, SHA-2, PFS via DH groups 14+).
- **IKEv1 and IKEv2** for interoperability with existing on-prem VPN gateways.
- **Endpoint groups** so one VPN service can carry multiple `local ↔ peer` subnet pairs.
- **Runs on your router**, so it inherits the router's floating IP as the tunnel endpoint.
- Encrypted with **shared secrets** (PSK) — certificate-based auth is on the roadmap.

---

## What you need on the other side

The remote peer is anything that speaks standard IPsec — Cisco ASA, Fortinet, MikroTik, pfSense, another OpenStack cloud, a Linux box running strongSwan/Libreswan. You'll need:

- The remote peer's **public IP** (the tunnel endpoint).
- The remote **CIDR(s)** you want to reach.
- The **PSK** — a shared secret, both sides must be configured with the same string.
- Matching **IKE and IPsec policies** — encryption, integrity, PFS group, lifetime. Mismatches cause the tunnel to negotiate then instantly drop; the mismatched attribute shows up in the peer's log.

:::note This page is in progress
The step-by-step console walkthrough — creating IKE/IPsec policies, the VPN service, an endpoint group, and finally the site connection — is being written. In the meantime, the [OpenStack Neutron VPNaaS reference](https://docs.openstack.org/neutron-vpnaas/latest/) documents the exact same API this console flow drives.
:::

---

## When not to use one

- **You just need one VM reachable from the internet** — that's a floating IP + a tight security group. Simpler and cheaper.
- **You need application-level authentication, not network-level** — mTLS or a WireGuard mesh at the app layer is usually a better fit.
- **The remote peer is a random consumer laptop** — client VPNs (WireGuard, OpenVPN) suit that shape better than site-to-site IPsec. The platform team can help you stand one up on a VM.

---

## Next steps

- [Networking overview →](/networking/overview) — where VPN fits alongside FIPs and load balancers.
- [Security groups →](/networking/security-groups) — even with the tunnel up, SGs still apply on inbound traffic.
- [Floating IPs →](/networking/floating-ips) — the router's floating IP is the VPN endpoint.
