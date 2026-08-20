import { Activity, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const selfHostedIconBase = 'https://cdn.jsdelivr.net/gh/selfhst/icons/svg';

// Brand assets are provided by selfh.st/icons under CC BY 4.0.

export type QuickLinkIcon =
    | {
          kind: 'brand';
          src: string;
      }
    | {
          kind: 'symbol';
          icon: LucideIcon;
      };

export type QuickLink = {
    name: string;
    description: string;
    destination: string;
    href: string;
    icon: QuickLinkIcon;
    access?: 'Restricted';
    keywords?: readonly string[];
};

export type QuickLinkGroup = {
    id: string;
    title: string;
    description: string;
    links: readonly QuickLink[];
};

function brandIcon(reference: string): QuickLinkIcon {
    return {
        kind: 'brand',
        src: `${selfHostedIconBase}/${reference}.svg`,
    };
}

export const quickLinkGroups: readonly QuickLinkGroup[] = [
    {
        id: 'social',
        title: 'Socials',
        description: 'Profiles, music, and ways to get in touch.',
        links: [
            {
                name: 'GitHub',
                description: 'Code, projects, and open-source work.',
                destination: 'github.com/thaddeuskkr',
                href: 'https://github.com/thaddeuskkr',
                icon: brandIcon('github'),
                keywords: ['code', 'projects', 'source'],
            },
            {
                name: 'LinkedIn',
                description: 'Experience and professional updates.',
                destination: 'linkedin.com/in/thaddeuskkr',
                href: 'https://www.linkedin.com/in/thaddeuskkr/',
                icon: brandIcon('linkedin'),
                keywords: ['work', 'experience', 'career'],
            },
            {
                name: 'Last.fm',
                description: 'A running record of what I listen to.',
                destination: 'last.fm/user/thaddeuskkr',
                href: 'https://www.last.fm/user/thaddeuskkr',
                icon: brandIcon('last-fm'),
                keywords: ['music', 'listening'],
            },
            {
                name: 'Telegram',
                description: 'The best way to reach me for quick questions or discussions.',
                destination: 't.me/thaddeuskkr',
                href: 'https://t.me/thaddeuskkr',
                icon: brandIcon('telegram'),
                keywords: ['contact', 'messaging', 'chat'],
            },
            {
                name: 'Email',
                description: 'The most direct way to reach me.',
                destination: 'tk@tkkr.dev',
                href: 'mailto:tk@tkkr.dev',
                icon: { kind: 'symbol', icon: Mail },
                keywords: ['contact', 'mail'],
            },
        ],
    },
    {
        id: 'services',
        title: 'Services',
        description: 'Quick access to the systems I host.',
        links: [
            {
                name: 'Status Page',
                description: 'Uptime and incident updates for tkkr.dev.',
                destination: 'status.tkkr.dev',
                href: 'https://status.tkkr.dev',
                icon: { kind: 'symbol', icon: Activity },
                keywords: ['uptime', 'availability', 'better stack'],
            },
            {
                name: 'tkID',
                description: 'Identity provider (IdP) to sign in to tkkr.dev services.',
                destination: 'id.tkkr.dev',
                href: 'https://id.tkkr.dev',
                icon: brandIcon('pocket-id'),
                keywords: ['oidc', 'identity', 'login', 'passkey'],
            },
            {
                name: 'Lanyard',
                description: 'Live Discord presence data used by this website.',
                destination: 'l.tkkr.dev',
                href: 'https://l.tkkr.dev',
                icon: brandIcon('discord'),
                keywords: ['discord', 'presence', 'api'],
            },
            {
                name: 'Copyparty',
                description: 'Private file browser and sharing service.',
                destination: 'f.tkkr.dev',
                href: 'https://f.tkkr.dev',
                icon: brandIcon('copyparty'),
                access: 'Restricted',
                keywords: ['files', 'sharing', 'storage'],
            },
            {
                name: 'Warpgate',
                description: 'A secure gateway for accessing internal services.',
                destination: 'tkkr.cc',
                href: 'https://tkkr.cc',
                icon: brandIcon('warpgate'),
                access: 'Restricted',
                keywords: ['gateway', 'ssh', 'mysql', 'vnc', 'rdp', 'web'],
            },
            {
                name: 'Headscale',
                description: 'Private Tailscale network for direct access to tkkr.dev services.',
                destination: 'tkkr.net',
                href: 'https://tkkr.net',
                icon: brandIcon('tailscale'),
                access: 'Restricted',
                keywords: ['network', 'vpn', 'tailscale', 'headscale'],
            },
            {
                name: 'Komodo',
                description: 'Container deployment and infrastructure management.',
                destination: 'k.tkkr.dev',
                href: 'https://k.tkkr.dev',
                icon: brandIcon('komodo'),
                access: 'Restricted',
                keywords: ['containers', 'docker', 'servers'],
            },
        ],
    },
] as const;
