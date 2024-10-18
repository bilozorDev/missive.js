/** @type {import('tailwindcss').Config} */
import starlightPlugin from '@astrojs/starlight-tailwind';

import starlightPlugin from '@astrojs/starlight-tailwind';

// Generated color palettes
const accent = { 200: '#cebef9', 600: '#812de7', 900: '#3b1c69', 950: '#291847' };
const gray = {
    100: '#f6f6f6',
    200: '#eeeeed',
    300: '#c2c2c1',
    400: '#8b8c8a',
    500: '#585856',
    700: '#383837',
    800: '#272725',
    900: '#181817',
};

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: { accent, gray },
        },
    },
    plugins: [starlightPlugin()],
};
