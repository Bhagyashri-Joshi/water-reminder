# AquaTrack — Water Reminder Website

A simple water tracker built with **HTML, CSS, vanilla JavaScript, Node.js, Express, and MySQL**. It has no login and is intended for local use or as a demo.

## Features

- Three pages: Home, Dashboard, and Settings
- Manual water entry, plus/minus controls, and quick-add amounts
- Create, read, edit, and delete water logs
- Daily intake total, goal, progress bar, and remaining amount
- Date-based history
- A dismissible in-page hydration reminder shown once per browser tab session
- MySQL persistence
- Input validation and simple error messages
- Responsive blue-and-white interface

## Requirements

- Node.js 18 or newer
- MySQL 8.x
- A terminal and code editor (e.g. VS Code)

## Run locally

### 1. Create the database

Start MySQL, then import `schema.sql` using MySQL Workbench or the MySQL CLI.

CLI example:

```bash
mysql -u root -p < schema.sql
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and set your local MySQL credentials:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=aquatrack
TZ=Asia/Kolkata
```

Do not commit `.env`. It is excluded by `.gitignore`.

### 3. Install dependencies and start

From the project folder:

```bash
npm install
npm start
```

Open **http://localhost:3000** in your browser.

For development with automatic server restarts, use `npm run dev`.

## Pages

- `/` — Home and water facts
- `/dashboard.html` — Add and manage water logs, daily progress, and history
- `/settings.html` — Change the daily goal

## Water reminder

When a page opens, AquaTrack shows an in-page reminder: “Hydration reminder: take a moment to drink some water.” It can be dismissed with the close button and disappears automatically after 8 seconds. It appears once per browser tab session across the Home, Dashboard, and Settings pages. It is not a browser or operating-system notification and will not alert you when the site is closed.

To show the reminder again in the same tab, open the browser developer console and run:

```js
sessionStorage.removeItem("aquatrack-water-reminder-shown")
```

Then reload the page. Opening the site in a new tab also shows the reminder.

## API summary

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check database connectivity |
| GET | `/api/water?date=YYYY-MM-DD` | Get entries and summary for a date |
| POST | `/api/water` | Add an entry |
| PUT | `/api/water/:id` | Edit an entry amount |
| DELETE | `/api/water/:id` | Delete an entry |
| GET | `/api/settings` | Get current goal |
| PUT | `/api/settings` | Save current goal |

## Notes

- Amounts are stored as integer millilitres.
- The default daily goal is 2,000 ml.
- The current goal applies to newly initialized dates. Existing dates keep their saved daily goal.
- Daily summaries are initialized when a date is first viewed or receives an entry.
- This version has no login or per-user data separation. All visitors connected to the same deployed database share the same water logs and daily goal. Do not deploy it publicly for multiple users until authentication and user-specific data isolation are implemented.
- The project does not include cloud deployment configuration.
- AquaTrack is a basic tracking tool, not medical advice. Hydration needs vary by person.
- The Google Fonts import is optional; if offline, the browser falls back to local sans-serif fonts.

## Troubleshooting

- **Database unavailable:** Confirm MySQL is running, the database credentials in `.env` are correct, and `schema.sql` was imported.
- **Port already in use:** Change `PORT` in `.env`.
- **API error:** Open `http://localhost:3000/api/health` to test the database connection.
