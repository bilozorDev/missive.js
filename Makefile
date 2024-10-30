# Styles
YELLOW := $(shell echo "\033[00;33m")
RED := $(shell echo "\033[00;31m")
RESTORE := $(shell echo "\033[0m")

# Variables
.DEFAULT_GOAL := list
PACKAGE_MANAGER := pnpm
CURRENT_DIR := $(shell pwd)
DEPENDENCIES := node pnpm git
NODE := node -r dotenv/config
MISSIVEJS_VERSION := $(shell node -e "console.log(require('./libs/missive.js/package.json').version)")

.PHONY: list
list:
	@echo "${YELLOW}***${RED}***${RESTORE}***${YELLOW}***${RED}***${RESTORE}***${YELLOW}***${RED}***${RESTORE}***${YELLOW}***${RED}***${RESTORE}"
	@echo "${RED}Missive.js: ${YELLOW}Available targets${RESTORE}:"
	@grep -E '^[a-zA-Z-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf " ${YELLOW}%-15s${RESTORE} > %s\n", $$1, $$2}'
	@echo "${RED}=================================${RESTORE}"

.PHONY: check-dependencies
check-dependencies:
	@for dependency in $(DEPENDENCIES); do \
		if ! command -v $$dependency &> /dev/null; then \
			echo "${RED}Error:${RESTORE} ${YELLOW}$$dependency${RESTORE} is not installed."; \
			exit 1; \
		fi; \
	done
	@echo "All ${YELLOW}dependencies are installed.${RESTORE}"

.PHONY: install
install: check-dependencies update ## Install the Application and reset the database

.PHONY: update
update: check-dependencies ## Update the Repo
	@$(PACKAGE_MANAGER) install

.PHONY: codeclean
codeclean: ## Code Clean
	@$(PACKAGE_MANAGER) run lint:fix
	@$(PACKAGE_MANAGER) run prettier:fix
	@$(PACKAGE_MANAGER) run lint:check
	@$(PACKAGE_MANAGER) run prettier:check

.PHONY: strict-codeclean
strict-codeclean: codeclean
	@$(PACKAGE_MANAGER) run types:check

.PHONY: build
build: ## Build All
	@$(PACKAGE_MANAGER) run build

.PHONY: watch
watch: ## Watch
	@$(PACKAGE_MANAGER) watch

.PHONY: only-tests
only-tests: ## Run Tests only
	@$(PACKAGE_MANAGER) run test

.PHONY: tests
tests: codeclean ## Run Codeclean, Tests and Builds
	@$(PACKAGE_MANAGER) run test
	@$(PACKAGE_MANAGER) run build

.PHONY: serve-docs
serve-docs: ## Run the Docs
	@$(PACKAGE_MANAGER) run dev --filter=missive.js-docs

.PHONY: serve-cli-example
serve-cli-example: ## Run the CLI Example
	@$(PACKAGE_MANAGER) run dev --filter=missive.js-cli-example

.PHONY: serve-remix-run-example
serve-remix-run-example: ## Run the Remix Run Example
	@$(PACKAGE_MANAGER) run dev --filter=missive.js-remix-run-example

.PHONY: serve-astro-example
serve-astro-example: ## Run the Astro Example
	@$(PACKAGE_MANAGER) run dev --filter=missive.js-astro-example

.PHONY: serve-nextjs-example
serve-nextjs-example: ## Run the Next JS Example
	@$(PACKAGE_MANAGER) run dev --filter=missive.js-nextjs-example

.PHONY: serve-fancy-demo-on
serve-fancy-demo-on: ## Run Fancy Demo One
	@$(PACKAGE_MANAGER) run dev --filter=missive.js-fancy-demo-one


.PHONY: release
release: ## Create a Realease (tag and push)
	@git tag -s -a v$(MISSIVEJS_VERSION) -m "v$(MISSIVEJS_VERSION)"
	@git push origin v$(MISSIVEJS_VERSION)

