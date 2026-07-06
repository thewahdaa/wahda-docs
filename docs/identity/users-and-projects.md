---
title: Users, projects and access
description: Manage cloud users, roles, projects, and application credentials on The Wahda Cloud. Assign RBAC per project, create machine credentials for CI, rotate keys.
keywords:
  - cloud user management
  - cloud IAM
  - role-based access
  - application credentials
  - service account
  - cloud RBAC
  - user roles
  - GST cloud billing
  - INR pricing
  - The Wahda Cloud
  - identity management
image: /img/brand/social-card.png
---

# Users, projects and access

Everything you build on The Wahda Cloud belongs to a **project**, and every project has one or more **users** with specific **roles**. This page covers the day-to-day identity actions: adding a teammate, giving them the right role, creating machine credentials for CI, rotating credentials cleanly.

---

## The pieces

| Piece | What it is | Where you touch it |
|---|---|---|
| **User** | A human sign-in — username + password on `console.thewahda.com`. | Onboarded by ops today; email **`info@thewahda.com`** to add. |
| **Project** | The tenant boundary that owns all your resources. See [Projects](/getting-started/projects-and-quotas). | Ops today; self-serve is on the roadmap. |
| **Role** | What a user can do inside a specific project — read-only, write, admin. | Assigned per user per project. |
| **Domain** | A namespace for users and projects. Most tenants only ever see their own domain. | Assigned at account creation; you don't change it. |
| **Application credential** | A machine sign-in — access key + secret — scoped to one project. Used by CI, cron jobs, custom scripts. | You create these yourself, in the console. |

---

## What each role can do

Roles are assigned **per user per project**. A user can have different roles in different projects — read-only in `prod`, full access in `dev`.

| Role | What they can do | Use it for |
|---|---|---|
| **`reader`** | List and view every resource in the project. No create, update or delete. | Auditors, on-call viewers, cost reviewers, dashboards. |
| **`member`** | Everything a `reader` can do, plus create, update, and delete resources in the project. Cannot manage other users' access to the project. | Every engineer on the team. |
| **`manager`** | Everything a `member` can do, plus manage other users' role bindings inside the project (add/remove teammates). | Team leads, delivery managers. |
| **`admin`** | Everything a `manager` can do, plus project-wide administrative actions. | Project owner; keep the list of people with this role short. |

You can see the roles you carry on the console's **Home** dashboard: the **Hello, `<username>`** panel on the right lists your username, your assigned roles for the current project, and your affiliated domain.

:::tip Give the smallest role that still lets the job get done
The default we'd suggest for most teams: everyone starts as `member`, team leads carry `manager`, exactly one person is `admin`. `reader` is for people who need to see but shouldn't change anything — auditors, finance reviewers.
:::

---

## Adding a teammate

Self-serve user creation is on the roadmap. Right now, ops adds users on request. Send a note to **`info@thewahda.com`** with:

- The teammate's **email address** (this becomes their sign-in username, and where the welcome mail with the initial password goes).
- Which **projects** they should have access to.
- Which **role** on each project (see the table above).

You'll get back a confirmation once the account is provisioned. The teammate lands on [Sign up & first login](/getting-started/sign-up) for their first session.

### Changing an existing user's role

Same channel — email ops with the teammate's username, the project, and the new role. Role changes apply within a minute of the update.

### Removing access (offboarding)

For a teammate leaving or moving off a project:

1. Email ops with the username and the projects to revoke.
2. If you had shared any [application credentials](#application-credentials) with them for machine use, **rotate those credentials** — see below.
3. If you had shared a personal SSH [key pair](/compute/keypairs) with them, **rotate the keys on every VM** that carried it, then delete the pair from the project.

Losing access to the account isn't enough on its own — you have to invalidate every credential and key they touched.

---

## Application credentials

Application credentials are how you let a **script, CI job, cron task, or command-line tool** act on the platform without embedding a human's password anywhere. They are:

- **Scoped to one project.** An app credential can act only on the project you created it in.
- **Revocable.** Delete it in one click and every job using it stops working immediately.
- **Optional expiry.** Set a deletion date — good practice for short-lived credentials tied to a specific job.
- **Independent of any user's password.** Rotating a human's password does not touch app creds.

### When to use one

- The `aws-cli` profile that talks to your S3-compatible bucket — see [Storage → Object storage](/storage/overview#configure-aws-cli).
- CI/CD provisioning cloud VMs or updating a load balancer's members during a deploy.
- A cron job on a jump host taking nightly database dumps and pushing them to object storage.
- Any monitoring or observability tool that reads platform state.

### Creating one

:::note Verify against your live console
The exact menu path and field labels for creating an application credential may vary slightly between console releases. The flow described here follows the standard pattern; if what you see differs, follow the live UI and email **`info@thewahda.com`** if you spot a divergence.
:::



From the top-right avatar → **Application Credentials** → **Create**. Fill in:

| Field | What to enter |
|---|---|
| **Name** | Something you'll recognize — `ci-deploy`, `nightly-backup`, `metrics-scraper`. |
| **Description** | Optional — where the credential runs and who owns it. |
| **Secret** | Leave blank and the platform generates a strong secret. Only set it yourself if you have a specific value to reuse. |
| **Expires at** | Optional. Set it if the credential should self-destruct after a known date. Blank = no expiry. |
| **Roles** | Which of your current roles the credential inherits. Leave the defaults unless you deliberately want a narrower credential than your own. |
| **Unrestricted** | Leave off unless you know you need it. Off = the credential can't create more app credentials or trusts. |

Click **Create**.

The console shows you the **access key (ID) and secret exactly once**. Save both to your secret manager immediately — the platform will not show the secret again, and there's no reset. Close the dialog without saving? Delete the credential and create a new one.

### Using an application credential

The access ID and secret slot into wherever the tool expects credentials. For `aws-cli` against the S3 endpoint:

```bash
aws configure --profile wahda-ci
# AWS Access Key ID:     <the access ID>
# AWS Secret Access Key: <the secret>
# Default region name:   in-north-1
```

Then:

```bash
aws --profile wahda-ci --endpoint-url https://api.thewahda.com:6780/swift/v1 s3 ls
```

For a first-party Terraform provider or a scripting CLI, the credentials go into the equivalent environment variables. Those tools are on the roadmap; today, the console is the supported management surface. See [Platform overview → How you access it](/getting-started/overview#how-you-access-it).

### Rotating a credential

Zero-downtime rotation, in this order:

1. **Create a new** app credential with the same roles.
2. Deploy the new credential to the workload (secret manager, CI variable, whatever consumes it).
3. Verify the workload is authenticating with the new credential — check logs.
4. **Delete the old** credential.

Doing the delete first breaks the workload; doing the create-and-deploy-first path keeps it running through the swap.

### Revoking a credential

Compromised secret, teammate leaving, or scheduled cleanup:

- **Avatar → Application Credentials → Delete** on the row. Every request using that credential fails from that moment.
- If the credential's expiry has already passed, it's already dead — nothing more to do.

---

## Common team layouts

Small team (2-5 engineers):

- One project (`prod`), maybe a second (`dev`) once things get busy.
- Everyone on the team: `member` in both projects.
- One tech lead: `manager` in both, so they can add and remove teammates without waiting on ops.
- Founder / delivery lead: `admin` in `prod` for policy control.

Larger team (10+ engineers, real production traffic):

- Split into `dev`, `staging`, `prod`.
- Engineers: `member` in `dev` and `staging`, `reader` in `prod`.
- On-call rotation: `member` in `prod`.
- SRE / platform team: `manager` or `admin` in `prod`.
- Finance / audit: `reader` in every project.
- CI system: **application credentials** in each project with only the roles it needs — usually a narrow `member`.

The two knobs that keep this healthy: **least role that still gets the work done** and **every machine identity is an app credential, never a human password**.

---

## Where to see all this

- **Your own roles right now** — Home dashboard → **Hello, `<username>`** panel on the right.
- **Application credentials you own** — top-right avatar → **Application Credentials**.
- **Users in your project** — visible to `manager` and above.

For anything you can't self-serve today (changing roles, adding users, creating projects), email **`info@thewahda.com`**. Turnaround is usually the same business day.

---

## Next steps

- [Sign up & first login →](/getting-started/sign-up) — if you don't have an account yet.
- [Projects →](/getting-started/projects-and-quotas) — how projects group resources.
- [Object storage credentials →](/storage/overview#configure-aws-cli) — the most common use of an application credential.
- [Key pairs →](/compute/keypairs) — SSH access to your VMs, separate from console access.
