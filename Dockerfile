FROM node:22-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
ARG PUBLIC_CONVEX_URL
ARG PUBLIC_POSTHOG_PROJECT_TOKEN
ARG PUBLIC_POSTHOG_HOST
ENV PUBLIC_CONVEX_URL=$PUBLIC_CONVEX_URL
ENV PUBLIC_POSTHOG_PROJECT_TOKEN=$PUBLIC_POSTHOG_PROJECT_TOKEN
ENV PUBLIC_POSTHOG_HOST=$PUBLIC_POSTHOG_HOST
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine AS runner
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
