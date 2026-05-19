.PHONY: install sync-types

install:
	@if [ -d apps/tutor_app ]; then \
		(cd apps/tutor_app && flutter pub get); \
	else \
		echo "Skipping apps/tutor_app (directory not found)"; \
	fi; \
	if [ -d apps/vet_dashboard ]; then \
		(cd apps/vet_dashboard && npm install); \
	else \
		echo "Skipping apps/vet_dashboard (directory not found)"; \
	fi; \
	if [ -d packages/api_contracts ]; then \
		(cd packages/api_contracts && npm install); \
	else \
		echo "Skipping packages/api_contracts (directory not found)"; \
	fi

sync-types:
	@echo "TODO: add Supabase code generation for Dart and TypeScript"
	# Example (future):
	# supabase gen types typescript --project-id <PROJECT_ID> > packages/api_contracts/src/supabase.types.ts
	# supabase gen types dart --project-id <PROJECT_ID> > apps/tutor_app/lib/core/supabase_types.dart
