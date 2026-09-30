import { UserStatus } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: UserStatus;
  department?: string | null;
  institution?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
