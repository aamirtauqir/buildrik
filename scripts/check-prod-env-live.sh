#!/usr/bin/env bash
#
# Check the LIVE production env, not a local file.
#
# The gap that made this necessary: check-prod-env.mjs already required
# GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID, VERCEL_CLIENT_ID and VERCEL_INTEGRATION_ID —
# the exact vars that were missing from production for months. The guard existed;
# nobody ever pointed it at the server. Social login redirected to Google with
# `client_id=undefined` and AI drafting failed every job, both silently, because
# dev had the keys in .env.local and prod had never been given them.
#
# Run this before every deploy:  npm run env:check:prod
#
# The server's env lives in the cPanel Node app config, not in a .env file. This
# pulls it, checks it, and shreds the temp copy — values are never printed.

set -euo pipefail

HOST="${DEPLOY_SSH_HOST:-vortyoyz}"
APP_ROOT="apps/dashboard"

TMP="$(mktemp -t prod-env.XXXXXX)"
chmod 600 "$TMP"
trap 'rm -f "$TMP"' EXIT

echo "Pulling env from ${HOST}:${APP_ROOT} …"
ssh -o ServerAliveInterval=15 "$HOST" "python3 -c \"
import json
cfg = json.load(open('/home/\$USER/.cl.selector/node-selector.json'))
env = cfg['${APP_ROOT}']['env_vars']
for k, v in sorted(env.items()):
    print(f'{k}={v}')
\"" > "$TMP"

COUNT="$(wc -l < "$TMP" | tr -d ' ')"
echo "Got ${COUNT} vars (values not shown)."
echo

node "$(dirname "$0")/check-prod-env.mjs" --file "$TMP"
