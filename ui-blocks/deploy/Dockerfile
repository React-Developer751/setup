# One container: the built page, the API server, the image engine (normal/) and the content AI (cont/). Build from the folder that holds ui-blocks, cont and normal:
#   docker build -f ui-blocks/deploy/Dockerfile -t site-studio .
# (not run in this repository's checks: Docker was not installed there; read DEPLOY.md before using it)
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 tar ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY ui-blocks/package.json ui-blocks/package-lock.json ui-blocks/
RUN cd ui-blocks && npm ci
COPY ui-blocks ui-blocks
COPY cont cont
COPY normal normal
RUN cd ui-blocks && npm run build
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    TRUST_PROXY=1 \
    EDIT_DATA_DIR=/data \
    EDIT_BACKUP_DIR=/data/backups \
    EDIT_BACKUP_HOURS=24 \
    PYTHONDONTWRITEBYTECODE=1
VOLUME /data
EXPOSE 8787
WORKDIR /app/ui-blocks
USER node
# images + content AI + server (the built page is served by the server itself)
CMD ["node", "scripts/start-all.mjs", "--prod"]
