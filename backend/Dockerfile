FROM python:3.12.10@sha256:f282c100bbcd0db4346ba7261e15272937fe89de316f0a7159168da02b6fc55e
COPY ./requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade -r ./requirements.txt
COPY ./src .
CMD ["fastapi", "run", "server.py", "--port", "80"]