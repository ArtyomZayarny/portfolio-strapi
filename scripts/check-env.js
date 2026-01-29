#!/usr/bin/env node
/**
 * Проверка обязательных переменных окружения перед запуском Strapi.
 * Выполняется только в production (Render, Vercel и т.д.).
 */
if (process.env.NODE_ENV !== 'production') {
  process.exit(0);
}
const required = [
  'ADMIN_JWT_SECRET',
  'API_TOKEN_SALT',
  'TRANSFER_TOKEN_SALT',
  'ENCRYPTION_KEY',
  'APP_KEYS',
  'JWT_SECRET',
];

const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  console.error('\n❌ Ошибка: отсутствуют обязательные переменные окружения:\n');
  missing.forEach((key) => console.error(`   - ${key}`));
  console.error('\n📖 Инструкция: см. RENDER_DEPLOYMENT.md');
  console.error('   Или выполните: openssl rand -base64 32\n');
  process.exit(1);
}
