import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'The Wahda Cloud',
  tagline: 'Documentation for builders on India\'s pay-as-you-go cloud.',
  favicon: 'img/brand/favicon.ico',

  future: { v4: true },

  url: 'https://docs.thewahda.com',
  trailingSlash: false,
  baseUrl: '/',

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
          href: 'https://api.thewahda.com',
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
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting started', to: '/getting-started/overview' },
            { label: 'Compute', to: '/compute/create-vm' },
            { label: 'Databases', to: '/databases/overview' },
          ],
        },
        {
          title: 'Product',
          items: [
            { label: 'Console', href: 'https://api.thewahda.com' },
            { label: 'Pricing', href: 'https://thewahda.com/en/pricing' },
            { label: 'Status', href: 'https://thewahda.com/en/status' },
          ],
        },
        {
          title: 'Company',
          items: [
            { label: 'About', href: 'https://thewahda.com/en/about' },
            { label: 'Contact', href: 'https://thewahda.com/en/contact' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} The Wahda Cloud. Hyderabad, India.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'sql', 'ini'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
