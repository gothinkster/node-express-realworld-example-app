const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não definida`);
  }
  return value;
};

export const jwtSecret = (): string => requireEnv('JWT_SECRET');
