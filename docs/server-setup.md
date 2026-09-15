# Server Setup

This describes how `bobs-server.net` is provisioned: the directory layout on the box, how the
service is brought up, and how merges to `main` automatically rebuild and restart it.

See also [`dns.md`](./dns.md) and [`firewall.md`](./firewall.md) for the surrounding network config.

## Layout

The box (`root@bobs-server.net`) has a clone of this repo at `/opt/boxes`, alongside a `.env`
file (populated from `.env.sample`) holding the real secrets (`JWT_SECRET`, `BREVO_API_KEY`,
etc.) and paths to the SSL cert/key and the SQLite data directory.

The `.env` file and TLS material are **not** in git — they're created by hand on first setup and
never touched by deploys.

`docker-compose.yml`'s `server` service builds its image straight from
`https://github.com/braxtonhall/bobs-server.git` (not from the local checkout), so a rebuild
always picks up the latest commit on `main`. The local clone at `/opt/boxes` exists to host
`docker-compose.yml` and `.env`, and as a place to run `docker compose` from.

## Initial bring-up

```bash
cd /opt/boxes
docker compose up -d server
```

## Auto-deploy on merge to `main`

Every push to `main` runs `.github/workflows/pull.yml`. After lint/tests pass, its `deploy` job
SSHes into the box as a locked-down `deploy` user and runs:

```bash
cd /opt/boxes
docker compose build server
docker compose up -d server
docker image prune -f
```

### The `deploy` user

`deploy` exists solely to run that one script, as root, via a single SSH key. It cannot log in
with a password, open a shell, or run any other command — the SSH key is bound to a forced
command in `authorized_keys`.

To recreate this on a fresh box (as root):

```bash
# 1. user, no password login
useradd -m -s /bin/bash deploy
passwd -l deploy
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && chown deploy:deploy /home/deploy/.ssh

# 2. the one thing this user is allowed to trigger
cat > /usr/local/sbin/deploy-bobs-server.sh <<'SCRIPT'
#!/bin/bash
set -euo pipefail
cd /opt/boxes
docker compose build server
docker compose up -d server
docker image prune -f
SCRIPT
chmod 755 /usr/local/sbin/deploy-bobs-server.sh
chown root:root /usr/local/sbin/deploy-bobs-server.sh

# 3. sudo rule scoped to exactly that script, nothing else
echo 'deploy ALL=(root) NOPASSWD: /usr/local/sbin/deploy-bobs-server.sh' > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy
visudo -cf /etc/sudoers.d/deploy

# 4. generate a dedicated deploy keypair (run locally, not on the box)
ssh-keygen -t ed25519 -N "" -C "github-actions-deploy@bobs-server" -f deploy_key

# 5. install the public half with a forced command, on the box
cat >> /home/deploy/.ssh/authorized_keys <<EOF
command="/usr/bin/sudo /usr/local/sbin/deploy-bobs-server.sh",no-pty,no-agent-forwarding,no-X11-forwarding,no-port-forwarding,no-user-rc $(cat deploy_key.pub)
EOF
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
```

### Wiring up GitHub Actions

1. Add `deploy_key`'s contents (the private key) as a repo secret named `DEPLOY_SSH_KEY`
   (Settings → Secrets and variables → Actions).
2. The `deploy` job in `pull.yml` pins the box's SSH host key in `known_hosts` before connecting,
   rather than trusting it on first connect. If the box is ever rebuilt/re-keyed, grab the new
   host key with `ssh-keyscan bobs-server.net` and update that line in the workflow.

Because the SSH key can only ever run `deploy-bobs-server.sh`, a leaked `DEPLOY_SSH_KEY` secret
lets an attacker rebuild/restart the container — not read secrets, access the shell, or reach
anything else on the box.
