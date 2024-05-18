FROM node:22.1.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /gitlab-ai-review
WORKDIR /gitlab-ai-review

# Build without dev dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Build with dev dependencies
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build:ts

FROM base
# Get only production dependencies
COPY --from=prod-deps /gitlab-ai-review/node_modules /gitlab-ai-review/node_modules
# Get the dist folder correctly compiled with the dev dependencies
COPY --from=build /gitlab-ai-review/dist /gitlab-ai-review/dist
EXPOSE 3000
CMD [ "pnpm", "docker:start" ]
