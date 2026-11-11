# QueueLess – Suggested Folder Structure

```text
queueless/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── validators/
│   │   ├── sockets/
│   │   └── app.js
│   └── package.json
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   └── *.md
│
├── .env.example
├── .gitignore
└── README.md
```

## Separation Rule
- UI code stays in `client`.
- Business rules and APIs stay in `server`.
- Database schema/seed scripts stay in `database`.
- Project documentation stays in `docs`.
