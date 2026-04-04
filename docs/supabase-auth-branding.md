# Supabase Auth Branding

This document is internal-only. It captures the dashboard-side auth configuration we still need so
FlamingFoodies login feels branded instead of generic.

## OAuth Providers

Only expose an OAuth button on the site after that provider is enabled in Supabase and the matching
`NEXT_PUBLIC_ENABLE_*_AUTH` flag is set to `true`.

Current website flags:

- `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`
- `NEXT_PUBLIC_ENABLE_GITHUB_AUTH`

Supabase docs:

- Google provider setup: `https://supabase.com/docs/guides/auth/social-login/auth-google`
- Email templates: `https://supabase.com/docs/guides/auth/auth-email-templates`

## Google Sign-In Checklist

1. In Supabase Dashboard go to `Authentication -> Providers -> Google`.
2. Enable the Google provider.
3. In Google Cloud create or update the OAuth client.
4. Add the Supabase callback URL shown in the provider screen to Google’s authorized redirect URIs.
5. Paste the Google client ID and secret into Supabase.
6. After that works, set `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` in Vercel.

## GitHub Sign-In Checklist

1. In Supabase Dashboard go to `Authentication -> Providers -> GitHub`.
2. Enable the GitHub provider.
3. Register the Supabase callback URL in the GitHub OAuth app.
4. Paste the GitHub client ID and secret into Supabase.
5. After that works, set `NEXT_PUBLIC_ENABLE_GITHUB_AUTH=true` in Vercel.

## Email Branding

Without custom SMTP and custom templates, Supabase sends the default generic auth email. That is why
the current message comes from `noreply@mail.app.supabase.io`.

To brand it properly:

1. Set up custom SMTP in Supabase Dashboard.
2. Update the `magic_link` and `confirmation` email templates in `Authentication -> Email Templates`.
3. Keep the project Site URL pointed at `https://flamingfoodies.com`.

## Suggested Magic Link Subject

`Your FlamingFoodies sign-in link`

## Suggested Magic Link HTML

```html
<h2 style="font-family: Georgia, serif; color: #111111;">Your FlamingFoodies sign-in link</h2>
<p style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
  Tap the button below to sign in and get back to recipes, reviews, and your saved heat picks.
</p>
<p style="margin: 24px 0;">
  <a
    href="{{ .ConfirmationURL }}"
    style="background: #d9481b; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 999px; font-family: Arial, sans-serif; font-weight: 700;"
  >
    Sign in to FlamingFoodies
  </a>
</p>
<p style="font-family: Arial, sans-serif; color: #555555; line-height: 1.6;">
  If the button does not work, paste this link into your browser:
</p>
<p style="font-family: Arial, sans-serif; color: #555555; word-break: break-all;">
  {{ .ConfirmationURL }}
</p>
<p style="font-family: Arial, sans-serif; color: #777777; line-height: 1.6;">
  You requested this email for {{ .Email }}. If that was not you, you can safely ignore it.
</p>
```

## Suggested Signup Confirmation Subject

`Confirm your FlamingFoodies account`

## Suggested Confirmation HTML

```html
<h2 style="font-family: Georgia, serif; color: #111111;">Confirm your FlamingFoodies account</h2>
<p style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
  Confirm your email to finish setting up your account and start saving recipes, posting comments,
  and tracking your favorite sauces.
</p>
<p style="margin: 24px 0;">
  <a
    href="{{ .ConfirmationURL }}"
    style="background: #d9481b; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 999px; font-family: Arial, sans-serif; font-weight: 700;"
  >
    Confirm your email
  </a>
</p>
<p style="font-family: Arial, sans-serif; color: #555555; line-height: 1.6;">
  If the button does not work, paste this link into your browser:
</p>
<p style="font-family: Arial, sans-serif; color: #555555; word-break: break-all;">
  {{ .ConfirmationURL }}
</p>
```
