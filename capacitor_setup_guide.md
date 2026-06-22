# Guide: Building and Running Lain Dain on Android & iOS Simulators

Since you are running on macOS and the project has Capacitor configured with the `android` and `ios` platforms already initialized, here is the complete workflow to build, sync, and run the application on mobile simulators.

---

## 🛠️ 1. Prerequisites (macOS Setup)

Before running the commands, ensure you have the required native tooling installed:

### For iOS Simulator (Xcode)
1. Install **Xcode** from the Mac App Store.
2. Open Xcode, go to **Settings > Platforms** (or Components), and download an iOS Simulator runtime (e.g., iOS 17 or 18).
3. Ensure CocoaPods is installed for managing native iOS dependencies:
   ```bash
   brew install cocoapods
   ```
4. Verify Command Line Tools are set up: **Xcode Settings > Locations > Command Line Tools** (ensure a version is selected).

### For Android Simulator (Android Studio)
1. Download and install **Android Studio**.
2. Run the setup wizard to install the **Android SDK**.
3. Open **SDK Manager** (under Settings) and install:
   - Android SDK Command-line Tools (under SDK Tools tab).
4. Go to **Device Manager** (or Virtual Device Manager) and click **Create device** to set up a phone simulator (e.g., Pixel 7 running Android 14/APIs 34+).

---

## 🚀 2. The Standard Build & Run Flow (Production Build)

Whenever you want to build the production assets and test them on the simulator, execute the following sequence:

### Step A: Compile the Web App
Build the React/Vite project to generate the production-ready assets inside the `dist` folder:
```bash
pnpm build
```

### Step B: Sync Web Assets to Native Code
Copy the `dist` assets into the iOS and Android directories, and configure native plugins:
```bash
npx cap sync
```

### Step C: Launch on Simulators
You can run the app directly using the Capacitor CLI (it will prompt you to choose an active simulator):

*   **iOS**:
    ```bash
    npx cap run ios
    ```
*   **Android**:
    ```bash
    npx cap run android
    ```

> [!TIP]
> **Using IDEs instead of CLI**:
> If you prefer debugging through Xcode or Android Studio directly, you can open the project in the respective IDEs:
> - `npx cap open ios` (Opens the project in Xcode)
> - `npx cap open android` (Opens the project in Android Studio)

---

## ⚡ 3. Recommended: Live-Reload Flow (Rapid Development)

Instead of re-running `pnpm build && npx cap sync` every time you modify a file, you can configure Capacitor to load assets dynamically from your local Vite dev server. This enables Instant HMR (Hot Module Replacement) inside the simulators.

### Step 1: Start your local Dev Server
Start the Vite dev server exposing it to the network:
```bash
pnpm dev --host
```
Note the address (typically `http://localhost:5173` or your local network IP `http://192.168.1.X:5173`).

### Step 2: Configure Live Reload URL
Modify your [capacitor.config.ts](file:///Users/saadaanhassan/Documents/Projects/lain-dain/capacitor.config.ts) temporarily:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laindain.wallet',
  appName: 'Lain Dain Wallet',
  webDir: 'dist',
  server: {
    url: 'http://localhost:5173', // Point to your active Vite dev server
    cleartext: true               // Enables loading http pages in native wrappers
  }
};

export default config;
```

### Step 3: Run the Native Sync & Deploy
Deploy the configuration change and start the native run process:
```bash
npx cap sync
npx cap run ios     # or android
```

> [!WARNING]
> **Restore Before Release**:
> Remember to delete or comment out the `server` block from [capacitor.config.ts](file:///Users/saadaanhassan/Documents/Projects/lain-dain/capacitor.config.ts) before creating release builds so that it bundles the static assets locally instead of searching for a local dev server address!
