# Genius Kids

Gamified revision for the Ugandan primary curriculum. Pupils answer short flashcards
(multiple choice, true/false, typed answers) and get friendly feedback instead of
memorising long notes. Teachers manage the content in a web admin panel, and flashcards
can be generated with **Meta Llama 3.3 70B**.

## What is in this repo

```
genius-kids/
  backend-overlay/   Laravel files to copy into a fresh Laravel project (API, admin logic, sync, AI job)
  admin-web/         React (Vite) admin panel: classes, subjects, topics, flashcards, JSON import
  pupil-app/         Expo / React Native app for pupils (runs on dummy data, works offline)
  sample-data/       Ready-to-import flashcard JSON files
```

## Current status (read this first)

| Piece | Status |
|---|---|
| Pupil app (subjects, topics, 3 question types, feedback, progress, resume) | Working, runs on `dummyData.js` |
| Admin panel (login, first-admin setup, classes, subjects, topics, flashcards CRUD, JSON import, approve) | Working |
| Laravel auth, master tables, flashcards API | Written |
| Llama generation job (notes -> flashcards) | Written, **not yet connected to an admin screen** |
| Sync endpoints (`/api/sync/pull`, `/api/sync/push`) | Written, **pupil app does not call them yet** |
| Pupil login, parent-pupil link, leaderboard/XP on server | Not built |

The pupil app currently reads `pupil-app/src/data/dummyData.js` and stores progress on the phone.
Flashcards created in the admin panel therefore do **not** appear in the pupil app until the
app is connected to the sync endpoints.

## Prerequisites

- PHP 8.2+ and Composer
- MySQL 8 (or MariaDB)
- Node.js LTS (20 or newer) and npm
- The **Expo Go** app on a phone (Android or iOS), on the same Wi-Fi as your computer

---

## 1. Backend (Laravel + MySQL)

### 1.1 Create the project
```bash
composer create-project laravel/laravel backend
cd backend
php artisan install:api          # installs Sanctum, creates routes/api.php, registers API routing
```

Create an empty MySQL database (for example `geniuskids`) and set it in `backend/.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=geniuskids
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database

# only needed for AI generation (see section 4)
LLAMA_API_KEY=
LLAMA_BASE_URL=
LLAMA_MODEL=

# optional seeded passwords (default is password123)
SEED_ADMIN_PASSWORD=
SEED_USER_PASSWORD=
```

### 1.2 Copy the overlay files
Copy the contents of `backend-overlay/` into your Laravel project, merging folders:

| From `backend-overlay/` | To |
|---|---|
| `app/Http/Controllers/*`, `app/Http/Middleware/*`, `app/Models/*`, `app/Jobs/*`, `app/Services/*` | same paths in `backend/app/` |
| `database/migrations/*`, `database/seeders/UserSeeder.php` | same paths in `backend/database/` |
| `tests/Unit/QuestionGeneratorTest.php` | `backend/tests/Unit/` |

**Do not overwrite your `User` model.** Edit `app/Models/User.php` and add Sanctum's trait:
```php
use Laravel\Sanctum\HasApiTokens;
// ...
use HasApiTokens, HasFactory, Notifiable;
```
Leave `role` out of `$fillable` on purpose (the code sets it safely with `forceFill`).

### 1.3 Wire up routes, middleware and config

1. **Routes:** open `backend-overlay/routes/api_admin_routes.php` and put its contents into `routes/api.php`
   (keep a single `<?php` at the top, and the `use` lines above the routes).
2. **Middleware alias:** in `bootstrap/app.php`:
   ```php
   ->withMiddleware(function (Middleware $middleware): void {
       $middleware->alias(['admin' => \App\Http\Middleware\EnsureAdmin::class]);
   })
   ```
3. **Config:** in `config/services.php`, add inside the returned array:
   ```php
   'llama' => [
       'key'      => env('LLAMA_API_KEY'),
       'base_url' => env('LLAMA_BASE_URL'),
       'model'    => env('LLAMA_MODEL'),
       'timeout'  => 90,
   ],
   ```
4. **DatabaseSeeder:** in `database/seeders/DatabaseSeeder.php`, inside `run()`:
   ```php
   $this->call([UserSeeder::class]);
   ```

### 1.4 Migrate, seed, run
```bash
composer dump-autoload
php artisan migrate
php artisan db:seed
php artisan serve                 # http://localhost:8000
```
Check the routes exist: `php artisan route:list --path=api`

Seeded development accounts (password `password123` unless you set the env values):
`admin@example.com`, `parent1@example.com`, `parent2@example.com`, `pupil1@example.com`, `pupil2@example.com`, `pupil3@example.com`.
Skip the seeder if you prefer: with no admin in the database, the admin panel shows a
"Create the first admin account" link (`/setup`).

> Migration notes: run in file order (master tables -> questions -> role column -> nullable source note -> attempts).
> `..._000003_make_questions_source_note_nullable` is harmless on a fresh database.
> Seeded passwords are for development only. In production the seeder refuses to run without `SEED_ADMIN_PASSWORD`.

Quick API check:
```bash
curl http://localhost:8000/api/setup-status
```

---

## 2. Admin panel (React + Vite)

```bash
cd admin-web
cp .env.example .env              # VITE_API_URL=http://localhost:8000/api
npm install
npm run dev                       # http://localhost:5173
```
Sign in with the seeded admin (or create the first admin via the link on the login page).

If the browser blocks requests (CORS), publish the config and allow the origin:
`php artisan config:publish cors`, then set `allowed_origins` to `['http://localhost:5173']`.

### Add content
1. **Subjects** -> add `English`, `Mathematics`, ...
2. **Classes** -> add `P1` (and others).
3. Open the class -> **Add topic** (choose its subject).
4. Open the topic -> **Add flashcard** (typed by hand), or **Import JSON** and paste a file from `sample-data/`.
5. Imported cards are drafts: press **Approve** (only approved cards are served to pupils).

---

## 3. Pupil app (Expo / React Native)

```bash
cd pupil-app
npm install
npx expo start
```
Scan the QR code with Expo Go (Android) or the Camera app (iPhone).

Troubleshooting:
- Phone cannot reach the computer: `npx expo start --tunnel`
- Odd errors or stale code: `npx expo start -c`
- Android emulator: start one in Android Studio, then press `a` in the terminal
- Expo Go version mismatch: update the Expo Go app

Content lives in `pupil-app/src/data/dummyData.js` (subjects -> topics -> questions; keep every id unique).
Pupil name, streak, XP and hearts are in the `PUPIL` object at the bottom of that file.
Progress is saved on the device, so the app works with no internet.

Question shape used by the screens:
```js
{ id: 'q1', type: 'multiple-choice',        // 'boolean' | 'multiple-choice' | 'text-input'
  question: '...', options: ['a','b','c'], correctAnswer: 'a',
  acceptedAnswers: ['a'],                    // optional, text-input only
  explanation: '...' }                       // boolean: correctAnswer is true/false
```

---

## 4. AI flashcard generation with Llama (backend only for now)

The job `GenerateQuestionsFromNote` sends curriculum notes to a Llama model and stores the result as draft flashcards.
It needs an OpenAI-compatible chat completions endpoint (set `LLAMA_API_KEY`, `LLAMA_BASE_URL`, `LLAMA_MODEL`
in `.env` using your Llama provider's values) and a running queue worker:
```bash
php artisan queue:table && php artisan migrate     # if the jobs table is missing
php artisan queue:work
```
Trigger it as an admin (token from `POST /api/login`):
```bash
curl -X POST http://localhost:8000/api/admin/source-notes \
  -H "Authorization: Bearer YOUR_TOKEN" -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"class_level_id":1,"subject_id":1,"topic_id":1,"title":"Test","body":"A school is a place where children go to learn. Teachers help pupils to read and write.","goals":"Know what a school is"}'
```
Generated questions are validated (one correct answer, no duplicates, and a quoted source sentence that must really
appear in the notes) and saved as **draft**. There is no admin screen for this yet.

Manual alternative used in the demo: generate JSON in the Llama playground, then use **Import JSON** in the admin panel.
The importer accepts `question`/`stem`, `answer`/`correctAnswer`, and types `multiple_choice`, `boolean`, `text_input`.

## 5. Sync API (for connecting the pupil app next)

- `GET /api/sync/pull?since=<server_time>` returns classes, subjects, topics, approved questions changed since `since`,
  `active_question_ids` (to delete removed cards locally), `progress` and a new `server_time`.
- `POST /api/sync/push` takes `{attempts:[{uuid, question_id, correct, answered_at}]}`; duplicate UUIDs are ignored.
- Both need a Bearer token from `POST /api/login`.

`pupil-app/src/api/mapQuestion.js` converts the server's question format into the shape the screens use.

## Running the tests
```bash
php artisan test
```
(There are unit tests for the question validator. Nothing else is covered yet.)

## Common errors

| Message | Fix |
|---|---|
| 404 on `/api/login` | `routes/api.php` missing the routes, or `VITE_API_URL` doesn't end in `/api` |
| `Target class [admin] does not exist` | Register the `admin` alias in `bootstrap/app.php` |
| `Call to undefined method User::createToken()` | Add `HasApiTokens` to the `User` model |
| `Field 'source_note_id' doesn't have a default value` | Run the `make_questions_source_note_nullable` migration |
| 403 "Admins only" | The user's `role` isn't `admin` |
| Expo QR won't connect | Same Wi-Fi, or `npx expo start --tunnel` |

## How Meta technology is used

- **Meta AI** generated the first version of the React Native pupil screens.
- **Meta Llama 3.3 70B** turns curriculum material into structured flashcards (question, options, correct answer, explanation).

## Content notes

Flashcard content should be reviewed by a teacher against the official syllabus before real pupils use it.
In particular, check the first-aid cards: current first-aid guidance usually recommends cleaning wounds with clean
running water, whereas the sample cards say surgical spirit cleans a wound.
