#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/"
  exit 1
fi

WORKFLOW_FILE=${1:-blender-render.yml}
REPO=${2:-}

# Example usage:
# ./tools/dispatch_workflow.sh blender-render.yml
# or pass repo: ./tools/dispatch_workflow.sh blender-render.yml owner/repo

echo "Dispatching workflow $WORKFLOW_FILE"

ARGS=(workflow run "$WORKFLOW_FILE" --ref main)

# Example default inputs — customize with flags if needed
ARGS+=(--field render_mode=high)
ARGS+=(--field export_glb=1)

if [ -n "$REPO" ]; then
  ARGS+=(--repo "$REPO")
fi

echo "Running: gh ${ARGS[*]}"
gh "${ARGS[@]}"

echo "Workflow dispatched. Use 'gh run list' to follow progress."
