---
title: Sign up & first login
description: Sign up for The Wahda Cloud — request a cloud account, receive credentials, and log into the console to launch your first cloud VM.
keywords:
  - cloud sign up
  - create cloud account
  - cloud provider account
  - cloud console login
  - pay-as-you-go cloud
  - GST cloud billing
  - INR pricing
  - cloud onboarding
  - cloud free trial
  - cloud credentials
  - The Wahda Cloud
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

Go to [**console.thewahda.com**](https://console.thewahda.com) — the web console for The Wahda Cloud.

<MacFrame
  src="/img/screenshots/getting-started/01-login-page.png"
  alt="The Wahda Cloud sign-in page"
  title="console.thewahda.com — Sign in"
  caption="The sign-in page. Region and domain are usually pre-filled."
/>

Enter what you received:

| Field | What to enter |
|---|---|
| **Username** | The username from your welcome email. |
| **Password** | Your initial password. |

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

Four things to notice on this screen:

1. **Project selector** (top bar) — the project you're currently working in. Every resource you create goes here.
2. **Region selector** (top bar) — the region every action targets. Resources are region-scoped; switching region hides everything from the other region.
3. **Quota Overview** — compute, storage, and network usage vs. current allocation in this project, broken out by resource type. See [Projects →](/getting-started/projects-and-quotas).
4. **Hello, `<your-username>`** panel on the right — shows your username, your assigned roles (`reader`, `member`, `manager`, `admin`), and your affiliated domain.

---

## Next steps

- [Projects →](/getting-started/projects-and-quotas) — how projects group your resources and what to do when you need more room.
- [Create your first VM →](/compute/create-vm) — the end-to-end walkthrough.
