import type { User } from "../../generated/prisma/client.js";

import type { AuthenticatedUser } from "./auth.types.js";

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
