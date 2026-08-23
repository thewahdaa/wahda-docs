---
title: Node pools & scaling
description: Manage Kubernetes worker capacity on The Wahda Cloud — node pool design, flavor selection, scaling up and down, and draining nodes safely. INR pricing with GST invoicing.
keywords:
  - kubernetes node pool
  - scale kubernetes cluster
  - kubernetes worker nodes
  - node flavor selection
  - drain kubernetes node
  - cluster capacity planning
  - kubernetes scaling india
  - cloud kubernetes hosting
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
---

# Node pools & scaling

A **node pool** is a group of worker nodes that share one flavor, one availability zone, and one configuration. A cluster has at least one; you add more when you need worker nodes of a different shape.

Node pools are where all of a cluster's cost and capacity live. The managed control plane is ours to run; the node pools are yours to size.

---

## Why more than one pool

One pool is the right answer for most clusters. Add a second when the workloads genuinely differ:

- **Different resource profiles.** Memory-hungry services on a large-RAM shape, small stateless APIs on a smaller one, so you're not paying for RAM that nothing schedules onto.
- **Workload isolation.** A pool dedicated to batch or CI jobs, kept away from the pool serving live traffic, so a runaway build can't evict a production pod.
- **Staged flavor migration.** Create a pool on the new shape, drain the old pool onto it, delete the old pool. No cluster rebuild, no downtime.

If you can't name which workloads go where, you don't need a second pool yet.

---

## Choosing a flavor for worker nodes

Worker nodes use the standard [flavor catalog](/compute/flavors). Two things to hold in mind while sizing:

**System overhead is per node, not per cluster.** Every node runs kubelet, a container runtime, networking components, and monitoring agents before a single pod of yours is scheduled. That overhead is roughly fixed, so it's a much larger fraction of a small node than a large one.

**The largest pod must fit on one node.** A pod requesting 6 GB of RAM will never schedule on a pool of 4 GB nodes, no matter how many of them there are. Size the pool for your biggest workload, not your average one.

| Flavor | vCPU | RAM | Role in a cluster |
|---|---|---|---|
| `m1.tiny` | 2 | 512 MB | Not usable as a worker node. |
| `m1.small` | 1 | 2 GB | Evaluation and dev clusters. Little schedulable headroom after overhead. |
| `m1.medium` | 2 | 4 GB | Small production. Several modest services per node. |
| `m1.large` | 4 | 8 GB | Production default. The first flavor with comfortable room for real workloads plus overhead. |

:::tip Three large beats twelve small
Fewer, larger nodes give you more schedulable capacity for the same nominal total, better bin-packing, and fewer things to monitor. Go wide only when you need failure-domain spread, not by default.
:::

Need a shape that isn't in the catalog — more RAM per vCPU, or a larger node than `m1.large`? Email **`info@thewahda.com`** with the target vCPU / RAM / disk and what you're running. Larger and memory-optimised shapes can be added; they aren't on the shared catalog by default.

---

## Scaling a pool up

Scaling up is the safe direction. Set a new node count on the pool; new nodes boot, join the cluster, and become schedulable. Existing nodes and running pods are untouched.

```bash
# Watch the new nodes arrive
kubectl get nodes -w
```

Pods that were `Pending` for lack of capacity get scheduled as soon as a new node reports `Ready`. Nothing rebalances automatically — Kubernetes will not move already-running pods onto the new nodes. If you want the fleet spread evenly after scaling up, roll your deployments:

```bash
kubectl rollout restart deployment/<name>
```

**Before you scale up, check two ceilings:**

1. **Project allocation.** Nodes consume the same vCPU / RAM / storage allocation as VMs. See [Projects & quotas](/getting-started/projects-and-quotas#hit-a-soft-limit).
2. **Regional capacity.** The North India region is a finite physical cluster, and RAM is its most constrained resource. A large scale-up — especially onto RAM-heavy shapes — is worth a mail to **`info@thewahda.com`** first so we can confirm the capacity is there. This matters more than it would on an infinite cloud, and we'd rather tell you honestly than fail your provisioning request mid-incident.

---

## Scaling a pool down

Scaling down removes nodes, and the pods on them go with the node. Do it deliberately.

**The safe sequence:**

```bash
# 1. Stop scheduling new work onto the node
kubectl cordon <node-name>

# 2. Evict what's running, respecting PodDisruptionBudgets
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 3. Confirm the pods rescheduled elsewhere and are Ready
kubectl get pods -A -o wide | grep -v Running
```

Only once the workloads have moved should you reduce the pool's node count in the console.

:::caution Drain before you shrink
Reducing node count without draining is an abrupt termination. Pods are killed with whatever grace period they declare, `emptyDir` data is gone, and anything without a `PodDisruptionBudget` can lose all its replicas at once. Cordon, drain, verify, then shrink.
:::

**Set PodDisruptionBudgets on anything that serves traffic.** Without one, a drain has no obligation to keep replicas available:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api
```

**Never shrink below 3 nodes on a production cluster.** At two nodes you cannot drain one for maintenance without running the whole workload on a single machine.

---

## Rolling a pool onto a new flavor

Changing the shape of existing nodes isn't a thing — nodes are immutable. Migrate instead:

1. Create a **new node pool** with the target flavor and enough capacity for the workload.
2. Wait for the new nodes to report `Ready`.
3. `cordon` every node in the old pool so nothing new schedules there.
4. `drain` the old nodes one at a time, verifying pods land healthy on the new pool between each.
5. Delete the old pool once it's empty.

You are paying for both pools during the overlap. Keep the window short, but don't rush step 4 — one node at a time is the difference between a migration and an outage.

**Rollback:** if the new pool misbehaves, `uncordon` the old nodes and drain the new pool back the other way. This is why you delete the old pool last, not first.

---

## Autoscaling

{/* TODO: confirm with Odil — whether cluster autoscaling (automatic node-count adjustment based on pending pods) is available on the managed offering today. Not documented as available here because it is unverified; scaling is described as an explicit operator action. */}

Today this page documents **explicit** scaling: you decide the node count and change it. Plan capacity for your peak, not your average, and keep headroom for a node failure.

A workable rule: size the pool so that losing one node still leaves enough capacity to run everything. On a 3-node pool that means running at roughly two-thirds utilisation or below.

Note that **[Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) works normally** — pods can scale automatically within the capacity the node pool already provides. It's the node count itself that's an explicit action.

---

## What to watch

Four numbers tell you whether the pool is sized right:

| Signal | Command | What it means |
|---|---|---|
| **Pending pods** | `kubectl get pods -A --field-selector=status.phase=Pending` | Anything pending for more than a minute usually means no node has room. Scale up. |
| **Node allocatable vs. requested** | `kubectl describe node <name>` | Consistently above ~80% requested on every node means you have no failure headroom. |
| **Node readiness** | `kubectl get nodes` | A `NotReady` node that doesn't recover in a few minutes is a support ticket, not a retry. |
| **Evictions** | `kubectl get events -A --field-selector reason=Evicted` | Evictions mean nodes are running out of memory or disk. Bigger nodes, or fewer pods per node. |

---

## Billing

Every worker node is billed at its flavor's rate, per hour of existence, in INR with GST — the same pay-as-you-go meter as a VM. Scaling a pool down stops the meter for the removed nodes as soon as they're deleted.

The managed control plane is not billed as compute you provision. Persistent volumes and load balancers created by workloads in the cluster are billed separately at their standard rates — see [Billing in the overview](/kubernetes/overview#billing).

---

## Next steps

- [Cluster networking →](/kubernetes/networking) — expose services, load balancers, security groups
- [Create a cluster →](/kubernetes/create-cluster) — the full creation walkthrough
- [Flavors →](/compute/flavors) — the full shape catalog
- [Projects & quotas →](/getting-started/projects-and-quotas) — raising your allocation
