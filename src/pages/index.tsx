import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import React from 'react';

const sections = [
  {
    title: 'Getting started',
    items: [
      { label: 'Platform overview', desc: 'Regions, projects, services, billing.', to: '/getting-started/overview' },
      { label: 'Sign up & first project', desc: 'Create an account and a project.', to: '/getting-started/sign-up' },
      { label: 'Projects & quotas', desc: 'How quotas work, how to ask for more.', to: '/getting-started/projects-and-quotas' },
    ],
  },
  {
    title: 'Compute',
    items: [
      { label: 'Create a virtual machine', desc: 'Launch a Linux VM in 5 minutes.', to: '/compute/create-vm' },
      { label: 'Choose an image', desc: 'Public images and bring-your-own.', to: '/compute/images' },
      { label: 'Connect over SSH', desc: 'Bastion, floating IP, ssh-config.', to: '/compute/connect-ssh' },
    ],
  },
  {
    title: 'Networking',
    items: [
      { label: 'Network overview', desc: 'Tenant networks and routing.', to: '/networking/overview' },
      { label: 'Security groups', desc: 'The firewall in front of every VM.', to: '/networking/security-groups' },
      { label: 'Floating IPs', desc: 'Reserve a public IPv4 for an instance.', to: '/networking/floating-ips' },
    ],
  },
  {
    title: 'Managed databases',
    items: [
      { label: 'DBaaS overview', desc: 'Managed Postgres, MySQL, MariaDB.', to: '/databases/overview' },
      { label: 'Create a database', desc: 'Provision a managed engine.', to: '/databases/create-instance' },
      { label: 'Replicas', desc: 'Read replicas, promotion, failover.', to: '/databases/replicas' },
      { label: 'Backups & restore', desc: 'Automated and manual backups.', to: '/databases/backups' },
    ],
  },
];

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="Documentation"
      description="Build, ship and scale on a pay-as-you-go cloud with GST-compliant billing in INR. Step-by-step guides for compute, networking, storage and managed databases."
    >
      <main>
        <section className="wd-hero">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h1>
              Build on <span className="accent">The Wahda Cloud</span>
            </h1>
            <p className="subtitle">
              Step-by-step guides, references, and operational playbooks for builders on
              our pay-as-you-go cloud. Get from sign-up to production faster.
            </p>
            <div className="cta-row">
              <Link className="button button--primary button--lg" to="/getting-started/overview">
                Get started
              </Link>
              <Link className="button button--secondary button--lg" to="/compute/create-vm">
                Launch your first VM →
              </Link>
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 6rem' }}>
          {sections.map((s) => (
            <section key={s.title}>
              <div className="wd-section-title">{s.title}</div>
              <div className="wd-grid">
                {s.items.map((i) => (
                  <Link key={i.to} className="wd-card" to={i.to}>
                    <h3>{i.label} <span className="arrow">→</span></h3>
                    <p>{i.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
