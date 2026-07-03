---
title: Sign up & first login
description: Request access to The Wahda Cloud, receive your credentials, and log into the console.
---

# Sign up & first login

You need an account before you can create anything. This page walks the fastest path from zero to a working session in the console.

---

## 1. Request an account

Onboarding today is assisted rather than fully self-serve — a member of the team provisions your first project and sends you the credentials.

- Fill in the contact form at [**thewahda.com**](https://thewahda.com), or
- Email **`info@thewahda.com`** with:
  - Your full name and organization
  - A work email address (used as your login)
  - What you're building — one or two sentences is enough

You'll receive a reply with your **username**, an **initial password**, and the name of your first **project**.

:::tip Ask for the quota you actually need
If you already know you need more than a handful of VMs, or a specific database size, mention it in the request. Starting with the right quota is easier than raising it later.
:::

---

## 2. Open the console

Go to [**console.thewahda.com**](https://console.thewahda.com). This is **Skyline** — the web UI for The Wahda Cloud.

<MacFrame
  src="/img/screenshots/getting-started/01-login-page.png"
  alt="The Wahda Cloud sign-in page"
  title="console.thewahda.com — Sign in"
  caption="The sign-in page. Region and domain are usually pre-filled."
/>

Enter what you received:

| Field | What to enter |
|---|---|
| **Domain** | The domain provided in your welcome email — typically `default`. |
| **Username** | Your username. |
| **Password** | Your initial password. |
| **Region** | Leave the default (`in-north-1`). |

<MacFrame
  src="/img/screenshots/getting-started/02-login-filled.png"
  alt="Sign-in form with credentials filled in"
  title="console.thewahda.com — Sign in"
  caption="Ready to sign in."
/>

Click **Log in**.

:::caution Change the initial password
The first thing you should do after landing in the console is change your password. Top-right avatar → **My Profile** → **Change Password**.
:::

---

## 3. You're in

After sign-in you land on the project **Home** dashboard — a summary of the current project, your role, and quotas in this region.

<MacFrame
  src="/img/screenshots/getting-started/03-dashboard.png"
  alt="Home dashboard for a new project"
  title="The Wahda Cloud — Home"
  caption="Home dashboard. The bar across the top switches project and region."
/>

Three things to notice on this screen:

1. **Project selector** (top bar) — the project you're currently working in. Every resource you create goes here.
2. **Region selector** (top bar) — the region every action targets. Resources are region-scoped; switching region hides everything from the other region.
3. **Usage tiles** — compute, storage, and networking used vs. currently allocated in this project. See [Projects →](/getting-started/projects-and-quotas).

---

## Next steps

- [Projects →](/getting-started/projects-and-quotas) — how projects group your resources and what to do when you need more room.
- [Create your first VM →](/compute/create-vm) — the end-to-end walkthrough.
