const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const { withTransaction } = require('../config/database');
const { UnauthorizedError, BadRequestError, ConflictError } = require('../utils/errors');
const { ROLES } = require('../config/constants');

const authService = {
  /**
   * Register new user
   */
  async register({ name, phone, email, password }) {
    // Check if phone already exists
    const existingUser = await userRepository.findByPhone(phone);
    if (existingUser) {
      throw new ConflictError('Phone number already registered');
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await userRepository.findByEmail(email);
      if (existingEmail) {
        throw new ConflictError('Email already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and assign default role
    const user = await withTransaction(async (client) => {
      const newUser = await userRepository.create({
        name,
        phone,
        email,
        passwordHash
      });

      // Assign USER role
      const userRole = await roleRepository.findByName(ROLES.USER);
      if (userRole) {
        await userRepository.assignRole(newUser.user_id, userRole.role_id, client);
      }

      return newUser;
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.user_id);

    return {
      user: {
        userId: user.user_id,
        name: user.name,
        phone: user.phone,
        email: user.email
      },
      ...tokens
    };
  },

  /**
   * Login with phone and password
   */
  async login({ phone, password }) {
    const user = await userRepository.findByPhoneWithRoles(phone);
    
    if (!user || !user.password_hash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.user_id);

    return {
      user: {
        userId: user.user_id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        roles: user.roles
      },
      ...tokens
    };
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token exists and not revoked
    const storedToken = await refreshTokenRepository.findByToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found or revoked');
    }

    // Check if expired
    if (new Date(storedToken.expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Revoke old token
    await refreshTokenRepository.revoke(refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens(decoded.userId);

    return tokens;
  },

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await refreshTokenRepository.revoke(refreshToken);
    }
  },

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await refreshTokenRepository.revokeAllByUserId(userId);
  },

  /**
   * Change password
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findByPhoneWithRoles(
      (await userRepository.findById(userId)).phone
    );

    if (!user || !user.password_hash) {
      throw new BadRequestError('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePassword(userId, passwordHash);

    // Revoke all refresh tokens
    await refreshTokenRepository.revokeAllByUserId(userId);
  },

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Calculate expiry
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const daysMatch = refreshExpiresIn.match(/(\d+)d/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Store refresh token
    await refreshTokenRepository.create({
      userId,
      token: refreshToken,
      expiresAt
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    };
  },

  /**
   * Get OpenID Connect configuration (discovery document)
   */
  getOpenIDConfiguration() {
    const issuer = process.env.OAUTH_ISSUER || 'http://localhost:3000';
    return {
      issuer,
      authorization_endpoint: `${issuer}/api/auth/authorize`,
      token_endpoint: `${issuer}/api/auth/token`,
      userinfo_endpoint: `${issuer}/api/auth/userinfo`,
      jwks_uri: `${issuer}/api/auth/.well-known/jwks.json`,
      response_types_supported: ['code', 'token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256', 'HS256'],
      scopes_supported: ['openid', 'profile', 'email', 'phone'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      claims_supported: ['sub', 'name', 'email', 'phone']
    };
  },

  /**
   * Get user info for OpenID Connect
   */
  async getUserInfo(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      sub: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone
    };
  }
};

module.exports = authService;
