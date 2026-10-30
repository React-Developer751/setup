# Putting Site Studio on a server (for real users)

Everything below was written from how the app works and checked as far as it can be without a server (the app itself in production mode, the backup, the limits, the tests). The Docker files were **not
run** here (Docker was not installed): try them on a test machine first.

## What runs
One process group: the built page and the API (`server/index.mjs`), the image engine (`normal/serve.py`) and the content AI bridge (`cont`). Data lives in one folder (`EDIT_DATA_DIR`): designs, prompts,
edit log, projects with versions, published sites.

## Steps (any Linux server, 2 CPU / 4 GB is a fair start)
1. Copy the three folders `ui-blocks`, `cont`, `normal` to the server (they must stay side by side).
2. `docker compose -f ui-blocks/deploy/docker-compose.yml up -d --build` with `EDIT_ADMIN_TOKEN` (a long random text) and `PUBLIC_URL` (https://your.domain) set in the environment, and your domain in `ui-blocks/deploy/Caddyfile`.
   Without Docker: `npm ci && npm run build`, then `HOST=127.0.0.1 TRUST_PROXY=1 EDIT_DATA_DIR=/var/lib/studio EDIT_BACKUP_HOURS=24 node scripts/start-all.mjs --prod` under systemd/pm2, and any HTTPS reverse proxy (Caddy, nginx) in front.
3. Open the address, build a site, press Publish: the link works for everyone who can reach the server (`/s/<id>/`).

## The settings that matter
| variable | meaning | default |
|---|---|---|
| `TRUST_PROXY=1` | take the visitor's address from the proxy (**needed behind Caddy/nginx**, otherwise everyone shares one address) | off |
| `EDIT_ADMIN_TOKEN` | who may read the training export (`x-admin-token` header); without it only the machine itself | none |
| `EDIT_ALLOWED_ORIGINS` | the address people use (comma list) | this machine |
| `EDIT_RATE_PER_MINUTE` / `EDIT_IMAGES_PER_MINUTE` | requests / pictures per person per minute (a person is the browser's anonymous id; one address as a whole gets six times that) | 120 / 90 |
| `EDIT_IMAGE_SLOTS`, `EDIT_IMAGE_QUEUE`, `EDIT_IMAGE_CACHE` | pictures drawn at the same time, people allowed to wait, pictures remembered | 3 / 60 / 300 |
| `PIXELMATH_URLS` | several image engines (`http://a:8000,http://b:8000`), used in turns | one local engine |
| `EDIT_SHARED_LEARNING=0` | other people's designs no longer teach colours | on |
| `EDIT_BACKUP_HOURS` / `EDIT_BACKUP_KEEP` / `EDIT_BACKUP_DIR` | a `.tar.gz` of the data every N hours, the newest N kept | off / 14 / `backups` |
| `EDIT_PUBLISH_MAX_BYTES` | largest published site | 6 MB |

## Capacity (measured on a laptop, one image engine)
* The image engine draws about 20 pictures a minute; one site needs six, so about 3 new sites a minute. People wait in a line (no errors), and a picture asked for before comes from memory at once. For more: run
  more image engines (other machines or ports) and list them in `PIXELMATH_URLS`.
* Everything else (text, pages, edits, export) is cheap: 20 parallel content requests answer in 0.2 s.
* The first load of the page is about 1.5 MB compressed (8 MB of code and learned models, then cached for a year).

## Backups and restore
`node scripts/backup-data.mjs` (or `EDIT_BACKUP_HOURS`). Restore: stop the server, `tar -xzf backups/data-<time>.tar.gz -C <parent of the data folder>`, start it. Also copy the backups off the server.

## Still not there (decide before a big public launch)
No accounts or passwords (a person is a code kept in their browser; they see a recovery code when they first save). Data is plain files (fine for hundreds of people, not for a large public service).
Card payments, logins and a database are not part of the generated sites (they are static).
