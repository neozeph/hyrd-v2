import { prisma } from "../../lib/prisma.js";

interface CreateUserData {
  email: string;
  passwordHash: string;
}

interface CreateSessionData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export function createUser(data: CreateUserData) {
  return prisma.user.create({
    data,
  });
}

export function createSession(data: CreateSessionData) {
  return prisma.session.create({
    data,
  });
}

export function findValidSessionByTokenHash(tokenHash: string) {
  return prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },

    include: {
      user: true,
    },
  });
}

export function deleteSessionByTokenHash(tokenHash: string) {
  return prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}

export function deleteExpiredSessions() {
  return prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}
