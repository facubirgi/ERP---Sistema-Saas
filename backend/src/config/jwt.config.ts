import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  // SECURITY: Validate JWT_SECRET is set and strong
  if (!secret) {
    throw new Error(
      'SECURITY ERROR: JWT_SECRET must be set in environment variables. ' +
        "Generate a strong secret using: node -e \"console.log(require('crypto').randomBytes(64).toString('base64'))\"",
    );
  }

  if (secret.length < 32) {
    throw new Error(
      'SECURITY ERROR: JWT_SECRET must be at least 32 characters long for security. ' +
        'Current length: ' +
        secret.length,
    );
  }

  // SECURITY: Validate JWT_REFRESH_SECRET if provided
  if (refreshSecret && refreshSecret.length < 32) {
    throw new Error(
      'SECURITY ERROR: JWT_REFRESH_SECRET must be at least 32 characters long. ' +
        'Current length: ' +
        refreshSecret.length,
    );
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRATION || '1h', // Default 1 hour
    refreshSecret: refreshSecret || secret, // Use same secret if not provided (not recommended for production)
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  };
});
