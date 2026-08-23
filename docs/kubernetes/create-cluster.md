---
title: Create a Kubernetes cluster
description: Create a managed Kubernetes cluster from the console — pick a network, size the first node pool, download the kubeconfig, and deploy your first workload. INR pricing with GST invoicing.
keywords:
  - create kubernetes cluster
  - managed kubernetes setup
  - kubeconfig download
  - kubectl access
  - kubernetes node pool
  - deploy container cluster
  - kubernetes india
  - cloud kubernetes hosting
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
---

# Create a Kubernetes cluster

Stand up a managed Kubernetes cluster from the console, then talk to it with `kubectl` from your laptop. This page walks the creation flow end-to-end — decisions first, then verification, then your first workload.

> **Before you start**
> - An account on [console.thewahda.com](https://console.thewahda.com) — see [Sign up & first login →](/getting-started/sign-up).
> - A **private network and subnet** in the project for the nodes to sit on. Most projects come with one created automatically. See [Networking overview →](/networking/overview).
> - An **SSH key pair** in the project, if you want the ability to log into worker nodes for debugging. See [Key pairs →](/compute/keypairs).
> - Enough room in the project allocation for the nodes you're about to create. A node consumes compute exactly like a VM does — check [Projects & quotas →](/getting-started/projects-and-quotas#hit-a-soft-limit) before you size the first pool.
> - `kubectl` installed locally. Any recent version works; matching your cluster's minor version is ideal.

---

## Decide these four things first

The cluster wizard asks for the same four decisions every time. Work them out before you open it — changing the first three after the fact means rebuilding the cluster.

| Decision | How to choose |
|---|---|
| **Availability zone** | Leave the default (`in-north-az1`) unless you have a specific reason to pin location. |
| **Network & subnet** | The private network the worker nodes join. Put the cluster on the **same network as the resources it will talk to** — your managed database, your other VMs — so that traffic never leaves the private network. |
| **First node pool: flavor** | The shape of each worker node. See the sizing table below. |
| **First node pool: node count** | Start at **3**. Fewer than 3 gives you no room to drain a node for maintenance; more than 3 is easy to add later. |

### Sizing the first node pool

Worker nodes use the standard [flavor catalog](/compute/flavors). Kubernetes itself consumes a meaningful slice of every node — kubelet, container runtime, CNI, and system daemons — so the resources your pods can actually request are noticeably less than the flavor's nominal size.

| Flavor | vCPU | RAM | Reasonable as a worker node? |
|---|---|---|---|
| `m1.tiny` | 2 | 512 MB | **No.** Not enough RAM or disk to run the node components, let alone a pod. |
| `m1.small` | 1 | 2 GB | Dev and evaluation clusters only. Tight once system overhead is subtracted. |
| `m1.medium` | 2 | 4 GB | Sensible small-production default. Fits several modest services per node. |
| `m1.large` | 4 | 8 GB | The right starting point for real production workloads. |

:::tip Fewer, bigger nodes beat many tiny ones
Every node pays a fixed overhead for system components. Three `m1.large` nodes give you materially more schedulable capacity than twelve `m1.small` nodes at the same nominal total — and far fewer moving parts.
:::

If your workload needs a shape that isn't in the catalog, email **`info@thewahda.com`** before you build the cluster rather than after.

---

## 1. Open the Kubernetes section

From the left navigation in [console.thewahda.com](https://console.thewahda.com), open the **Kubernetes** section. The list shows every cluster in the current project with its status and node count.

Click the create button at the top-left of the table to open the wizard.

{/* TODO: confirm with Odil — exact left-nav label and create-button label in the console, and whether cluster creation is a multi-step wizard or a single form. Written generically here rather than guessing at UI strings. No screenshots exist for this section yet, so MacFrame blocks are deliberately omitted. */}

---

## 2. Name the cluster and pick the zone

| Field | What to enter |
|---|---|
| **Name** | A short identifier — letters, numbers, hyphens. Example: `prod-apps`. This shows up in every console list and in support tickets, so make it descriptive. |
| **Availability zone** | Leave the default (`in-north-az1`) unless you're deliberately pinning location. |

---

## 3. Attach the cluster to a network

Pick the **private network** and **subnet** the worker nodes will join.

- Choose the same network as the resources the cluster needs to reach — app VMs, a [managed database](/databases/overview) — so that traffic stays private and you don't need to route between networks.
- The nodes get private addresses on that subnet. They do not get public IPs by default; public exposure comes later, through a load balancer. See [Cluster networking](/kubernetes/networking).
- Make sure the network has a router with an external gateway. Nodes need outbound internet access to pull container images from public registries.

---

## 4. Configure the first node pool

Set the flavor and node count you worked out above.

| Field | Set it to |
|---|---|
| **Flavor** | `m1.large` for production, `m1.medium` for a small production cluster, `m1.small` for evaluation. |
| **Node count** | `3` to start. Scale later from [Node pools](/kubernetes/node-pools). |
| **Key pair** | An SSH key pair from the project, so you can log into a node if you ever need to debug at the host level. Set it now — you can't retrofit it onto existing nodes. |

The console's usage panel shows how the pool fits your project's current allocation as you pick. If it turns red, either drop the node count or [raise the allocation](/getting-started/projects-and-quotas#hit-a-soft-limit).

{/* TODO: confirm with Odil — the exact set of node-pool fields exposed at creation time (labels, taints, autoscaling toggles, node image selection, root-disk size). Only the fields we can verify are documented here. */}

---

## 5. Review and create

Check the name, the zone, the network, and the node count. Anything wrong here is cheaper to fix now than after the cluster exists.

Create the cluster. Provisioning takes several minutes — the control plane comes up first, then each worker node boots and joins. The cluster's status moves from a creating state to a healthy/active state when every node has joined.

If the cluster is still creating after 15 minutes, don't delete and retry blindly — email **`info@thewahda.com`** with the cluster name and we'll look at what stalled.

---

## 6. Get your kubeconfig

Open the cluster's detail page and download the **kubeconfig** file. Everything after this point is standard Kubernetes.

```bash
mkdir -p ~/.kube
mv ~/Downloads/kubeconfig.yaml ~/.kube/wahda-prod-apps.yaml
chmod 600 ~/.kube/wahda-prod-apps.yaml
export KUBECONFIG=~/.kube/wahda-prod-apps.yaml
```

:::caution The kubeconfig is a credential
It grants administrative access to the cluster. Treat it exactly like an SSH private key: `chmod 600`, never commit it to a repository, never paste it into a chat. If it leaks, rotate it from the console and assume the cluster was compromised.
:::

{/* TODO: confirm with Odil — where in the console the kubeconfig is downloaded from, and whether credential rotation is self-serve or a support request. */}

---

## 7. Verify the cluster

```bash
kubectl get nodes -o wide
```

Every node in the pool should report `Ready`. If a node is `NotReady` for more than a couple of minutes after creation finishes, check that the cluster's network has a working external gateway — a node that can't pull images will never come up clean.

```bash
kubectl get pods -A
```

System pods should all be `Running` or `Completed`.

---

## 8. Deploy something

A one-file smoke test that proves scheduling and in-cluster networking work:

```bash
kubectl create deployment hello --image=nginx:stable --replicas=2
kubectl expose deployment hello --port=80 --target-port=80
kubectl get pods -l app=hello
```

Then reach it from inside the cluster:

```bash
kubectl run curl --rm -it --image=curlimages/curl --restart=Never -- \
  curl -s http://hello.default.svc.cluster.local
```

An HTML response means scheduling, container networking, and service DNS all work. Clean up:

```bash
kubectl delete deployment hello
kubectl delete service hello
```

To publish a service to the internet instead of just inside the cluster, see [Cluster networking](/kubernetes/networking).

---

## Next steps

- [Node pools →](/kubernetes/node-pools) — scale the cluster, add a second node shape
- [Cluster networking →](/kubernetes/networking) — expose services, load balancers, security groups
- [Managed databases →](/databases/overview) — give your workloads a database on the same private network
- [Security groups →](/networking/security-groups) — the firewall model your nodes inherit
