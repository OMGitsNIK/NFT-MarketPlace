# Makefile to clean up Docker PostgreSQL container and volume

.PHONY: clean-db

clean-db:
	@echo "Stopping and removing PostgreSQL container..."
	docker stop marketplaceindexer-postgresql-1 || true
	docker rm marketplaceindexer-postgresql-1 || true
	docker ps
	
	@echo "Removing PostgreSQL volume..."
	docker volume rm marketplaceindexer_postgres_data || true
	
	@echo "Listing remaining volumes (for verification)..."
	docker volume ls