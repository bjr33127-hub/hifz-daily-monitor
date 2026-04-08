const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE_FILE = path.join(ROOT, "assets", "branding", "dabt-logo.png");
const ANDROID_RES_DIR = path.join(ROOT, "android", "app", "src", "main", "res");

const BRAND_COLORS = {
  launchBackground: { r: 245, g: 240, b: 228, alpha: 1 },
};

const LAUNCHER_SPECS = [
  { dir: "mipmap-mdpi", icon: 48, foreground: 108 },
  { dir: "mipmap-hdpi", icon: 72, foreground: 162 },
  { dir: "mipmap-xhdpi", icon: 96, foreground: 216 },
  { dir: "mipmap-xxhdpi", icon: 144, foreground: 324 },
  { dir: "mipmap-xxxhdpi", icon: 192, foreground: 432 },
];

const SPLASH_SPECS = [
  { dir: "drawable", width: 480, height: 320 },
  { dir: "drawable-land-mdpi", width: 480, height: 320 },
  { dir: "drawable-land-hdpi", width: 800, height: 480 },
  { dir: "drawable-land-xhdpi", width: 1280, height: 720 },
  { dir: "drawable-land-xxhdpi", width: 1600, height: 960 },
  { dir: "drawable-land-xxxhdpi", width: 1920, height: 1280 },
  { dir: "drawable-port-mdpi", width: 320, height: 480 },
  { dir: "drawable-port-hdpi", width: 480, height: 800 },
  { dir: "drawable-port-xhdpi", width: 720, height: 1280 },
  { dir: "drawable-port-xxhdpi", width: 960, height: 1600 },
  { dir: "drawable-port-xxxhdpi", width: 1280, height: 1920 },
];

async function pathExists(targetPath) {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch (_error) {
    return false;
  }
}

async function ensureDirectory(targetPath) {
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
}

async function buildLauncherIcon(size, outputPath) {
  await ensureDirectory(outputPath);
  await sharp(SOURCE_FILE)
    .resize(size, size, {
      fit: "cover",
    })
    .png()
    .toFile(outputPath);
}

async function buildAdaptiveForeground(size, outputPath) {
  const logoSize = Math.round(size * 0.78);
  const offset = Math.round((size - logoSize) / 2);
  const logoBuffer = await sharp(SOURCE_FILE)
    .resize(logoSize, logoSize, {
      fit: "cover",
    })
    .png()
    .toBuffer();

  await ensureDirectory(outputPath);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: logoBuffer,
        left: offset,
        top: offset,
      },
    ])
    .png()
    .toFile(outputPath);
}

async function buildSplash(width, height, outputPath) {
  const minSide = Math.min(width, height);
  const logoSize = Math.round(minSide * (width > height ? 0.36 : 0.4));
  const logoBuffer = await sharp(SOURCE_FILE)
    .resize(logoSize, logoSize, {
      fit: "cover",
    })
    .png()
    .toBuffer();

  const left = Math.round((width - logoSize) / 2);
  const top = Math.round((height - logoSize) / 2);

  await ensureDirectory(outputPath);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BRAND_COLORS.launchBackground,
    },
  })
    .composite([
      {
        input: logoBuffer,
        left,
        top,
      },
    ])
    .png()
    .toFile(outputPath);
}

async function generateAndroidAssets() {
  if (!(await pathExists(SOURCE_FILE))) {
    throw new Error(`Android asset source not found: ${SOURCE_FILE}`);
  }

  if (!(await pathExists(ANDROID_RES_DIR))) {
    console.log("Android project not found yet, skipping native asset generation.");
    return;
  }

  for (const spec of LAUNCHER_SPECS) {
    const targetDir = path.join(ANDROID_RES_DIR, spec.dir);
    await buildLauncherIcon(spec.icon, path.join(targetDir, "ic_launcher.png"));
    await buildLauncherIcon(spec.icon, path.join(targetDir, "ic_launcher_round.png"));
    await buildAdaptiveForeground(spec.foreground, path.join(targetDir, "ic_launcher_foreground.png"));
  }

  for (const spec of SPLASH_SPECS) {
    await buildSplash(spec.width, spec.height, path.join(ANDROID_RES_DIR, spec.dir, "splash.png"));
  }

  console.log("Android launcher and splash assets generated.");
}

generateAndroidAssets().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
