#!/usr/bin/env bash
# Deploy the site to S3 and invalidate CloudFront.
#
# Only files tracked by git are published (so untracked/local files never leak).
# Usage: scripts/deploy.sh [--dry-run] [--prune]
#   --dry-run  show what would change, upload nothing, no invalidation
#   --prune    also delete bucket objects that are not in the repo (bucket is
#              NOT versioned, so deletions are permanent)
set -euo pipefail

BUCKET="${BUCKET:-jaritimonen.com}"
REGION="${AWS_REGION:-eu-west-1}"
# Apex distribution. The www distribution only redirects to the apex, so it
# does not need invalidating.
DISTRIBUTION_ID="${DISTRIBUTION_ID:-E2XIGNF9FG0N1J}"

# Repo files that must not be published.
EXCLUDES=(.gitignore .idea Makefile README.md scripts)

DRY_RUN=()
PRUNE=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=(--dryrun) ;;
    --prune)   PRUNE=(--delete) ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "warning: working tree has uncommitted changes; deploying the working-tree" \
       "versions of tracked files" >&2
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# Stage tracked files only, minus the excludes.
git ls-files -z | while IFS= read -r -d '' f; do
  [[ -e "$f" ]] || continue
  skip=0
  for e in "${EXCLUDES[@]}"; do
    [[ "$f" == "$e" || "$f" == "$e"/* ]] && { skip=1; break; }
  done
  (( skip )) || install -D -m 644 "$f" "$STAGE/$f"
done

HTML_FILTER=(--exclude "*" --include "*.html" --include "*.xml" --include "*.txt" --include "*.webmanifest")

echo "==> Syncing assets to s3://$BUCKET (cache 1 day)"
aws s3 sync "$STAGE" "s3://$BUCKET" --region "$REGION" \
  "${DRY_RUN[@]}" "${PRUNE[@]}" \
  --exclude "*.html" --exclude "*.xml" --exclude "*.txt" --exclude "*.webmanifest" \
  --cache-control "public, max-age=86400"

# HTML/metadata last, so pages never point at assets that are not uploaded yet.
echo "==> Syncing HTML/metadata (revalidated on every request)"
aws s3 sync "$STAGE" "s3://$BUCKET" --region "$REGION" \
  "${DRY_RUN[@]}" "${PRUNE[@]}" \
  "${HTML_FILTER[@]}" \
  --cache-control "no-cache"

if (( ${#DRY_RUN[@]} )); then
  echo "==> Dry run: skipping CloudFront invalidation"
  exit 0
fi

echo "==> Invalidating CloudFront $DISTRIBUTION_ID"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" --query 'Invalidation.{Id:Id,Status:Status}' --output table
echo "==> Done: https://jaritimonen.com/"
