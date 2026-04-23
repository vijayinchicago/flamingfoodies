# Buffer + Pinterest Session Notes

Date: April 22, 2026

This note captures the Buffer and Pinterest setup conversation so we can resume quickly without re-discovering the same details.

## What changed in the repo

The social distribution code was updated to support Buffer's current GraphQL API model instead of relying only on the older REST token flow.

Relevant files:

- [lib/services/social.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/social.ts:1)
- [lib/env.ts](/Users/vijaysingh/apps/flamingfoodies/lib/env.ts:1)
- [scripts/inspect-buffer-pinterest.mjs](/Users/vijaysingh/apps/flamingfoodies/scripts/inspect-buffer-pinterest.mjs:1)
- [docs/pinterest-buffer-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/pinterest-buffer-setup.md:1)

The new preferred env vars are:

- `BUFFER_API_KEY`
- `BUFFER_CHANNEL_IDS`
- `BUFFER_PINTEREST_BOARD_ID`
- `BUFFER_ORGANIZATION_ID` optionally

Legacy fallback env vars are still accepted:

- `BUFFER_ACCESS_TOKEN`
- `BUFFER_PROFILE_IDS`

Important behavior change:

- the app now only queues social posts for platforms that are actually configured
- for GraphQL-based live sends, Pinterest requires both a connected Buffer channel and a board service id

## What we learned about Vercel env vars

We observed that sensitive env vars in Vercel can appear blank in the dashboard edit form and also pull down as blank-looking values in the local env snapshot.

What was confirmed during this session:

- `vercel env pull .vercel/live.env.production --yes --environment=production` wrote `BUFFER_API_KEY=""` into the local pulled file
- that did not mean the secret was missing in production
- `vercel env ls production` showed `BUFFER_API_KEY` exists and is encrypted in Production
- `vercel env run --environment=production -- node -e "const v=process.env.BUFFER_API_KEY||''; console.log(JSON.stringify({present:Boolean(v),length:v.length}))"` returned `{"present":true,"length":43}`

Takeaway:

- do not treat the blank value in `.vercel/live.env.production` as proof the secret is missing
- use `vercel env run` to test whether a sensitive env var is actually available at runtime
- the CLI is the safer path for secret rotation than reopening and resaving the dashboard form

## Buffer inspection result

We successfully called the live Buffer API with the production secret using:

```bash
vercel env run --environment=production -- node scripts/inspect-buffer-pinterest.mjs
```

The result was:

- `ok: true`
- `organizationId: "69e843d1143c5ca1b08ae792"`
- `channels: []`
- `pinterestChannels: []`
- `pinterestChannelId: null`
- `pinterestBoards: []`

Meaning:

- the Buffer API key is valid
- Buffer found exactly one organization
- there are currently no publishing channels connected in that Buffer organization
- because there is no connected Pinterest channel yet, we cannot populate `BUFFER_CHANNEL_IDS` or `BUFFER_PINTEREST_BOARD_ID`

## Why Pinterest is still blocked

The blocker is not the API key anymore.

The blocker is that Buffer does not currently expose any Pinterest publishing channel in the organization tied to the API key.

Until a Pinterest account is connected inside Buffer Publish, the automation cannot determine:

- the Pinterest `channelId` for `BUFFER_CHANNEL_IDS`
- the Pinterest board `serviceId` for `BUFFER_PINTEREST_BOARD_ID`

## Next steps when we resume

1. Open Buffer Publish for organization `69e843d1143c5ca1b08ae792`.
2. Connect the Pinterest account as a publishing channel in that org.
3. Re-run:

```bash
vercel env run --environment=production -- node scripts/inspect-buffer-pinterest.mjs
```

4. Copy the discovered values into Vercel:

- `BUFFER_CHANNEL_IDS=pinterest:<channel-id>`
- `BUFFER_PINTEREST_BOARD_ID=<board-service-id>`

5. Redeploy production.
6. Confirm `/admin/automation/agents` shows the Pinterest distributor as configured.
7. Run one manual `pinterest-distributor` pass.

## Helpful references

- [docs/pinterest-buffer-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/pinterest-buffer-setup.md:1)
- [docs/autonomous-system-governance-plan.md](/Users/vijaysingh/apps/flamingfoodies/docs/autonomous-system-governance-plan.md:1)

Official docs referenced during the session:

- Buffer getting started: https://developers.buffer.com/guides/getting-started.html
- Buffer get channels example: https://developers.buffer.com/examples/get-channels.html
- Buffer Pinterest metadata input: https://developers.buffer.com/types/PinterestPostMetadataInput.html
- Vercel sensitive env vars: https://vercel.com/docs/environment-variables/sensitive-environment-variables
- Vercel CLI env docs: https://vercel.com/docs/cli/env
