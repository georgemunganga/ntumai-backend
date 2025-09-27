# Repository Guidelines

## Project Structure & Module Organization
- `src/` hosts the NestJS app; keep features under `src/modules/*`, share cross-cutting utilities in `src/common/`, and load configuration providers from `src/config/`.
- `database/prisma/` contains the Prisma schema, migrations, and `seed.ts`; regenerate the Prisma client whenever models change.
- `test/` mirrors feature folders (auth, drivers, errands, users) and keeps end-to-end flows under `test/integration/` with bootstrapping helpers in `test/setup/`.
- `scripts/` stores automation such as `scripts/run-all-tests.js`; `dist/` is generated output and should never be committed.

## Build, Test, and Development Commands
- `npm run start:dev` watches the API with hot reload; ensure `.env` aligns with `.env.example` before launching.
- `npm run build` compiles TypeScript to `dist/`; CI/CD pipelines call this after Prisma generation.
- `npm run start:prod` boots the compiled server for staging or production smoke tests.
- `npm run lint` and `npm run format` enforce ESLint + Prettier; run them locally before pushing.
- `npm run deploy` applies migrations (`prisma migrate deploy`) and builds the app when deploying without a full CI job.

## Coding Style & Naming Conventions
- TypeScript only; prefer typed DTOs and interfaces in `dto/` folders, avoiding `any` unless legacy contracts require it.
- Prettier enforces 2-space indentation, single quotes, and trailing commas; let the formatter handle styling.
- File names follow Nest patterns: `*.module.ts`, `*.controller.ts`, `*.service.ts`; keep feature-specific guards and pipes in sub-folders.
- Centralize environment-specific logic in factory providers under `src/config/` to maintain DI consistency.

## Testing Guidelines
- Unit specs live beside their targets ending in `.spec.ts`; integration suites group under `test/<feature>/`.
- `npm run test` executes the full Jest suite, `npm run test:watch` speeds local cycles, and `npm run test:cov` writes reports to `coverage/`.
- `npm run test:e2e` validates API contracts; run it after schema changes and seed data with `npx prisma db seed --schema database/prisma/schema.prisma`.

## Commit & Pull Request Guidelines
- Recent commits use short, lowercase subjects (`apis`, `add`); keep that cadence but write imperatively (e.g., `add driver auth guard`).
- Reference tickets or docs in the body, and call out schema or contract impacts explicitly.
- Pull requests should link issues, summarize testing (`npm run lint`, `npm run test`), and attach Swagger screenshots when API surface changes.

## Database & Environment Tips
- Update `.env.example` whenever configuration keys change; CI relies on it for validation.
- After editing `schema.prisma`, run `npx prisma generate --schema database/prisma/schema.prisma` and commit migrations from `database/prisma/migrations/` only.
- Use `ts-node database/prisma/seed.ts` (or `npx prisma db seed --schema database/prisma/schema.prisma`) to refresh local data before integration runs.
