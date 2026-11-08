set -e
export PATH="/tmp/node-v22.23.0-darwin-arm64/bin:/Users/loki/.local/opt/git-lfs-3.8.1/git-lfs-3.8.1:$PATH"
osb55_tools=$(mktemp -d /tmp/ozsb-55-tools.XXXXXX)
printf '%s\n' "$osb55_tools" > /Users/loki/.openclaw/workspace/projects/oz-startup-brain/verify76-20442/tools-path.txt
npm install --prefix "$osb55_tools" --cache "$osb55_tools/cache" --no-save --package-lock=false --ignore-scripts --no-audit --no-fund npm@10.9.9 > /Users/loki/.openclaw/workspace/projects/oz-startup-brain/verify76-20442/npm-bootstrap.log 2>&1
export PATH="$osb55_tools/node_modules/.bin:$PATH"
node --version
npm --version
test "$(npm --version)" = 10.9.9
test "$(gh pr view 76 --repo nissan/oz-startup-brain --json headRefOid --jq .headRefOid)" = fda0911b910a2a40f394d36e6c2e4fea1487f2e1
if lsof -nP -iTCP:3110 -sTCP:LISTEN || lsof -nP -iTCP:3910 -sTCP:LISTEN; then exit 1; fi
GIT_LFS_SKIP_SMUDGE=1 git -c core.hooksPath=/dev/null -c core.fsmonitor=false clone --no-checkout https://github.com/nissan/oz-startup-brain.git /Users/loki/.openclaw/worktrees/oz-verify76-20442
cd /Users/loki/.openclaw/worktrees/oz-verify76-20442
GIT_LFS_SKIP_SMUDGE=1 git -c core.hooksPath=/dev/null -c core.fsmonitor=false checkout --detach fda0911b910a2a40f394d36e6c2e4fea1487f2e1
git config --local --list
cat AGENTS.md HANDOVER.md docs/delivery/README.md docs/delivery/agent-workflow.md > /Users/loki/.openclaw/workspace/projects/oz-startup-brain/verify76-20442/repository-instructions.txt
npm ci > /Users/loki/.openclaw/workspace/projects/oz-startup-brain/verify76-20442/npm-ci.log 2>&1
npm run build > /Users/loki/.openclaw/workspace/projects/oz-startup-brain/verify76-20442/build.log 2>&1
