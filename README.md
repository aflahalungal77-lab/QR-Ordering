# QR Food Ordering MVP

A simple restaurant QR ordering MVP.

## Stack

- Node.js
- Express
- HTML
- CSS
- Vanilla JavaScript
- In-memory data (no database)

## Run

1. Install Node.js.
2. Open this folder in terminal.
3. Run:

```bash
npm install
npm start
```

4. Open:

http://localhost:3000

## Customer

Use the Customer screen, select a table, add food and place an order.

## Kitchen

Click Kitchen to see orders and change their status.

## QR test

A real QR code can point to a URL such as:

http://localhost:3000/?table=12

For the next version, the app should read `table=12` automatically and remove the manual table input.

## Important

This is an MVP/demo. Orders are stored only in server memory, so they disappear when the server restarts.
