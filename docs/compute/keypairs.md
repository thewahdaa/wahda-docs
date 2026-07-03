---
title: Key pairs
description: Create and manage SSH key pairs to log into your virtual machines.
---

# Key pairs

A **key pair** is the SSH keypair The Wahda Cloud installs on your VM at boot so you can log in as the default user without a password. Key pairs are the recommended login method for every production VM — passwords are supported but discouraged.

On this page:

- **Create Keypair** — generate a new pair in the browser and download the private key.
- **Import Keypair** — paste an SSH public key you already have (from your laptop or an existing hardware token).

---

## Where they live

From the left navigation: **Compute → Key Pairs**. The page lists every key pair in the current project. Fresh project → empty list.

<MacFrame
  src="/img/screenshots/compute/keypairs/01-list-empty.png"
  alt="Key Pairs page — empty list on a fresh project"
  title="Compute › Key Pairs"
  caption="Fresh project. Click Create Keypair to add one."
/>

The header shows **Create Keypair** on the left and **Delete** for selection actions.

:::note One key pair per user is normal
Most teams use one keypair per developer (their own laptop's SSH key) and share it into every project they work in. Keeping the roster small makes it easier to rotate.
:::

---

## Create a new key pair

Click **Create Keypair**. A dialog opens with two tabs: **Create Keypair** (generate a new one) and **Import Keypair** (paste an existing one). Both live under the same modal.

<MacFrame
  src="/img/screenshots/compute/keypairs/02-create-keypair.png"
  alt="Create Keypair dialog — Create Keypair tab active"
  title="Compute › Key Pairs › Create Keypair"
  caption="Two tabs: Create Keypair generates a new one; Import Keypair takes a public key you already have."
/>

### Generate a new one (Create Keypair tab)

Fill in:

| Field | What to enter |
|---|---|
| **Name** | Something you'll recognize. `laptop-2026` or `ops-shared` works better than `key1`. 1–128 chars, digits/letters/`-`/`_`. |

Click **OK**. The platform generates a 2048-bit RSA key pair, keeps the **public key** in the project, and streams the **private key** to your browser as a `.pem` download.

:::caution The private key is shown once — download it now
That download is the only time you get the private key. The platform does **not** store it. If you close the dialog without saving the file, you'll have to delete the key and create a new one. Put the file somewhere you back up: a password manager, or `~/.ssh/` on a machine that's already encrypted.
:::

Set permissions so `ssh` will accept it:

```bash
chmod 600 ~/Downloads/laptop-2026.pem
```

You can now use it to log in to any VM this project boots with the keypair selected (see [Create a VM → Step 3 · System Config](/compute/create-vm#4-step-3--system-config)):

```bash
ssh -i ~/Downloads/laptop-2026.pem ubuntu@<vm-ip>
```

---

## Import an existing key (Import Keypair tab)

If you already have an SSH key on your laptop (`~/.ssh/id_ed25519`, `~/.ssh/id_rsa`), you don't need to generate a new one — import the **public** side and reuse it.

Switch the dialog to **Import Keypair**. You'll be asked for:

| Field | What to enter |
|---|---|
| **Name** | A recognizable label. |
| **Public Key** | The `.pub` contents. On your laptop: `cat ~/.ssh/id_ed25519.pub` and paste the whole line, starting with `ssh-ed25519 AAAA…` or `ssh-rsa AAAA…`. |

Click **OK**. The public key is stored on the project — your **private key stays on your laptop and never leaves it**. This is the more secure option and the one to prefer if you have the choice.

### Getting the public key on your laptop

```bash
# ed25519 (recommended)
cat ~/.ssh/id_ed25519.pub

# RSA (fallback)
cat ~/.ssh/id_rsa.pub

# If nothing exists, generate a pair on your laptop:
ssh-keygen -t ed25519 -C "you@laptop"
```

---

## Using a key pair

Once the key pair exists in the project, it appears in the **Key Pair** dropdown on Step 3 of the Create VM wizard. Pick it there and the platform installs it as an authorized key for the image's default user at first boot.

You SSH in with the **private key** you saved (for generated pairs) or the private key on your laptop (for imported pairs):

```bash
ssh -i ~/Downloads/laptop-2026.pem ubuntu@<vm-ip>       # generated
ssh ubuntu@<vm-ip>                                       # imported (uses ~/.ssh/id_ed25519 by default)
```

The default user depends on the image — see [Create a VM → Step 7 · Connect](/compute/create-vm#7-connect).

---

## Deleting a key pair

Tick the key pair row → **Delete** in the header. Deleting the key pair does **not** log existing VMs out — the public key is already baked into `~/.ssh/authorized_keys` on each VM, so SSH access continues until you remove it there. Delete on the platform prevents *new* VMs from being seeded with it.

To rotate cleanly:

1. Import (or generate) a new key pair.
2. Add it to `~/.ssh/authorized_keys` on every VM that used the old one.
3. Remove the old key from `authorized_keys`.
4. Delete the old key pair from the console.

---

## Next steps

- [Create a VM →](/compute/create-vm) — pick your key pair in Step 3.
- [Connect over SSH →](/compute/connect-ssh) — log in once the VM is up.
- [Security groups →](/networking/security-groups) — you'll also need port 22 open to actually reach the VM.
