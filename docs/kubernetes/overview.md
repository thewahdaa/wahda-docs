---
title: Managed Kubernetes overview
description: Managed Kubernetes on The Wahda Cloud — a managed control plane, node pools up to 100 nodes, load balancer and block-storage integration. INR pricing with GST invoicing.
keywords:
  - managed kubernetes
  - kubernetes as a service
  - k8s cluster hosting
  - container orchestration
  - kubernetes node pool
  - kubernetes load balancer
  - kubernetes india
  - data residency kubernetes
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
  - kubernetes control plane
image: /img/brand/social-card.png
---

# Managed Kubernetes

Run containers on a real Kubernetes cluster without building and babysitting the control plane. You choose a cluster size and a node shape; The Wahda Cloud provisions the control plane, joins the worker nodes, and hands you a `kubeconfig`. From there it's standard Kubernetes — `kubectl`, Helm, your existing manifests, your existing CI.

The cluster runs on the same platform as your VMs, in the same project, on the same private networks. That means a Kubernetes workload can talk to a [managed database](/databases/overview) or a VM over the private network with nothing in between, and can expose itself to the internet through the same [managed load balancer](/networking/load-balancer) you'd use for a fleet of VMs.

Nothing about the cluster is proprietary. It speaks the standard Kubernetes API, so anything that works against upstream Kubernetes — `kubectl`, Helm charts, operators, GitOps controllers — works here.

---

## What you get

| Capability | Details |
|---|---|
| **Managed control plane** | We run and patch the API server, scheduler, controller manager, and cluster datastore. You don't get a bill for control-plane VMs and you don't get paged when one reboots. |
| **Standard Kubernetes API** | Full `kubectl` access via a downloadable `kubeconfig`. No forked API, no vendor CLI required. |
| **Node pools** | Groups of identically-shaped worker nodes. Add pools for different workloads, scale each pool independently. See [Node pools](/kubernetes/node-pools). |
| **Up to 100 nodes per cluster** | The product ceiling for a single cluster. Real-world sizing is bounded by your project allocation and regional capacity — see [Capacity and honest limits](#capacity-and-honest-limits). |
| **Private networking** | Nodes sit on a private network and subnet inside your project, alongside your VMs and databases. |
| **Load balancer integration** | Publish a `Service` or an ingress through the managed L4/L7 load balancer and a [floating IP](/networking/floating-ips). See [Cluster networking](/kubernetes/networking). |
| **Persistent volumes** | Pods get durable storage from the same SSD block-storage pool that backs VM disks. |
| **India data residency** | Control plane and nodes run in the North India region (`in-north-az1`), in our Faridabad data centre. |
| **Console-driven** | Cluster lifecycle is managed from `console.thewahda.com`, like every other resource. |
| **INR + GST billing** | Pay-as-you-go, metered hourly, invoiced in INR with GST. |

---

## How the pieces fit

- **Cluster** — the tenant boundary for Kubernetes. One managed control plane, one or more node pools, one private network.
- **Control plane** — managed by us. You never SSH into it and you aren't billed for it as compute.
- **Node pool** — a set of worker nodes that all share one flavor, one image, and one availability zone. A cluster can have several.
- **Node** — a worker VM that runs your pods. Nodes consume your project's compute allocation exactly like any other instance.
- **Persistent volume** — a block-storage volume attached to a node and mounted into a pod.
- **Service / ingress** — how traffic reaches your pods. Cluster-internal traffic stays on the private network; public traffic comes in through a load balancer and a floating IP.

---

## When to use managed Kubernetes (and when not to)

### Use managed Kubernetes when

- You already ship **containers** and have manifests or Helm charts you want to run as-is.
- You want **rolling deploys, self-healing, and horizontal scaling** without wiring them together yourself out of systemd units and a reverse proxy.
- You run **many small services** and want them to share a pool of machines instead of each owning a VM.
- You want to **scale worker capacity up and down** as load changes, without rebuilding the platform underneath.
- Your team already knows `kubectl` and doesn't want to learn a provider-specific orchestration layer.

### Run plain VMs instead when

- You have **one or two services** and no container pipeline. A pair of VMs behind a [load balancer](/networking/load-balancer) is simpler, cheaper, and easier to debug at 3 a.m.
- Your workload is a **stateful single process** — a database, a message broker, a legacy monolith with local disk state. Use a VM, or a [managed database](/databases/overview) where the engine is one we run.
- You need **host-level control** — custom kernels, `perf`, hugepages, specific NIC tuning.
- **Nobody on the team owns Kubernetes.** An unowned cluster is a liability. Kubernetes moves the operational burden, it doesn't remove it.

The honest rule: Kubernetes pays for itself when you have enough services that scheduling them by hand has become the bottleneck. Below that line, VMs win.

---

## Capacity and honest limits

A single cluster supports **up to 100 nodes**. That is the platform ceiling, not a promise that any given cluster can reach it on demand — two things bound it in practice:

1. **Your project allocation.** Worker nodes draw on the same vCPU, RAM, and storage allocation as your VMs. A 100-node cluster of even modest nodes is a large allocation request. See [Projects & quotas](/getting-started/projects-and-quotas).
2. **Regional capacity.** The North India region is a finite, physical cluster. Very large clusters — and RAM-heavy node shapes in particular — need to be planned with us rather than provisioned blind.

If you're sizing a cluster beyond a handful of nodes, or you need a shape that isn't in the published flavor catalog, email **`info@thewahda.com`** before you build it. We'll confirm capacity and reserve it. That conversation takes a day; discovering a capacity wall mid-migration takes a week.

Single-region today: everything runs in the North India region. Multi-region Kubernetes is not a thing you can buy here yet — plan your DR accordingly and keep backups of anything stateful.

---

## Where to go next

- **You've never built a cluster here** → [Create a cluster](/kubernetes/create-cluster).
- **You need more capacity, or a second node shape** → [Node pools](/kubernetes/node-pools).
- **You need to expose a service to the internet** → [Cluster networking](/kubernetes/networking).
- **Your app needs a database** → [Managed databases](/databases/overview).
- **You want to understand the private-network model first** → [Networking overview](/networking/overview).
- **You're new to The Wahda Cloud entirely** → [Getting started](/getting-started/overview).

---

## Billing

Managed Kubernetes is billed **per hour of running state**, on the same pay-as-you-go model as VMs, invoiced in INR with GST.

- **Worker nodes** are billed at their flavor's rate, per node, for as long as the node exists. Scaling a node pool down stops the meter for the removed nodes.
- **Persistent volumes** are billed as block storage at the standard SSD rate, whether or not a pod is currently mounting them. Deleting a `PersistentVolumeClaim` whose reclaim policy is `Retain` does **not** stop that meter — delete the volume too.
- **Load balancers** created for a `Service` of type `LoadBalancer` are billed as load balancers, one per service, at the standard L4/L7 rate. Consolidate behind a single ingress if you're publishing many services.
- **Egress is free.** Traffic leaving the cluster to the internet is not metered.

{/* TODO: confirm with Odil — is the managed control plane itself billed as a separate line item, or bundled into node pricing? Written here as "not billed as compute", which needs confirmation before it stays. */}

If you hit an allocation limit when creating a cluster or scaling a pool, email **`info@thewahda.com`** and we'll raise it.
