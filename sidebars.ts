import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting started',
      collapsed: false,
      items: [
        'getting-started/overview',
        'getting-started/sign-up',
        'getting-started/projects-and-quotas',
      ],
    },
    {
      type: 'category',
      label: 'Compute',
      collapsed: false,
      items: [
        'compute/create-vm',
        'compute/images',
        'compute/flavors',
        'compute/keypairs',
        'compute/connect-ssh',
      ],
    },
    {
      type: 'category',
      label: 'Networking',
      collapsed: true,
      items: [
        'networking/overview',
        'networking/security-groups',
        'networking/floating-ips',
        'networking/load-balancer',
        'networking/vpn',
      ],
    },
    {
      type: 'category',
      label: 'Databases (DBaaS)',
      collapsed: true,
      items: [
        'databases/overview',
        'databases/create-instance',
        'databases/replicas',
        'databases/backups',
        'databases/config-groups',
      ],
    },
    {
      type: 'category',
      label: 'Storage',
      collapsed: true,
      items: [
        'storage/overview',
      ],
    },
    {
      type: 'category',
      label: 'Identity & access',
      collapsed: true,
      items: [
        'identity/users-and-projects',
      ],
    },
  ],
};

export default sidebars;
