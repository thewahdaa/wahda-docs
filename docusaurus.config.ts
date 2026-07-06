import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'The Wahda Cloud',
  tagline: 'Documentation for builders. Pay-as-you-go cloud, GST-compliant billing in INR.',
  favicon: 'img/brand/favicon.svg',

  future: { v4: true },

  url: 'https://docs.thewahda.com',
  trailingSlash: false,
  baseUrl: '/',

  // ---- Regional SEO signals (invisible in the rendered UI) ----------------
  // These live in <head> and never show up in the body. They tell search
  // engines and structured-data consumers where the service operates,
  // so Indian searchers looking for a cloud provider surface these
  // pages — without the word "India" appearing in the visible content.
  headTags: [
    // Geographic meta (legacy but still parsed by search crawlers)
    // Country-level geo signals so ANY Indian search — Delhi, Mumbai,
    // Bengaluru, Chennai, Kolkata, Pune, Ahmedabad, Hyderabad — is a match.
    {tagName: 'meta', attributes: {name: 'geo.region',    content: 'IN'}},
    {tagName: 'meta', attributes: {name: 'geo.placename', content: 'India'}},
    {tagName: 'meta', attributes: {name: 'geo.position',  content: '20.5937;78.9629'}},
    {tagName: 'meta', attributes: {name: 'ICBM',          content: '20.5937, 78.9629'}},
    // Language + region hreflang. en-IN tells Google this English content is
    // primarily for readers in India.
    {tagName: 'link', attributes: {rel: 'alternate', hrefLang: 'en-IN', href: 'https://docs.thewahda.com/'}},
    {tagName: 'link', attributes: {rel: 'alternate', hrefLang: 'x-default', href: 'https://docs.thewahda.com/'}},
    // Machine-readable Organization schema. Rich Results & knowledge-panel
    // consumers read the country / city / coordinates. A stable @id lets
    // the WebSite and Service schemas below reference this Organization
    // instead of duplicating publisher/provider data.
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://thewahda.com/#organization',
        name: 'The Wahda Cloud',
        url: 'https://thewahda.com',
        logo: 'https://docs.thewahda.com/img/brand/logo.svg',
        sameAs: [
          'https://docs.thewahda.com',
          'https://console.thewahda.com',
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Hyderabad',
          addressRegion: 'Telangana',
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 17.3850,
          longitude: 78.4867,
        },
        areaServed: {
          '@type': 'Country',
          name: 'IN',
        },
        contactPoint: [{
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'info@thewahda.com',
          availableLanguage: ['en', 'hi'],
          areaServed: 'IN',
        }],
      }),
    },
    // WebSite schema — enables the sitelinks searchbox in Google results and
    // establishes the docs site as a first-class entity with a publisher link
    // back to the Organization above.
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://docs.thewahda.com/#website',
        url: 'https://docs.thewahda.com',
        name: 'The Wahda Cloud Docs',
        description: 'Documentation for The Wahda Cloud — pay-as-you-go cloud with GST-compliant billing in INR.',
        inLanguage: 'en-IN',
        publisher: {'@id': 'https://thewahda.com/#organization'},
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://docs.thewahda.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }),
    },
    // Service schemas — one per major offering. Each declares the country of
    // service and links back to the Organization as provider, so AI answer
    // engines (Perplexity, ChatGPT, AI Overviews) can associate the service
    // with the brand and the market.
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': 'https://thewahda.com/#service-compute',
        serviceType: 'Cloud computing',
        name: 'Cloud VMs',
        description: 'On-demand Linux virtual machines with per-second billing, multiple flavor sizes, and SSH key pair access. Boot from Ubuntu, AlmaLinux, Rocky, CentOS Stream, Debian, or a custom image.',
        areaServed: {'@type': 'Country', name: 'IN'},
        provider: {'@id': 'https://thewahda.com/#organization'},
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'VM flavors',
          itemListElement: [
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'm1.small — 1 vCPU, 2 GB RAM, 20 GB disk'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'm1.medium — 2 vCPU, 4 GB RAM, 40 GB disk'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'm1.large — larger workloads'}},
          ],
        },
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': 'https://thewahda.com/#service-block-storage',
        serviceType: 'Cloud storage',
        name: 'Block storage volumes',
        description: 'Persistent block storage volumes you can attach to any cloud VM. Resize on the fly, snapshot for backup, and detach without losing data.',
        areaServed: {'@type': 'Country', name: 'IN'},
        provider: {'@id': 'https://thewahda.com/#organization'},
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': 'https://thewahda.com/#service-object-storage',
        serviceType: 'Object storage',
        name: 'S3-compatible object storage',
        description: 'S3-compatible object storage for backups, static assets, media libraries, and data lakes. Access it with the AWS SDK, aws-cli, or any S3-compatible tool.',
        areaServed: {'@type': 'Country', name: 'IN'},
        provider: {'@id': 'https://thewahda.com/#organization'},
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': 'https://thewahda.com/#service-load-balancer',
        serviceType: 'Managed load balancer',
        name: 'Managed load balancer',
        description: 'Managed L4 and L7 load balancer with health checks, TLS termination, and session persistence. Distribute traffic across backend VMs for high availability and zero-downtime deployments.',
        areaServed: {'@type': 'Country', name: 'IN'},
        provider: {'@id': 'https://thewahda.com/#organization'},
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Load balancer capabilities',
          itemListElement: [
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'L4 TCP load balancing'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'L7 HTTP/HTTPS load balancing with TLS termination'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'Health checks and automatic failover'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'Session persistence (cookie and source IP)'}},
          ],
        },
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': 'https://thewahda.com/#service-vpn',
        serviceType: 'Site-to-site VPN',
        name: 'Managed IPsec VPN',
        description: 'Site-to-site IPsec VPN tunnels between your cloud project and a remote network — office edge, another cloud, or another region. IKEv1 and IKEv2, modern crypto, PFS support.',
        areaServed: {'@type': 'Country', name: 'IN'},
        provider: {'@id': 'https://thewahda.com/#organization'},
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': 'https://thewahda.com/#service-dbaas',
        serviceType: 'Managed database',
        name: 'Managed databases (DBaaS)',
        description: 'Managed MySQL and MariaDB with automated backups, point-in-time restore, read replicas, and configuration groups. Focus on schema — not on patching, backup jobs, or replica plumbing.',
        areaServed: {'@type': 'Country', name: 'IN'},
        provider: {'@id': 'https://thewahda.com/#organization'},
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Database engines and features',
          itemListElement: [
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'Managed MySQL'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'Managed MariaDB'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'Automated backups and point-in-time restore'}},
            {'@type': 'Offer', itemOffered: {'@type': 'Service', name: 'Read replicas for scale-out reads'}},
          ],
        },
      }),
    },
  ],
  // -----------------------------------------------------------------------


  organizationName: 'thewahdaa',
  projectName: 'docs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/brand/social-card.png',
    metadata: [
      {name: 'og:type', content: 'website'},
      {name: 'og:site_name', content: 'The Wahda Cloud Docs'},
      {name: 'og:locale', content: 'en_IN'},
      {name: 'twitter:card', content: 'summary_large_image'},
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'The Wahda Cloud',
      logo: {
        alt: 'The Wahda Cloud',
        src: 'img/brand/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://console.thewahda.com',
          label: 'Console',
          position: 'right',
        },
        {
          href: 'https://thewahda.com',
          label: 'thewahda.com',
          position: 'right',
        },
      ],
    },
    footer: undefined as any,
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'sql', 'ini'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
