import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'The Wahda Cloud',
  tagline: 'Documentation for builders on India\'s pay-as-you-go cloud.',
  favicon: 'img/brand/favicon.svg',

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
