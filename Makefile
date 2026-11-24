.PHONY: help deploy plan prune whoami

help:
	@echo "make plan    - dry run: show what a deploy would upload"
	@echo "make deploy  - upload to S3 and invalidate CloudFront"
	@echo "make prune   - deploy and DELETE bucket files not in the repo (unversioned!)"
	@echo "make whoami  - show the active AWS identity"

plan:
	./scripts/deploy.sh --dry-run

deploy:
	./scripts/deploy.sh

prune:
	./scripts/deploy.sh --prune

whoami:
	aws sts get-caller-identity
