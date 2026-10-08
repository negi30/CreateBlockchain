# Stage 1: Build the React Frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Explicitly set the backend URL to the same origin (since it's served from the same server)
# In App.js it uses http://localhost:8080, but relative URLs are better for production.
# We can just build it as-is and it will connect if accessed on localhost, or we could configure it.
RUN npm run build

# Stage 2: Build the C++ Backend
FROM ubuntu:22.04 AS backend-builder
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y cmake g++ libssl-dev build-essential
WORKDIR /app
COPY CMakeLists.txt Makefile ./
COPY src/ ./src/
RUN mkdir build && cd build && cmake .. && make

# Stage 3: Final Production Image
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy the compiled C++ binary
COPY --from=backend-builder /app/build/blockchain_app .

# Copy the built React app into the expected directory (served by httplib)
COPY --from=frontend-builder /app/frontend/build ./frontend/build

EXPOSE 8080

CMD ["./blockchain_app"]
