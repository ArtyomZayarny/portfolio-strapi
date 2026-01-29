# Развёртывание Strapi на Render

## Проблема: "Missing admin.auth.secret configuration"

Эта ошибка возникает, когда не заданы обязательные переменные окружения. Strapi требует их для работы в production.

## Решение: добавить переменные окружения в Render

1. Откройте **Render Dashboard** → ваш сервис **strapi-app**
2. Перейдите в **Environment** (переменные окружения)
3. Добавьте следующие переменные:

### Обязательные переменные

| Переменная | Описание | Как сгенерировать |
|------------|----------|-------------------|
| `ADMIN_JWT_SECRET` | Секрет для JWT админ-панели | `openssl rand -base64 32` |
| `API_TOKEN_SALT` | Соль для API токенов | `openssl rand -base64 32` |
| `TRANSFER_TOKEN_SALT` | Соль для transfer токенов | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Ключ шифрования | `openssl rand -base64 32` |
| `APP_KEYS` | Ключи приложения (через запятую) | `key1,key2` (2+ ключа) |
| `JWT_SECRET` | Секрет для JWT пользователей | `openssl rand -base64 32` |

### Переменные для Render (обычно задаются автоматически)

| Переменная | Значение | Примечание |
|------------|----------|------------|
| `PORT` | — | Render задаёт автоматически |
| `HOST` | `0.0.0.0` | Для приёма внешних подключений |

### База данных (важно для Render)

**SQLite не подходит** для Render — файловая БД теряется при каждом деплое.

Используйте **PostgreSQL** (Render предоставляет бесплатно):

1. Создайте **PostgreSQL** в Render
2. Добавьте переменную `DATABASE_URL` — Render подставит её автоматически при связывании БД
3. Добавьте переменную `DATABASE_CLIENT=postgres`

## Быстрая генерация секретов

Выполните в терминале:

```bash
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "APP_KEYS=$(openssl rand -base64 16),$(openssl rand -base64 16)"
```

Скопируйте значения в Render Environment.

## Проверка порта

Render ожидает, что приложение слушает порт из переменной `PORT`. Конфиг `server.ts` уже использует `env('PORT', 1337)` — Render передаёт свой порт автоматически.

## Ошибка 403 Forbidden при запросе /api/projects

Если фронтенд получает **403 Forbidden** при запросе к Strapi API — включите права для **Public** роли:

1. Откройте **Strapi Admin**: `https://portfolio-strapi-b8le.onrender.com/admin`
2. Перейдите в **Settings** (⚙️) → **Users & Permissions** → **Roles**
3. Выберите роль **Public**
4. В блоке **Project** включите:
   - **find** — список проектов
   - **findOne** — один проект
5. В блоке **Upload** (если есть) включите **find** — для отображения изображений проектов
6. Нажмите **Save**

## CORS (если фронт на другом домене)

Если фронтенд на Vercel или другом домене, добавьте в Render Environment:

| Переменная | Значение |
|------------|----------|
| `FRONTEND_URL` | URL фронтенда, напр. `https://my-portfolio.vercel.app` |

После добавления переменных перезапустите деплой.
