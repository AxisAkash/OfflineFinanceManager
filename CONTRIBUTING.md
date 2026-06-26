# Contributing

## Development Setup

```bash
npm install
npm start
```

## Code Style

- TypeScript strict mode
- No `any` types
- No inline styles
- No magic numbers
- Components under 250 lines
- Hooks under 150 lines
- Feature-first folder structure
- All business logic outside UI

## Before Committing

1. Run `npm run typecheck` (TypeScript must pass)
2. Run `npm run lint` (ESLint must pass)
3. Run tests if applicable
4. Follow Conventional Commits format

## Commit Format

```
feat(scope): description
fix(scope): description
refactor(scope): description
perf(scope): description
style(scope): description
docs(scope): description
test(scope): description
build(scope): description
ci(scope): description
chore(scope): description
```

## Pull Request Process

1. Complete all checks above
2. Keep commits focused on single feature/fix
3. Reference related issues
4. Update documentation if needed
