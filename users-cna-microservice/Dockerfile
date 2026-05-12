FROM python:3.11-slim
RUN pip install pipenv
WORKDIR /usr/src/app
COPY Pipfile ./
RUN pipenv install
EXPOSE 9090
COPY . .
CMD ["pipenv", "run", "python", "app.py"]
