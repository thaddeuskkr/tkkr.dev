/** @type {import('tailwindcss').Config} */
import catppuccin from '@catppuccin/tailwindcss';
module.exports = {
    content: ['./src/**/*.{html,js}'],
    theme: {
        extend: {}
    },
    darkMode: 'selector',
    plugins: [
        catppuccin({
            defaultFlavour: 'latte',
            prefix: false
        })
    ]
};
