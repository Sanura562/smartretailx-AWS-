FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (separate layer = Docker caches this
# unless requirements.txt changes, so rebuilds are much faster)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the actual application code
COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
