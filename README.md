# Cyber Tetris

Cyber Tetris is a standalone desktop game for Raspberry Pi. It opens in its own application window, works without a web browser or internet connection, and saves its local data in the current user's application-data folder.

## Raspberry Pi requirements

- Raspberry Pi 4 or newer
- 64-bit Raspberry Pi OS
- Node.js 22 or newer to build from source
- Official 7-inch Raspberry Pi Touch Display v1.1 supported at 800x480

The packaged game includes its own Chromium runtime; Node.js is only needed when building the packages from source.

## Build Raspberry Pi packages

Run these commands on the Raspberry Pi or another Linux ARM64 machine:

```bash
npm ci
npm run package:pi
```

The `dist` directory will contain an ARM64 AppImage and Debian package.

To install the Debian package:

```bash
sudo apt install ./dist/Cyber-Tetris-1.0.0-arm64.deb
```

To launch the AppImage:

```bash
chmod +x ./dist/Cyber-Tetris-1.0.0-arm64.AppImage
./dist/Cyber-Tetris-1.0.0-arm64.AppImage
```

The exact package filenames follow the version in `package.json`.

## Play

Choose **Play as Guest**, then select **Start Game**. Use A/D or the arrow keys to move, W or Up to rotate, S or Down to drop, Space to hard-drop, and P to pause. Touch controls appear on the Pi display. The live score is shown beside the board.

The app can also be started in development mode with `npm start`. Its local SQLite database is stored under the operating system's application-data folder, so it is kept separate from the installed application files.

## Development web server

The optional `npm run start:web` command serves the original browser version at `http://localhost:3000`. This is only for development; the Raspberry Pi game package does not require a browser or a web server to be started manually.
