// Single source of truth for the site. To add a game, add an entry to `games`
// and a matching roster under `teams`. Replace placeholder values below.

window.JL = {
  // Feature flags. Set members to true once Discord sign-in is configured.
  features: { members: false },

  org: {
    name: "JNL Esports",
    tagline: "Built to breach. Trained to win.",
    socials: [
      { label: "X", href: "" },
      { label: "YouTube", href: "" },
      { label: "Discord", href: "https://discord.gg/yujC9GwjHk" },
    ],
  },

  // status "active" shows a live roster tab; "planned" shows a disabled tab.
  games: [
    { id: "siege", name: "Rainbow Six Siege", short: "Rainbow Six Siege", status: "active" },
    { id: "next", name: "Additional titles", short: "Additional titles", status: "planned" },
  ],

  teams: {
    siege: {
      name: "JNL Rainbow Six Siege",
      region: "North America",
      players: [
        { handle: "themoon420", role: "In-game leader", designation: "Owner, Captain" },
        { handle: "Soon", role: "Entry", designation: "" },
        { handle: "Soon", role: "Support", designation: "" },
        { handle: "Soon", role: "Anchor", designation: "" },
        { handle: "Soon", role: "Flex", designation: "" },
      ],
      staff: [],
    },
  },

  // Public news. Newest first. date is YYYY-MM-DD.
  announcements: [
    { date: "2026-09-29", title: "Tryouts are open", body: "We are recruiting for the Rainbow Six Siege roster. Submit an application below." },
  ],

  // Leadership and contacts shown publicly.
  staff: [
    { name: "themoon420", role: "Owner, Captain and In-game leader", contact: "Contact via Discord" },
  ],

  // Public links. Leave href empty until the link exists.
  resources: [
    { title: "Discord server", description: "Community, tryouts and announcements.", href: "https://discord.gg/yujC9GwjHk" },
    { title: "YouTube", description: "Match VODs and highlights.", href: "" },
  ],

  // Add entries as { date, opponent, event, result } where result is
  // "upcoming", "win" or "loss". An empty list shows a notice instead.
  matches: [],
};
