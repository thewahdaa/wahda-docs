---
title: Cluster networking
description: How pod networking, load balancers, floating IPs and security groups work together on a managed Kubernetes cluster on The Wahda Cloud. INR pricing with GST invoicing.
keywords:
  - kubernetes networking
  - kubernetes load balancer
  - kubernetes ingress
  - pod network
  - cluster IP service
  - kubernetes security group
  - floating IP kubernetes
  - private network kubernetes
  - kubernetes TLS termination
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
---

# Cluster networking

A managed Kubernetes cluster sits inside your project's private network, exactly like a VM does. That gives you two layers of networking that have to agree with each other:

- **Inside the cluster** — pods, services, and cluster DNS. This is standard Kubernetes and behaves the way the upstream docs say it does.
- **Outside the cluster** — the private network, security groups, load balancers, and floating IPs. This is the same platform networking you already use for VMs, documented in [Networking overview](/networking/overview).

Most cluster networking confusion comes from debugging the wrong layer. This page explains where the boundary is.

---

## The two layers

| Layer | What lives there | Who controls it |
|---|---|---|
| **Pod network** | Pod IPs, `ClusterIP` services, cluster DNS (`*.svc.cluster.local`) | Kubernetes, inside the cluster. Managed with `kubectl` and manifests. |
| **Node network** | Worker node private IPs, subnets, routers | The project's private network. Managed in the console. |
| **Edge** | Load balancers, floating IPs, security groups | The platform. Managed in the console. |

Pod IPs are **internal to the cluster**. Nothing outside the cluster routes to a pod IP directly — not your VMs, not your laptop, not a managed database. Traffic in and out of the cluster always goes through a node or through a load balancer.

{/* TODO: confirm with Odil — which CNI plugin the managed clusters run, and the default pod/service CIDR ranges. Left unstated rather than guessed, because it determines whether pod CIDRs can collide with an existing private subnet during a VPN or peering setup. Worth documenting once confirmed. */}

---

## Reaching things outside the cluster

Your pods reach the rest of the project over the **node's** network, using the node's private IP as the source address. Practically, that means:

- A pod can reach a **[managed database](/databases/overview)** on the same private network by its private endpoint. Nothing special is required — the database sees traffic arriving from the worker node's IP.
- A pod can reach a **VM** on the same private network by its private IP.
- A pod reaches the **internet** through the network's router and external gateway. If the cluster's network has no gateway, image pulls from public registries will fail and nodes will never come up clean.

Because outbound traffic is sourced from node IPs, any security group or firewall rule that needs to allow the cluster should allow the **node subnet**, not a pod range.

:::tip Put the cluster on the network it needs to talk to
The simplest working topology is one private network holding the cluster nodes, the app VMs, and the managed database. No routing between networks, no cross-network security group rules to reason about.
:::

---

## Publishing a service to the internet

Three service types, three different levels of exposure.

### `ClusterIP` — internal only (the default)

```bash
kubectl expose deployment api --port=80
```

Reachable only from inside the cluster, by DNS name (`api.default.svc.cluster.local`). This is the right default for anything that only other pods call.

### `NodePort` — reachable on every node's private IP

Opens a high port (30000–32767 by default) on every worker node. Useful as a backend for a load balancer, or for debugging from a VM on the same network. **Not** a way to publish to the internet on its own — nodes have private IPs.

### `LoadBalancer` — published through the managed load balancer

The production pattern. Traffic arrives at a [managed load balancer](/networking/load-balancer) holding a [floating IP](/networking/floating-ips), and the load balancer distributes it across the cluster's nodes.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
    - port: 443
      targetPort: 8080
```

{/* TODO: confirm with Odil — whether a Service of type LoadBalancer is automatically fulfilled by the platform (a cloud controller provisioning a managed load balancer and floating IP on the customer's behalf), or whether the load balancer must be created manually in the console and pointed at NodePorts. Both patterns are described below so the page is useful either way; delete the one that doesn't apply once confirmed. */}

**If the platform fulfils it automatically**, the service's `EXTERNAL-IP` populates within a minute or two:

```bash
kubectl get svc api -w
```

**If it doesn't**, the manual equivalent is: expose the service as a `NodePort`, then create a load balancer in the console with the worker nodes as pool members on that node port, attach a health monitor, and give the load balancer a floating IP. That flow is documented step by step in [Load balancer](/networking/load-balancer).

---

## Ingress: one load balancer, many services

Each `LoadBalancer` service is billed as its own load balancer. Publishing twelve services that way means twelve load balancer bills.

The cheaper and more manageable pattern is an **ingress controller**: one `LoadBalancer` service in front of an ingress controller running in the cluster, and then host- or path-based routing to everything behind it, defined as `Ingress` resources. One floating IP, one load balancer bill, `n` services.

Any standard ingress controller works — the cluster runs the standard Kubernetes API, so upstream Helm charts install normally. Handle TLS either at the ingress controller (with certificates stored as Kubernetes secrets) or at the load balancer (see [TLS termination](/networking/load-balancer)), but pick one place and keep it there.

:::caution Don't do session persistence by source IP
Traffic arriving through a load balancer and then through a service has been through at least one hop of address translation, and Indian mobile networks put large numbers of distinct users behind shared addresses anyway. Use cookie-based session affinity at layer 7, or design the app to be stateless.
:::

---

## Security groups and the cluster

Worker nodes are VMs, so they carry [security groups](/networking/security-groups) like any other instance. The rules matter in both directions:

- **Node-to-node traffic must be allowed.** Pods on different nodes talk to each other through the node network. A security group that blocks traffic between worker nodes will produce cluster-wide symptoms that look nothing like a firewall problem — services intermittently unreachable depending on which node the pod landed on.
- **Load balancer to node ports must be allowed** for the ports your services are published on.
- **Everything else inbound should stay closed.** The default deny-all posture is correct. Don't open a node's ports to `0.0.0.0/0` to debug something; use `kubectl port-forward` instead:

  ```bash
  kubectl port-forward svc/api 8080:80
  ```

- **SSH to nodes** should be reachable only from a jump host or over a [VPN](/networking/vpn), never from the public internet.

Security groups do **not** filter pod-to-pod traffic inside a node. If you need to restrict which pods can talk to which, that's a Kubernetes `NetworkPolicy`, not a security group — a different layer, enforced by the cluster.

{/* TODO: confirm with Odil — whether NetworkPolicy enforcement is active on the managed clusters. Some CNI plugins accept NetworkPolicy objects without enforcing them, which is worse than not supporting them at all. Do not tell customers to rely on NetworkPolicy for isolation until this is verified. */}

---

## Debugging checklist

When something can't reach something else, work outward one layer at a time:

| Symptom | First thing to check |
|---|---|
| Pod can't resolve a cluster service | `kubectl get pods -n kube-system` — is cluster DNS running? |
| Pod can't reach a database on the private network | Is the cluster on the same network? Does the DB's rules allow the node subnet? |
| Pod can't reach the internet / image pulls fail | Does the cluster's network have a router with an external gateway? |
| Service has no `EXTERNAL-IP` | `kubectl describe svc <name>` — read the events at the bottom. |
| Load balancer shows backends unhealthy | Health-check port and path, then the node's security group. |
| Works from one node, fails from another | Node-to-node security group rules. |

---

## Where to go next

- [Load balancer →](/networking/load-balancer) — listeners, pools, health monitors, TLS
- [Floating IPs →](/networking/floating-ips) — public IPv4 for your edge
- [Security groups →](/networking/security-groups) — the deny-by-default firewall model
- [VPN →](/networking/vpn) — reach the cluster's private network from your office
- [Node pools →](/kubernetes/node-pools) — sizing and scaling the workers behind all of this
