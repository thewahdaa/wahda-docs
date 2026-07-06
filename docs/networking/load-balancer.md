---
title: Load balancer
description: Managed L4/L7 load balancer with health checks, SSL/TLS termination, session persistence. High availability and zero-downtime deployments on The Wahda Cloud.
keywords:
  - managed load balancer
  - L4 L7 load balancing
  - HTTPS termination
  - SSL TLS termination
  - health checks
  - session persistence
  - traffic distribution
  - high availability
  - zero-downtime deployment
  - blue-green deployment
  - horizontal scaling
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
---

# Load balancer

Split incoming traffic across multiple backend VMs, terminate HTTPS, run health checks against every backend, and switch a live endpoint between VMs with no downtime — all from the same web console you use to create instances.

The Wahda Cloud's **managed load balancer** is a first-party L4 and L7 traffic distributor. Point a floating IP at it, tell it which backend VMs to serve, and stop worrying about health checks, failover, or the mechanics of a hand-rolled reverse proxy.

---

## When to use a load balancer

Five concrete situations where dropping in a load balancer immediately pays off — and how to solve each one from the console.

### 1. Make one web service highly available

Two or more identical VMs answering the same traffic. If one crashes or you take it out for maintenance, the load balancer stops sending it requests within seconds — end-users never notice.

- Deploy your app on 2+ VMs on the same private network.
- Create a load balancer with a listener on **TCP/HTTPS** for your public port (80 or 443).
- Attach both VMs as **members** of the backend pool.
- Set a **health monitor** — for HTTP, hit `/healthz` every 5 seconds.
- Allocate a [floating IP](/networking/floating-ips) and attach it to the load balancer.
- Point your DNS at the floating IP.

Result: **zero-single-point-of-failure web service** with automatic failover.

### 2. Zero-downtime deployments (blue/green)

Roll out a new app version without dropping a single request.

- Keep your current fleet ("blue") receiving traffic through the pool.
- Bring up new VMs ("green") with the new code, health-check them into a green pool.
- In the load balancer, swap the pool the listener points at.
- Watch traffic drain from blue and land on green in real time.
- When green looks healthy, tear down blue.

The whole cutover is a click. No config-file editing on the load balancer, no `nginx reload`, no restart.

### 3. Terminate HTTPS / SSL in one place

Manage your TLS certificate centrally instead of installing it on every backend VM.

- Upload your cert to **Network → Certificates** (or point at a Let's Encrypt cert file).
- Create the load balancer with an **HTTPS listener** on port 443.
- Pick the certificate in the listener config.
- Backends stay on plain HTTP (port 80). The load balancer decrypts once, at the edge.

You rotate the cert in one place. Backends never see key material.

### 4. Route by path or hostname (L7)

Send `/api/*` traffic to one backend pool and everything else to another — from a single public IP.

- Two backend pools (`api-pool`, `web-pool`).
- One HTTP listener, two **L7 policies**:
  - `URL path starts with /api` → forward to `api-pool`.
  - Default → forward to `web-pool`.

Same pattern for host-based routing: `Host header == api.example.com` → `api-pool`, else `web-pool`.

Great for stitching a microservice architecture behind one URL without an API gateway VM.

### 5. Scale horizontally without touching DNS

You start with two web VMs and outgrow them.

- Boot two more VMs with the same image.
- **Add members** to the existing backend pool.
- The load balancer starts sending them traffic immediately.

DNS stays put — you scaled the fleet without a single record change.

---

## What the load balancer gives you

| Capability | Details |
|---|---|
| **L4 protocols** | TCP, UDP — raw port forwarding to a pool of backends. |
| **L7 protocols** | HTTP, HTTPS — with L7 policies (routing by path, host, header, cookie). |
| **TLS termination** | HTTPS listener with SNI support and multi-certificate binding. Backend can be plain HTTP or re-encrypted HTTPS. |
| **Health monitors** | TCP connect, HTTP `GET` on a path, HTTPS with cert validation. Configurable interval, timeout, retries. Unhealthy members are pulled from rotation automatically. |
| **Load-balancing algorithms** | `ROUND_ROBIN` (default), `LEAST_CONNECTIONS`, `SOURCE_IP`. |
| **Session persistence** | Cookie-based (`APP_COOKIE`, `HTTP_COOKIE`) or source-IP-based for stateful apps. |
| **HA** | The load balancer runs on dedicated infrastructure the platform manages. In HA mode, a standby takes over on failure automatically. |
| **Live metrics** | Active connections, throughput, and per-member health surface in the console. |

---

## The console flow

From the left navigation: **Network → Load Balancers**. The page lists every load balancer in the current project.

<MacFrame
  src="/img/screenshots/networking/load-balancer/01-list.png"
  alt="Load Balancers list — one existing balancer visible"
  title="Network › Load Balancers"
  caption="The Load Balancers list. Create Loadbalancer starts a new one; the Listener Number column shows how many listeners are wired to each row."
/>

Click **Create Loadbalancer** to start the five-step wizard.

### Step 1 — Base Config

<MacFrame
  src="/img/screenshots/networking/load-balancer/02-wizard-step1-empty.png"
  alt="Create Loadbalancer — Step 1 · Base Config, empty"
  title="Create Loadbalancer — Step 1 · Base Config"
  caption="Five steps across the top: Base Config → Listener Detail → Pool Detail → Member Detail → Health Monitor Detail."
/>

| Field | What to enter |
|---|---|
| **Load Balancer Name** | Recognizable label — `web-prod-lb`, `api-blue-green`. Letters, digits, `-`, `_`, `.`, up to 128 chars. |
| **Description** | Optional — a one-liner reminder of what this balances. |
| **Owned Network** | The private network the load balancer's virtual IP will live on. Pick the same network your backends are on. |
| **Owned Subnet** | The specific subnet inside that network. The load balancer's private VIP will come from this subnet's address pool. |
| **Admin State Up** | Leave **On**. Turning it off takes the load balancer out of service without deleting it. |

<MacFrame
  src="/img/screenshots/networking/load-balancer/03-wizard-step1-filled.png"
  alt="Step 1 filled — name and network selected, subnet pending"
  title="Create Loadbalancer — Step 1 · Base Config (filled)"
  caption="Step 1 filled with a name and the backend network selected. Click Next: Listener Detail to advance."
/>

Click **Next: Listener Detail**.

### Step 2 — Listener Detail

A **listener** is the port the load balancer answers on. Configure:

| Field | Notes |
|---|---|
| **Listener Name** | `web-listener`, `api-https-listener`. |
| **Protocol** | `HTTP`, `HTTPS`, `TCP`, `UDP`, `PROXYV2` (for backend Proxy Protocol). |
| **Port** | 80 for HTTP, 443 for HTTPS, or your custom port. |
| **Connection Limit** | Max concurrent connections. `-1` = unlimited. Set a floor for public-facing services to blunt DoS impact. |
| **SNI Container** *(HTTPS only)* | Pick one or more TLS certificates from **Network → Certificates**. |
| **Default TLS Container** *(HTTPS only)* | The fallback certificate served when the client doesn't send SNI. |
| **X-Forwarded-For / X-Forwarded-Port / X-Forwarded-Proto** *(HTTP/HTTPS only)* | Toggle to inject these headers so backends see the real client IP and scheme instead of the load balancer's. |

### Step 3 — Pool Detail

A **pool** is the group of backend VMs that share a role. Every listener sends its traffic to exactly one default pool.

| Field | Notes |
|---|---|
| **Pool Name** | `web-pool`, `api-pool`. |
| **Protocol** | The protocol the load balancer speaks to the backends. Usually matches the listener; for HTTPS-terminating listeners it's usually `HTTP` (re-encryption is optional). |
| **Algorithm** | `ROUND_ROBIN` (fair share), `LEAST_CONNECTIONS` (send to the least-busy backend), `SOURCE_IP` (same client IP → same backend, good for legacy stateful apps). |
| **Session Persistence** | Optional. `APP_COOKIE` (cookie your app sets), `HTTP_COOKIE` (cookie the load balancer sets), `SOURCE_IP`. |

### Step 4 — Member Detail

**Members** are the actual backend VMs. Each row is one VM.

| Field | Notes |
|---|---|
| **Member Name** | Auto-populates from the VM name. |
| **Address** | The VM's private IP on the load balancer's network. |
| **Protocol Port** | The port the app listens on (e.g. `8080`). Doesn't have to match the listener port. |
| **Weight** | Relative weight — `1` for every member gives equal share; `2` on one member sends it twice as much traffic. Great for phased rollouts. |
| **Backup** | Tick to make this member a hot standby — no traffic while others are healthy, takes over when they fail. |

Add every VM that should serve traffic behind this pool. You can add more later at any time — no downtime.

### Step 5 — Health Monitor Detail

The load balancer probes every member on this schedule; failing members are pulled from rotation until they pass again.

| Field | Notes |
|---|---|
| **Monitor Type** | `TCP` (open a socket, close it), `HTTP` (GET a path), `HTTPS` (GET a path over TLS), `PING`. |
| **Delay** | Seconds between probes. `5` is a good starting point. |
| **Timeout** | Seconds to wait for a response. Must be less than **Delay**. `3` is typical. |
| **Max Retries** | Consecutive failures before pulling the member. `3` is standard. |
| **HTTP Method / URL Path / Expected Codes** *(HTTP/HTTPS only)* | e.g. `GET /healthz` expecting `200`. Add a cheap dedicated health-check endpoint to your app — don't probe `/` (it does real work). |

Click **Create**. Provisioning takes a minute or two — the load balancer moves through `PENDING_CREATE` → `ACTIVE`. Once `ACTIVE`, traffic to the VIP starts flowing through health-checked members.

### After creation

- **Attach a floating IP** — the load balancer's VIP is private by default. Go to [Floating IPs](/networking/floating-ips), attach one to the load balancer's VIP port, and now the public internet can reach it.
- **Point DNS** at the floating IP — `A` record for `www.example.com` → the floating IP.
- **Watch the metrics** — the load balancer's detail page shows active connections, byte rates, and per-member health. Investigate any member that flips between `HEALTHY` and `UNHEALTHY`.

---

## Common recipes

### Public HTTPS web app with 3 backends

```
Listener: HTTPS :443 → Pool: web-pool (ROUND_ROBIN, HTTP protocol)
Members:  web-01:8080, web-02:8080, web-03:8080  (weight 1 each)
Monitor:  HTTP GET /healthz every 5s, timeout 3s, retries 3
Cert:     wildcard cert bound as SNI + default
FIP:      165.99.104.42 → LB VIP
```

Effect: three interchangeable web VMs, TLS terminates at the load balancer, unhealthy VMs are removed automatically, HTTPS cert is managed in one place.

### API + Web on one public IP (L7)

```
Listener: HTTP :80
  L7 policy: path starts with /api → Pool: api-pool
  L7 policy: else                  → Pool: web-pool
```

One FIP, one DNS name, two backends. No sidecar API gateway.

### Blue/green with two pools

```
Listener: HTTPS :443 → Pool: web-blue
                (swap to → Pool: web-green during deploys)
Members:  blue-{01,02,03}:8080 in web-blue
          green-{01,02,03}:8080 in web-green
```

Every deploy: bring up green, tick pool swap, watch traffic drain from blue, delete blue.

---

## Billing

The load balancer is billed **per hour of running state**, whether it's serving traffic or idle. Detach the FIP and set **Admin State Up** off to pause traffic without deleting; **Delete** the load balancer when you're done with it entirely. Backend VMs are billed separately as regular instances.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| `502 Bad Gateway` from the load balancer | Backend member unhealthy or not listening on the pool port. Check the member's health status and `curl` its port directly. |
| Traffic hits only one backend | Session persistence is on and every client is the same source. Confirm behavior with two source IPs before assuming it's broken. |
| Health monitor flapping | Probe interval too tight, backend GC pauses too long, or `/healthz` does real work. Widen the delay to 10s or make the endpoint cheaper. |
| TLS handshake fails | Certificate not bound to the listener, or SNI mismatch. Re-check the SNI containers list. |
| Public IP unreachable | Load balancer has no floating IP attached — or the security group on the VIP port blocks the listener's port. |
| Load balancer stuck in `PENDING_CREATE` | Rare — usually clears within 5 min. Longer than that, email **`info@thewahda.com`**. |

---

## Next steps

- [Floating IPs →](/networking/floating-ips) — attach a public IPv4 to your load balancer.
- [Security groups →](/networking/security-groups) — open the listener port on the VIP.
- [Create a VM →](/compute/create-vm) — the backends behind your pool.
- [VPN →](/networking/vpn) — reach on-prem clients over an encrypted tunnel.
