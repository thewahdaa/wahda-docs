---
title: Connect to your VM
description: SSH into your cloud VM via floating IP, through a bastion, or with an SSH config alias. Default users for Ubuntu, AlmaLinux, Rocky, CentOS, Debian.
keywords:
  - SSH into cloud VM
  - connect to cloud VM
  - SSH floating IP
  - SSH bastion host
  - SSH config alias
  - cloud VM login
  - Ubuntu ubuntu user
  - Rocky rocky user
  - cloud VM access
  - SSH troubleshooting
  - The Wahda Cloud
---

# Connect to your VM

Your VM is `Active`, you've got the private key — now log in. Three ways to reach a Linux VM on The Wahda Cloud, in order of preference for day-to-day work.

---

## Before you connect

You need three things:

- The VM's **IP address** — visible on **Compute → Instances**, in the `Fixed IP` column (private) or `Floating IP` column (public).
- The **private key** — `.pem` from a generated key pair, or `~/.ssh/id_ed25519` for an imported one. See [Key pairs →](/compute/keypairs).
- The image's **default username** — `ubuntu` for Ubuntu, `almalinux` for AlmaLinux, `rocky` for Rocky Linux, `cloud-user` for CentOS Stream, `kali` for Kali. For images you uploaded yourself, check the image's **OS Admin** field.
- A **security group** on the VM that allows inbound TCP 22 from your source. Without this, SSH will time out no matter what else is right. See [Security groups →](/networking/security-groups).

---

## 1. Direct SSH via floating IP

The most common setup. Your VM has a **floating IP** (public IPv4) attached, and you SSH to it from your laptop.

```bash
ssh -i ~/Downloads/laptop-2026.pem ubuntu@165.99.104.42
```

`-i <path>` names the private key. Skip it if the key lives at the default location (`~/.ssh/id_ed25519`, `~/.ssh/id_rsa`) — SSH tries those automatically.

First connection prompts:

```
The authenticity of host '165.99.104.42' can't be established.
ED25519 key fingerprint is SHA256:…
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and Enter. This trust decision is recorded in `~/.ssh/known_hosts` for the future.

:::tip Right user, wrong error
`Permission denied (publickey)` almost always means the **user is wrong**. Ubuntu images want `ubuntu`, Rocky wants `rocky`, and so on. Fixing the username fixes it 90% of the time.
:::

If the VM has no floating IP yet, follow [Floating IPs →](/networking/floating-ips) to attach one.

---

## 2. SSH config alias

Retyping keys, IPs, and usernames gets old. Add a stanza to `~/.ssh/config`:

```text title="~/.ssh/config"
Host web01
  HostName 165.99.104.42
  User ubuntu
  IdentityFile ~/Downloads/laptop-2026.pem
  IdentitiesOnly yes
```

Then:

```bash
ssh web01
```

`IdentitiesOnly yes` tells SSH to try **only** the key you specified — useful when you have many keys loaded and want to avoid `Too many authentication failures`.

Add one stanza per VM, or use wildcards for a project:

```text
Host wahda-*
  User ubuntu
  IdentityFile ~/Downloads/laptop-2026.pem
  IdentitiesOnly yes

Host wahda-web01
  HostName 165.99.104.42
```

---

## 3. Through a bastion (jump host)

Production layouts often run **one** bastion (jump host) with a floating IP and keep every other VM on the private network with no floating IP. This shrinks the attack surface — the private VMs are only reachable through the bastion.

To SSH into a private VM through the bastion:

```bash
ssh -J ubuntu@bastion.example.com ubuntu@10.0.0.15
```

`-J` (jump) opens a session on the bastion first, then a second session from the bastion into the private VM. You need your key to be accepted **on both hops**.

Same thing in `~/.ssh/config` — cleaner and reusable:

```text title="~/.ssh/config"
Host bastion
  HostName 165.99.104.42
  User ubuntu
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes

Host wahda-*
  User ubuntu
  ProxyJump bastion
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes

Host wahda-web01
  HostName 10.0.0.15
```

Now `ssh wahda-web01` goes through the bastion transparently.

:::note Bastion hardening in one line
Give the bastion only one job: forwarding SSH sessions. Disable everything else. A minimal `sshd_config`: no root login, key-based auth only (no passwords), a small `AllowUsers` list, and fail2ban logging.
:::

---

## 4. First-boot delay

If SSH times out **immediately after** the VM shows `Active`, the OS is often still finishing cloud-init. Give it 30–60 seconds. During that window `ping` may work but `ssh` won't respond — cloud-init hasn't installed the SSH keys yet.

You can watch cloud-init from the console (**Instances → click the VM → Console** tab) — look for `Cloud-init` lines finishing with `finished at` before you retry.

---

## Copying files (scp / rsync)

The same key, user, and address work for `scp` and `rsync`:

```bash
# scp — one shot
scp -i ~/Downloads/laptop-2026.pem local.tar.gz ubuntu@165.99.104.42:~/

# rsync — resumable, keeps permissions
rsync -avz -e "ssh -i ~/Downloads/laptop-2026.pem" ./site/ ubuntu@165.99.104.42:/var/www/site/
```

Through a bastion:

```bash
scp -o "ProxyJump ubuntu@bastion" local.tar.gz ubuntu@10.0.0.15:~/
```

---

## Troubleshooting

| Symptom | Most likely cause |
|---|---|
| `Connection timed out` | Security group blocks port 22 from your IP. Fix in [Security groups →](/networking/security-groups). |
| `Permission denied (publickey)` | Wrong username (`ubuntu` vs `rocky` vs `centos`), or the wrong key is being offered. Retry with `-vvv` and check which key SSH tries. |
| `Too many authentication failures` | Your agent is offering too many keys; SSH gives up. Add `IdentitiesOnly yes` and name the right key with `IdentityFile`. |
| `Host key verification failed` | The VM was recreated and got a new host key. Remove the old fingerprint: `ssh-keygen -R <ip-or-hostname>`. |
| `port 22: Connection refused` | The SSH server isn't running on the VM. The image is bad, or SSH crashed. Reboot the instance from the console. |

---

## Windows VMs — use RDP, not SSH

Windows images ship with RDP enabled on port 3389. You reach them from the built-in Remote Desktop client on your OS:

- **Windows**: `mstsc` → paste the floating IP.
- **macOS**: **Windows App** (formerly Microsoft Remote Desktop) from the App Store.
- **Linux**: `xfreerdp /u:administrator /p:<password> /v:<ip>`.

The image's admin username is `administrator`; you set the password in the Create VM wizard's Step 3.

---

## Next steps

- [Security groups →](/networking/security-groups) — open port 22 the right way.
- [Floating IPs →](/networking/floating-ips) — attach a public IPv4 to a VM.
- [Create a VM →](/compute/create-vm) — the wizard, if you haven't yet.
