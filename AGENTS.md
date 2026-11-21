# ShopLedger

## Stack

- Node.js, CommonJS modules, and Express 4 serve the application.
- `body-parser` parses JSON requests.
- The browser UI is plain HTML, CSS, and JavaScript under `public/`.
- Application data is stored in `data/db.json` and read/written by `lib/store.js`.
- There is no configured test framework or test suite in the repository today.

## Module map

- `server.js`, `config.js`: Express app setup, configuration, static files, and invoice page.
- `routes/`: API endpoints for products, orders, customers, and reports.
- `lib/`: data access and business logic for orders, inventory, pricing, tax, coupons, customer ledger, invoices, and reports.
- `public/`: browser interface (`index.html`, `css/style.css`, `js/app.js`).
- `data/db.json`: the current JSON data store.

## Commands

- `npm start` — start the server on `PORT`, or port 3000 by default.
- `npm test` — currently exits with “Error: no test specified”; no test command is configured.

## Change rules

- Write characterization tests before changing behaviour.
- Change only the module the ticket is about.
- Tests must never read from or write to `data/db.json`.
- Add no dependencies.
