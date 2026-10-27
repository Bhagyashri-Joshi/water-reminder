# AquaTrack — Product Requirements Document
**Version:** 1.0 · **Scope:** Stage 1 MVP

## 1. Overview
AquaTrack is a simple water-intake tracking website for logging daily water consumption, setting a daily goal, monitoring progress, and viewing or managing past entries. It is a single-user local application.

## 2. Objectives
- Record water intake manually or with increment/decrement and quick-add controls.
- Show daily total, goal, progress, and remaining amount.
- Persist records in MySQL.
- Demonstrate create, read, update, and delete operations.
- Provide daily history and editable goal settings.
- Keep the UI simple, responsive, and easy to explain.

## 3. Pages
1. **Home:** Brief introduction, two or three water-related facts, and a “Drink Water” CTA.
2. **Dashboard:** Daily total, goal/progress, entry form, CRUD list, and date-based history.
3. **Settings:** View and update the daily goal.

All pages share a top navigation bar.

## 4. Functional requirements
- Default goal: 2,000 ml.
- Add an entry using a manual amount, plus/minus buttons, or quick-add values (150, 250, 500 ml).
- Entry amounts must be positive whole numbers from 1 to 10,000 ml.
- Edit updates the existing entry; delete requires confirmation.
- Totals and progress refresh after each successful mutation.
- Progress percentage may exceed 100%; the visual bar is capped at 100%.
- Remaining amount cannot be negative.
- Goal can be updated in Settings; valid range is 250–10,000 ml.
- Select a past date to view its entries and summary.
- Keep each date’s saved goal snapshot so changing the current goal does not rewrite past goals.
- Saved data survives browser refreshes and server restarts.
- Display useful errors for invalid input or database failures.

## 5. Out of scope
Authentication, multi-user profiles, push/email notifications, AI health recommendations, social features, advanced analytics, cloud deployment, and medical advice.

## 6. UI requirements
Use a light background, blue accents, modestly rounded cards, readable text, simple forms, and responsive layouts. Avoid complex animations and heavy libraries.

## 7. Acceptance criteria
- All three pages load and navigation works.
- User can add, read, edit, and delete water entries.
- Daily total, goal, progress, and history are correct.
- Goal changes are persisted in MySQL.
- Data persists after refresh and server restart.
- Invalid values are rejected with understandable messages.
- Layout works on desktop and mobile.
