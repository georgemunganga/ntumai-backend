# Users Module Overview

This document lists the active layers and HTTP APIs that remain in the Users module after removing the unused auth scaffolding. The goal is to reflect the lean footprint that currently ships in the repository.

## Module Layers

| Layer | File | Purpose |
| --- | --- | --- |
| Controller | [`users.controller.ts`](./users.controller.ts) | Exposes the HTTP routes that serve user profile data and role-management actions. |
| Service | [`users.service.ts`](./users.service.ts) | Implements the business logic for switching and registering roles using Prisma. |
| DTO | [`dto/switch-role.dto.ts`](./dto/switch-role.dto.ts) | Validates payloads that target role transitions (enum coercion, OTP, contact fields). |
| Module | [`users.module.ts`](./users.module.ts) | Wires the controller and service together and provides the shared Prisma dependency. |
| Shared Dependency | [`../common/prisma/prisma.service.ts`](../common/prisma/prisma.service.ts) | Lightweight Prisma wrapper that backs the service calls. |

There are no additional domain, infrastructure, or presentation sublayers at this time—the module is intentionally slim.

## Exposed APIs

All routes are mounted under the `/users` prefix and assume the authenticated user context supplied by Nest guards (stubbed in tests). Responses currently return either mocked profile data or Prisma-backed role information.

### `GET /users/profile`
- **Description:** Returns a placeholder profile payload for the current user. Until full profile storage is restored, the response is mocked with static fields plus the caller's user ID when present.
- **Handler:** `UsersController.getProfile`

### `POST /users/switch-role`
- **Description:** Switches the caller to an already-registered role once any required OTP is verified. Validates the `targetRole`, `otpCode`, `phoneNumber`, and `email` via `SwitchRoleDto`.
- **Handler:** `UsersController.switchRole`
- **Service logic:** `UsersService.switchRole` checks existing role assignments and updates `currentRole` in Prisma.

### `POST /users/register-role`
- **Description:** Grants the caller access to a new role (customer, driver, or vendor). Requires OTP when promoting to driver/vendor roles before creating or reactivating the role assignment record.
- **Handler:** `UsersController.registerRole`
- **Service logic:** `UsersService.registerForRole`

### `GET /users/roles`
- **Description:** Lists the caller's active roles and the role currently selected. Useful for front-ends that render role switchers.
- **Handler:** `UsersController.getUserRoles`
- **Service logic:** `UsersService.getUserRoles`

## Testing Status

- Unit tests: `users.controller.spec.ts` exercises the controller logic with a mocked service.
- Integration tests: Pending – e2e coverage to validate guard/application wiring remains a backlog item.
