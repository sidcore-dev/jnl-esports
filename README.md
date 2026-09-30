# JNL Esports website

Static site for JNL Esports. Pages are generated from `src/` with `node build.mjs`; the generated HTML is committed so hosting needs no build step.

## Editing content

Roster, matches, news, staff and links live in `js/data.js`. After editing page templates in `src/`, run `node build.mjs`.

## Hosting

- **cPanel (Git Version Control):** `.cpanel.yml` copies the public files into `public_html` on deploy. This serves the static pages only.
- **Vercel:** also runs the `api/` functions (tryout applications to Discord, members sign-in). Those need Node and do not run on cPanel. Required env vars: `DISCORD_WEBHOOK_URL`, and for the members area `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_GUILD_ID`, `DISCORD_MEMBER_ROLE_ID`, `SESSION_SECRET`.

## License

MIT

