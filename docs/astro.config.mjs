import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwind from '@astrojs/tailwind';

import react from '@astrojs/react';

const github = 'https://github.com/plopix/missive.js';
const githubURL = new URL(github);
const githubPathParts = githubURL.pathname.split('/');
const title = 'Missive.js';
export default defineConfig({
    site: `https://${githubPathParts[1]}.github.io/${githubPathParts[2]}`,
    base: `${githubPathParts[2]}`,
    integrations: [
        starlight({
            title,
            logo: {
                src: './src/assets/bus.svg',
                alt: title,
            },
            social: {
                github,
            },
            customCss: ['./src/tailwind.css'],
            sidebar: [
                {
                    label: 'Guides',
                    autogenerate: { directory: 'guides' },
                },
                // {
                //     label: 'Reference',
                //     autogenerate: { directory: 'reference' },
                // },
            ],
        }),
        tailwind({
            applyBaseStyles: false,
            nesting: true,
        }),
        react(),
    ],
});
