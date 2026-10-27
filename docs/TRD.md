# AquaTrack — Technical Requirements Document
**Version:** 1.0 · **Architecture:** HTML/CSS/Vanilla JS + Express + MySQL

## 1. Technology stack
- Frontend: HTML5, CSS3, vanilla JavaScript
- Backend: Node.js and Express
- Database: MySQL 8.x
- Connector: `mysql2/promise`
- API: REST endpoints returning JSON
- Deployment: localhost

No React, ORM, authentication, or frontend framework is required.

## 2. Architecture
The browser serves HTML/CSS/JS from Express. Frontend JavaScript uses `fetch()` to call Express `/api` routes. Express validates input and uses parameterized SQL queries through `mysql2` to access MySQL. Browser code never connects directly to the database.

## 3. Structure
```text
aquatrack/
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── settings.html
│   ├── css/style.css
│   └── js/
│       ├── dashboard.js
│       └── settings.js
├── schema.sql
├── routes/             # API routes are kept in server.js for this small MVP
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── PRD.md
├── TRD.md
└── README.md
```

## 4. Database
Database: `aquatrack`

### `water_logs`
- `id`: auto-increment primary key
- `amount_ml`: positive integer amount
- `logged_at`: date/time of the drinking event
- `created_at`, `updated_at`: timestamps

### `daily_summaries`
- `summary_date`: primary key date
- `goal_ml`: daily goal snapshot for that date

### `user_settings`
- `id`: fixed row ID `1` for the single local user
- `daily_goal_ml`: current default goal (2,000 ml initially)

Daily totals are calculated using `SUM(amount_ml)` for the selected date rather than stored redundantly.

## 5. API endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Test database connectivity |
| GET | `/api/water?date=YYYY-MM-DD` | Entries, total, goal, progress |
| POST | `/api/water` | Create an entry |
| PUT | `/api/water/:id` | Update an entry |
| DELETE | `/api/water/:id` | Delete an entry |
| GET | `/api/settings` | Read current goal |
| PUT | `/api/settings` | Update current goal |

Successful reads/mutations return JSON. Invalid input returns `400`, missing records return `404`, and database/server errors return a generic `500` or a setup-oriented `503`.

## 6. Validation and reliability
- Validate entry amounts on client and server.
- Use parameterized SQL for all user-provided values.
- Keep database credentials in `.env`, never frontend JavaScript.
- Refresh totals from database after create/update/delete.
- Use one configured timezone consistently (`TZ=Asia/Kolkata` by default).
- Keep past daily goal snapshots in `daily_summaries`.
- Show a useful message if the database is unavailable.

## 7. Local setup
1. Install Node.js 18+ and MySQL 8.x.
2. Import `schema.sql`.
3. Copy `.env.example` to `.env` and set credentials.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

## 8. Test checklist
- Add 250 ml and verify total.
- Add another entry and verify summed total.
- Edit an entry and verify total changes.
- Delete an entry and verify total changes.
- Change the daily goal and verify it persists.
- Choose a previous date and verify history.
- Refresh browser and restart server; data should remain.
- Submit empty, zero, negative, decimal, and over-limit values; invalid values should be rejected.
- Stop MySQL and confirm the page shows a useful error.
