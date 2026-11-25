FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
COPY src/data/ ./shared/
COPY index.html ./public/index.html
COPY vendor/ ./public/vendor/
ENV PUBLIC_DIR=/app/public NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
