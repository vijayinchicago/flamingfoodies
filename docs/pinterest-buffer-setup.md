# Pinterest Buffer Setup

This is the production setup path for the `pinterest-distributor` lane.

It assumes we are using Buffer as the send layer and that the site should only queue social posts for destinations that are actually configured.

Session handoff:

- for the exact April 22, 2026 debugging notes, verified commands, Vercel secret behavior, and the current Buffer org status, see [docs/buffer-pinterest-session-2026-04-22.md](/Users/vijaysingh/apps/flamingfoodies/docs/buffer-pinterest-session-2026-04-22.md)

## Required env vars

- `BUFFER_API_KEY`
- `BUFFER_CHANNEL_IDS`
- `BUFFER_PINTEREST_BOARD_ID`

Optional but useful:

- `BUFFER_ORGANIZATION_ID`

Legacy fallback:

- `BUFFER_ACCESS_TOKEN`
- `BUFFER_PROFILE_IDS`

The legacy envs are still supported in code, but new Pinterest automation should use the current Buffer GraphQL API path.

## What goes in each env var

- `BUFFER_API_KEY`
  Create this in Buffer Publish under API settings.
- `BUFFER_CHANNEL_IDS`
  Use the format `pinterest:<channel-id>`.
  Example: `pinterest:67f0abc123def4567890abcd`
- `BUFFER_PINTEREST_BOARD_ID`
  This is the Pinterest board `serviceId` returned by Buffer for the connected Pinterest channel.
- `BUFFER_ORGANIZATION_ID`
  Optional helper for the local inspection script when the Buffer account has more than one organization.

## How to discover the channel id and board id

1. Save `BUFFER_API_KEY` locally in an env file or export it in your shell.
2. Run:

```bash
node scripts/inspect-buffer-pinterest.mjs --env-file .vercel/live.env.production
```

3. Read the JSON output:
   - choose the Pinterest channel from `pinterestChannels`
   - copy its `id` into `BUFFER_CHANNEL_IDS`
   - choose a board from `pinterestBoards`
   - copy its `serviceId` into `BUFFER_PINTEREST_BOARD_ID`

If Buffer reports multiple organizations, rerun with:

```bash
node scripts/inspect-buffer-pinterest.mjs \
  --env-file .vercel/live.env.production \
  --organization-id <buffer-organization-id>
```

## After the envs are saved

1. Redeploy production.
2. Confirm `/admin/automation/agents` shows `Pinterest distributor` as configured.
3. Publish or queue one piece of content and confirm only Pinterest social rows are created when Pinterest is the only configured social destination.
4. Then run the manual `pinterest-distributor` pass.
