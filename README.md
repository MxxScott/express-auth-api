# Express Auth Demo

A learning project built with **Express 5**, **MongoDB/Mongoose**, **JWT** and **bcryptjs**.
It ships a small REST API for authentication plus role based admin management, and a
plain HTML/CSS/JS frontend served by the same Express server.

---

## Table of contents

- [Features](#features)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Pages](#pages)
- [API reference](#api-reference)
- [Using Postman](#using-postman)
- [Creating your first admin](#creating-your-first-admin)
- [Middleware](#middleware)
- [Notes and limitations](#notes-and-limitations)

---

## Features

- Register / login with hashed passwords (bcryptjs, 10 salt rounds)
- JWT tokens (1 hour expiry) carrying `id` and `role`
- Roles: `user` and `admin`
- Reusable middleware: `auth`, `adminAuth`, `roleAuth(...roles)`
- Full admin API: list, search, filter, create, promote/demote, delete users
- Self service: view your own profile, delete your own account
- Frontend: home page with inline login/register, profile page, authenticated Field Notes journal, and admin panel
- Signed-in navigation exposes the full workspace, including the journal
- Password hashes are never returned by any endpoint

---

## Project structure

```
src/
├── api/
│   ├── api.js                  generates the sample data file
│   └── data/api.json           generated at startup
├── config/
│   └── database.js             mongoose connection
├── controllers/
│   ├── adminController.js      admin only user management
│   ├── apiController.js        serves the sample json
│   ├── authController.js       register / login / me / delete me
│   └── frontendController.js   sends the html pages
├── middleware/
│   └── authMiddleware.js       auth, adminAuth, roleAuth
├── models/
│   └── authModel.js            User schema
├── routes/
│   ├── adminRoute.js           /admin/*
│   ├── apiRoute.js             /api
│   ├── authRoute.js            /register /login /me /role
│   └── frontendRoute.js        / /login /profile /admin
├── utils/
│   └── userUtils.js            validation + shared response helpers
├── public/                     served statically
│   ├── css/styles.css
│   └── js/
│       ├── auth.js             session, request wrapper, nav, shared forms
│       ├── home.js
│       ├── login.js
│       ├── profile.js
│       └── admin.js
├── 404.html
├── admin.html
├── index.html
├── login.html
├── profile.html
├── app.js                      express app, middleware, route mounting
└── server.js                   entry point, connects DB then listens
```

---

## Getting started

```bash
npm install
npm run dev      # nodemon
# or
npm start        # plain node
```

Then open <http://localhost:8080>.

> Open the site through the Express server, **not** through VS Code Live Server.
> The frontend uses relative URLs (`/login`, `/me`, `/admin/users`), so it must be
> served from the same origin as the API.

---

## Environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-string
PORT=8080
```

`.env` is git ignored. If a secret has ever been committed, rotate it.

---

## Pages

| Route      | Description |
|------------|-------------|
| `/`        | Home. Shows login/register inline when signed out, a welcome card + data fetcher when signed in |
| `/login`   | Standalone login/register page |
| `/profile` | Your account details, refresh, logout, delete account |
| `/blog`    | Authenticated Field Notes journal: read posts, publish, edit, and delete |
| `/admin`   | Admin panel: stats, search, filter, promote/demote, delete (admins only) |

The nav adapts to your session using `data-auth="in" | "out" | "admin"` attributes.

---

## API reference

Base URL: `http://localhost:8080`

### Public

| Method | Endpoint     | Body | Description |
|--------|--------------|------|-------------|
| `POST` | `/register`  | `{ name, email, password, role? }` | Create an account, returns a token |
| `POST` | `/login`     | `{ email, password }` | Log in, returns a token |
| `GET`  | `/api`       | – | Sample JSON data |

### Requires a token

| Method   | Endpoint | Description |
|----------|----------|-------------|
| `GET`    | `/me`    | Your own profile |
| `DELETE` | `/me`    | Delete your own account |
| `GET`    | `/role`  | Demo route open to `admin` and `user` |

### Admin only (`/admin/*`)

| Method   | Endpoint                  | Body / Query | Description |
|----------|---------------------------|--------------|-------------|
| `GET`    | `/admin/stats`            | – | `{ total, admins, users }` + newest user |
| `GET`    | `/admin/users`            | `?role=admin\|user`, `?search=text` | List users |
| `GET`    | `/admin/users/:id`        | – | One user |
| `POST`   | `/admin/users`            | `{ name, email, password, role? }` | Create a user with any role |
| `PATCH`  | `/admin/users/:id/role`   | `{ role: "admin" \| "user" }` | Promote or demote |
| `DELETE` | `/admin/users/:id`        | – | Delete a user |

### Journal (`/api/blog`)

| Method | Endpoint | Authentication | Description |
|--------|----------|----------------|-------------|
| `GET` | `/api/blog` | Public | List posts, newest first |
| `GET` | `/api/blog/:id` | Public | Read one post |
| `POST` | `/api/blog` | Required | Publish a post |
| `PATCH` | `/api/blog/:id` | Required | Edit a post |
| `DELETE` | `/api/blog/:id` | Required | Delete a post |

The `/blog` page is linked from the signed-in navigation. Write actions send the
current JWT in the `Authorization: Bearer <token>` header; users must be signed in
to publish, edit, or delete journal entries.

### Password reset emails

Password recovery uses the public `POST /forgot-password` and
`POST /reset-password` endpoints. Reset emails are rendered from
`src/resetPasswordEmail.html` through the shared `src/utils/renderMail.js`
helper. Set `APP_URL` to the browser-facing application URL so generated links
point to the correct environment:

```env
APP_URL=http://localhost:8080
```

Reset emails link to `/login?token=...`, which is the canonical recovery URL.
The home page also accepts the same token as an additional entry point:
`/?token=...`. Both pages submit the token to `POST /reset-password`.

### Status codes

| Code | Meaning |
| ------ | --------- |
| `200` | OK |
| `201` | Created |
| `400` | Validation failed, duplicate email, bad id, invalid role |
| `401` | Missing or invalid token |
| `403` | Valid token but insufficient role |
| `404` | Not found |
| `500` | Unexpected server error |

---

## Using Postman

### 1. Set the body correctly

For every `POST` / `PATCH`, choose **Body → raw → JSON** and send real JSON:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "admin"
}
```

`express.json()` is the only body parser mounted, so `form-data` and
`x-www-form-urlencoded` will **not** work.

### 2. Register (role is accepted here)

```
POST http://localhost:8080/register
```

Response:

```json
{
  "message": "User Created Successfully",
  "user": {
    "_id": "...",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "eyJhbGciOi..."
}
```

Notes:

- `role` must be lowercase `"user"` or `"admin"` (the enum is case sensitive)
- omit `role` and it defaults to `"user"`
- emails are lowercased, so `Jane@x.com` and `jane@x.com` are the same account
- passwords must be at least 6 characters

### 3. Send the token on protected routes

Add a header:

```
Authorization: Bearer <your token>
```

Or use Postman's **Authorization** tab → Type **Bearer Token**.

Tip: save the token once and reuse it everywhere. In the **Tests** tab of your
login request add:

```js
pm.environment.set("token", pm.response.json().token);
```

then use `{{token}}` as the bearer token in other requests.

### 4. Example admin calls

```
GET    http://localhost:8080/admin/stats
GET    http://localhost:8080/admin/users
GET    http://localhost:8080/admin/users?role=admin
GET    http://localhost:8080/admin/users?search=jane
POST   http://localhost:8080/admin/users
       { "name": "New", "email": "new@x.com", "password": "secret123", "role": "admin" }
PATCH  http://localhost:8080/admin/users/<id>/role
       { "role": "admin" }
DELETE http://localhost:8080/admin/users/<id>
```

### 5. Troubleshooting

| Symptom | Cause |
| --------- | ------- |
| `401 No token, authorization denied` | Missing `Authorization` header |
| `401 Token is not valid` | Token expired (1h) or wrong `JWT_SECRET` — log in again |
| `403 Access denied, admin only` | Your token belongs to a `user`, not an `admin` |
| `400 Role must be one of: user, admin` | Wrong case or unknown role value |
| `400 Password is required` | Body was not raw JSON, or the key is misspelled |
| `role` stays `user` | You did not send `role` in the body |

---

## Creating your first admin

**Option A — register as admin (quickest)**

```
POST /register
{ "name": "Admin", "email": "admin@example.com", "password": "secret123", "role": "admin" }
```

**Option B — promote an existing user**

Log in as an existing admin, then:

```
PATCH /admin/users/<id>/role
{ "role": "admin" }
```

Once you hold an admin token, the **Admin** link appears in the site nav.

---

## Middleware

```js
const { auth, adminAuth, roleAuth } = require('./middleware/authMiddleware')

router.get('/me', auth, getUser)                     // any signed in user
router.use(adminAuth)                                // admins only
router.get('/role', roleAuth('admin', 'user'), fn)    // specific roles
```

All three verify the `Bearer` token and attach the decoded payload to
`req.user` as `{ id, role }`.

---

## Notes and limitations

This is a learning project, not production hardened. Things to be aware of:

- **`POST /register` accepts `role`**, so anyone can create an admin account.
  This is intentional for local testing. Before deploying, remove `role` from
  `register` and create admins through `POST /admin/users` instead.
- **Tokens live in `localStorage`**, which is readable by any XSS on the page.
  An `httpOnly` cookie is sturdier.
- **Tokens expire after 1 hour** and there is no refresh flow — you log in again.
- **No rate limiting** on login, so brute force is not mitigated.
- Two guards exist to stop lockouts: you cannot demote or delete your own admin
  account through `/admin/*`. Use `DELETE /me` to remove your own account.
- CORS is currently pinned to `http://127.0.0.1:5500` in `app.js`. Same origin
  requests from the served pages are unaffected.
