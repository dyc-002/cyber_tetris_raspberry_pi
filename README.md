# Cyber Tetris — Raspberry Pi + Database + Leaderboard

## What is included
- Professional dark cyber-security Tetris UI.
- Guest mode: no user account and no score is sent to the database.
- Sign-in mode: email + username; scores are saved for the signed-in user.
- SQLite database stored locally on the Raspberry Pi.
- Leaderboard reads from the database and sorts by each player's highest score.
- Progressive difficulty: level increases every 10 cleared lines.
- One second-chance system per game.
- Second chance: 3 multiple-choice cyber-security questions, 30 seconds total, 2/3 correct required.
- Question difficulty increases with score: 0–999, 1000–1999, 2000+.

## Run on a Raspberry Pi

Install Node.js (Node 18+ recommended), then:

```bash
cd cyber-tetris
npm install
npm start
```

On the Pi, open:
http://localhost:3000

From another device on the same network, find the Pi's IP with:

```bash
hostname -I
```

Then open:
http://PI_IP_ADDRESS:3000

Example:
http://192.168.1.50:3000

## Important database note
The SQLite database is created automatically at:
`data/tetris.db`

Back it up if you want to keep the leaderboard when reinstalling the project.

## Hardware
The game is browser-based, so the Raspberry Pi can run it on a monitor/TV. A USB keyboard works immediately. For physical arcade buttons, connect buttons to GPIO and use a small GPIO-to-keyboard/controller layer; the web game itself already supports the keyboard controls.

## Production/security improvements
For a real public deployment, add:
- password authentication instead of only email/username identity,
- server-side rate limiting,
- HTTPS,
- stronger session/authentication,
- validation and anti-cheat measures,
- admin controls,
- regular database backups.
