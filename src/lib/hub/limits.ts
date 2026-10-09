const KIB = 1024;
const MIB = 1024 * KIB;

export const LIMITS = {
  root: 64 * KIB,
  timestamp: 64 * KIB,
  snapshot: 8 * MIB,
  moderation: 8 * MIB,
  plugin: 1 * MIB,
  publishers: 4 * MIB,
  policy: 4 * MIB,
  image: 4 * MIB,
  avatar: 512 * KIB,
  stats: 1 * MIB,
} as const;
