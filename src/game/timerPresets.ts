const colors = {
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
};

export const MODES = {
  Facil: { study: 25 * 60, break: 5 * 60, color: colors.green },
  Medio: { study: 40 * 60, break: 10 * 60, color: colors.yellow },
  Dificil: { study: 60 * 60, break: 15 * 60, color: colors.red },
} as const;
