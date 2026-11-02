up:
	docker compose up --build -d

train:
	docker compose run --rm trainer python -m src.pipeline
	docker compose restart api

reload-data:
	docker compose run --rm trainer python -m src.pipeline --reload-data
	docker compose restart api

test:
	docker compose --profile dev run --rm --build tests

frontend:
	docker compose up -d --build frontend