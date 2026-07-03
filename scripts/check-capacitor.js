import fs from 'fs';
import path from 'path';

// Load .env file variables manually into process.env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !key.startsWith('#') && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  // Ignore env loading errors
}

const configPath = path.resolve(process.cwd(), 'capacitor.config.ts');
if (!fs.existsSync(configPath)) {
  console.error('❌ Error: capacitor.config.ts not found');
  process.exit(1);
}

const content = fs.readFileSync(configPath, 'utf8');

// 1. Check if CAPACITOR_LIVE_RELOAD is set to true in the build environment
if (process.env.CAPACITOR_LIVE_RELOAD === 'true') {
  console.error('❌ Error: CAPACITOR_LIVE_RELOAD is set to "true" in the build environment.');
  console.error('Production/release builds must load static assets from the dist directory.');
  process.exit(1);
}

// 2. Extra safety: Parse the file to ensure the server URL is not hardcoded (non-gated) in the configuration object.
if (content.includes('url:') && !content.includes('process.env.CAPACITOR_LIVE_RELOAD')) {
  console.error('❌ Error: Gated URL check failed.');
  console.error('capacitor.config.ts contains a hardcoded server URL without being gated by process.env.CAPACITOR_LIVE_RELOAD.');
  process.exit(1);
}

console.log('✅ capacitor.config.ts check passed');
