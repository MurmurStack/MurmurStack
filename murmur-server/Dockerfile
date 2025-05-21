FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/ 
RUN apt-get update && apt-get install -y curl telnet redis-tools && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app

RUN uv sync --frozen --no-cache

CMD [".venv/bin/fastapi", "run", "server.py", "--port", "80", "--host", "0.0.0.0"]