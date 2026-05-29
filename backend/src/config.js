import './env.js';

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminInviteCode: process.env.ADMIN_INVITE_CODE || ''
};
