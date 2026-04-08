const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const icongen = require("icon-gen");

const ROOT = path.join(__dirname, "..");
const SOURCE_FILE = path.join(ROOT, "assets", "branding", "dabt-logo.png");
const BUILD_DIR = path.join(ROOT, "build");
const ICONSET_DIR = path.join(BUILD_DIR, "iconset");
const PUBLIC_ICONS_DIR = path.join(ROOT, "public", "icons");

const SIZES = [16, 24, 32, 48, 64, 128, 180, 192, 256, 512, 1024];

async function ensureCleanDirectory(targetPath) {
  await fs.promises.rm(targetPath, { recursive: true, force: true });
  await fs.promises.mkdir(targetPath, { recursive: true });
}

async function generatePngSizes() {
  await ensureCleanDirectory(ICONSET_DIR);
  await fs.promises.mkdir(PUBLIC_ICONS_DIR, { recursive: true });

  for (const size of SIZES) {
    const outputPath = path.join(ICONSET_DIR, `${size}.png`);
    await sharp(SOURCE_FILE)
      .resize(size, size, {
        fit: "cover",
      })
      .png()
      .toFile(outputPath);
  }

  await fs.promises.copyFile(path.join(ICONSET_DIR, "1024.png"), path.join(BUILD_DIR, "icon.png"));
  await fs.promises.copyFile(path.join(ICONSET_DIR, "192.png"), path.join(PUBLIC_ICONS_DIR, "icon-192.png"));
  await fs.promises.copyFile(path.join(ICONSET_DIR, "512.png"), path.join(PUBLIC_ICONS_DIR, "icon-512.png"));
  await fs.promises.copyFile(path.join(ICONSET_DIR, "512.png"), path.join(PUBLIC_ICONS_DIR, "maskable-512.png"));
  await fs.promises.copyFile(path.join(ICONSET_DIR, "180.png"), path.join(PUBLIC_ICONS_DIR, "apple-touch-icon.png"));
}

async function generateAppIcons() {
  await generatePngSizes();

  await icongen(ICONSET_DIR, BUILD_DIR, {
    report: true,
    ico: {
      name: "icon",
      sizes: [16, 24, 32, 48, 64, 128, 256],
    },
    icns: {
      name: "icon",
      sizes: [16, 32, 64, 128, 256, 512, 1024],
    },
  });

  console.log("Dabt icons generated in build/.");
}

generateAppIcons().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
