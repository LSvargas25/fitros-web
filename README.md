# FitRos Web

Frontend for **FitRos**, a gym / fitness-coaching management platform. Consumes the [fitros-api](https://github.com/LSvargas25/fitros-api) backend.

## Features

Interfaces matching the API's domain: gyms and staff (admins, coaches), client accounts and profiles, workout routines, weekly training plans, exercises, notifications and a dashboard — scoped by role (owner / admin / coach).

## Tech stack

- Angular (standalone components)
- TypeScript

## Project structure

```
src/app/
  core/     # singleton services, guards, interceptors, auth state
  features/ # feature pages (gyms, coaches, clients, routines, training plans, ...)
  layout/   # shell layout (nav, header)
  shared/   # reusable components, pipes, directives
```

## Configuration & running locally

API base URL is set in `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7256'
};
```

Point `apiBaseUrl` at your running instance of fitros-api, then:

```bash
npm install
npm start
```

## Status

Active frontend project, paired with the fitros-api backend (the most architecturally complete backend in this portfolio).

## Future improvements

- Add unit/e2e tests
