---
title: Load balancer
description: Managed L4 and L7 load balancing — spread traffic across multiple backends with health checks.
---

# Load balancer

The Wahda Cloud offers **managed L4/L7 load balancing**. You point a floating IP at a load balancer, tell it which backend VMs to send traffic to, and it handles the rest: health checks, session persistence, TLS termination, and failover.

Use it the moment you have **more than one instance answering the same traffic**. A single entry point + health-checked backends is dramatically more resilient than round-robin DNS or a hand-rolled reverse proxy on a VM.

---

## What the load balancer gives you

- **L4 (TCP/UDP)** — raw port forwarding to a pool of backends. Good for SSH, databases, custom protocols.
- **L7 (HTTP/HTTPS)** — HTTP-aware routing. Path prefixes, host headers, TLS termination.
- **Health checks** — active probing of each backend (TCP connect, HTTP GET, HTTPS with cert validation). Unhealthy members are pulled from rotation automatically.
- **Session persistence** — cookie- or source-IP-based stickiness for stateful apps.
- **Redundancy** — the LB runs on dedicated infrastructure the platform manages. In HA mode, a standby instance takes over on failure automatically.
- **Metrics** — throughput, active connections, and per-member health surface in the console.

:::note This page is in progress
The step-by-step walkthrough — creating a load balancer, adding a pool, adding members, wiring a listener with TLS — is being written. In the meantime, the concepts above match how the console flow is laid out (Network → Load Balancer → Create).
:::

---

## When not to use one

- **A single VM behind a floating IP** — don't front one backend with a load balancer. The FIP by itself is fine, cheaper, and one fewer hop.
- **Purely internal service-to-service traffic on the same network** — VMs on the same subnet can reach each other directly.
- **UDP that needs client IP preservation for gaming or WebRTC** — the load balancer rewrites source IPs by default. Talk to the platform team for X-Forwarded-For / Proxy Protocol wiring.

---

## Next steps

- [Floating IPs →](/networking/floating-ips) — you'll need one to expose the LB publicly.
- [Security groups →](/networking/security-groups) — attach one that permits the listener port from anywhere.
- [Networking overview →](/networking/overview) — how the LB sits in the wider layout.
