import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "웰시고기 일기장",
  tagline: "touhouwiki-kr project",
  favicon: "img/sanae.ico",

  // Set the production url of your site here
  url: "https://touhouwiki-kr.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/touhouwiki-kr/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "wealthygogi", // Usually your GitHub org/user name.
  projectName: "touhouwiki-kr", // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "ko",
    locales: ["ko"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/wealthygogi/touhouwiki-kr/tree/main/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "웰시고기 일기장",
      logo: {
        alt: "웰시고기 일기장",
        src: "img/sanae.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "gameSidebar",
          position: "left",
          label: "게임",
        },
        {
          type: "docSidebar",
          sidebarId: "musicSidebar",
          position: "left",
          label: "음악",
        },
        {
          type: "docSidebar",
          sidebarId: "toySidebar",
          position: "left",
          label: "장난감",
        },
        {
          href: "https://github.com/wealthygogi/touhouwiki-kr",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "동방",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Editor",
          items: [
            {
              label: "X",
              href: "https://x.com/wealthygogi",
            },
          ],
        },
      ],
      copyright: `Copyleft © ${new Date().getFullYear()} @wealthygogi. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
