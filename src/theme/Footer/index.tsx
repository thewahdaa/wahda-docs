import React from 'react';
import Link from '@docusaurus/Link';

const SERVICES = [
  { slug: 'compute', label: 'Cloud Compute' },
  { slug: 'storage', label: 'Cloud Storage' },
  { slug: 'network', label: 'Network' },
  { slug: 'database', label: 'Database' },
  { slug: 'containers', label: 'Containers' },
  { slug: 'security', label: 'Security' },
];

export default function Footer(): React.ReactElement {
  const year = new Date().getFullYear();
  return (
    <footer className="wd-footer">
      <div className="wd-footer-container">
        <div className="wd-footer-grid">
          {/* Brand */}
          <div className="wd-footer-col wd-footer-brand-col">
            <Link href="https://thewahda.com" className="wd-footer-logo-link">
              <img src="/img/brand/logo.svg" alt="The Wahda Cloud" className="wd-footer-logo" />
            </Link>
            <p className="wd-footer-tagline">
              Pay-as-you-go cloud infrastructure with GST-compliant billing in INR. IaaS, Managed Kubernetes, DBaaS.
            </p>
          </div>

          {/* Services */}
          <div className="wd-footer-col">
            <h3 className="wd-footer-title">Services</h3>
            <ul className="wd-footer-list">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <a href={`https://thewahda.com/en/services/${s.slug}`} className="wd-footer-link">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="wd-footer-col">
            <h3 className="wd-footer-title">Company</h3>
            <ul className="wd-footer-list">
              <li><a href="https://thewahda.com/en/about" className="wd-footer-link">About</a></li>
              <li><a href="https://thewahda.com/en/blog" className="wd-footer-link">Blog</a></li>
              <li><a href="https://thewahda.com/en/pricing" className="wd-footer-link">Pricing</a></li>
              <li><a href="https://thewahda.com/en/contact" className="wd-footer-link">Contact</a></li>
              <li><span className="wd-footer-muted">SLA: 99.99% Uptime</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="wd-footer-col">
            <h3 className="wd-footer-title">Contact</h3>
            <ul className="wd-footer-list wd-footer-muted">
              <li>297 Sector 30, Faridabad, Haryana 121003</li>
              <li><a href="mailto:info@thewahda.com" className="wd-footer-link">info@thewahda.com</a></li>
              <li><a href="tel:+918826622366" className="wd-footer-link">+91 88266 22366</a></li>
            </ul>
          </div>
        </div>

        <div className="wd-footer-bottom">
          <p className="wd-footer-copy">© {year} The Wahda Cloud. All rights reserved.</p>
          <div className="wd-footer-bottom-links">
            <a href="https://thewahda.com/en/privacy-policy" className="wd-footer-link">Privacy Policy</a>
            <a href="https://thewahda.com/en/terms" className="wd-footer-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
