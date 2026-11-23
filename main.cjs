const { app, BrowserWindow } = require("electron");
const path = require("node:path");

let server;

async function startGameServer() {
  process.env.CYBER_TETRIS_DATA_DIR = path.join(app.getPath("userData"), "data");
  process.env.HOST = "127.0.0.1";
  process.env.PORT = "0";

  server = require("./server.js");

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", resolve);
  });

  return `http://127.0.0.1:${server.address().port}`;
}

async function createWindow() {
  const gameUrl = await startGameServer();
  const window = new BrowserWindow({
    width: 800,
    height: 480,
    minWidth: 720,
    minHeight: 450,
    autoHideMenuBar: true,
    backgroundColor: "#070a0d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  await window.loadURL(`${gameUrl}/?desktop=1`);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error("Unable to start Cyber Tetris:", error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});
