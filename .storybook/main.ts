import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  "stories": ["../src/**/*.stories.ts"],
  "addons": ["@storybook/addon-a11y", "@storybook/addon-docs"],
  "framework": "@storybook/html-vite"
};
export default config;