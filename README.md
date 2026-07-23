# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

---

## 📱 Mobile Development with Capacitor

This project uses **Capacitor** to run as a native mobile application on iOS and Android.

### Prerequisites
1. **Java Runtime (JDK 17+)**: Required for Android builds.
2. **Android Studio**: Required for compiling Android APKs/AABs and managing Android Emulators.
3. **Xcode (macOS only)**: Required for compiling iOS IPAs and running the iOS Simulator.
4. **Cocoapods**: Required for iOS plugin dependencies (`sudo gem install cocoapods` or `brew install cocoapods`).

---

### ⚡ Running the App with Live Reload (Fast Development)
To see code changes instantly on your device or simulator without rebuilds:

1. **Get your Local IP Address**:
   Find your Mac's local network IP address (e.g., `192.168.1.50`). Make sure your phone and Mac are connected to the same Wi-Fi network.

2. **Configure `capacitor.config.ts`**:
   Uncomment or update the `server` block to point to your IP address and port `5173`:
   ```typescript
   server: {
     url: 'http://<YOUR_LOCAL_IP>:5173', // e.g. 'http://192.168.1.50:5173'
     cleartext: true
   }
   ```

3. **Start the Development Server**:
   Run the dev server exposing it to the network:
   ```bash
   pnpm dev --host
   ```

4. **Sync and Run on Mobile**:
   Sync the configuration and run on your target platform:
   
   **For Android:**
   ```bash
   npx cap sync android
   npx cap run android
   ```
   **For iOS:**
   ```bash
   npx cap sync ios
   npx cap run ios
   ```

---

### 📶 Testing on a Physical Android Device over Wi-Fi (Wireless Debugging)

No USB cable needed — pairs over Wi-Fi via `adb`. Do this once per phone/network; steps 1–3 only need repeating if the phone reboots or leaves the network.

1. **Same Wi-Fi.** Confirm the phone and Mac are on the same network. Get your Mac's LAN IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. **Pair the phone** (first time only, or after it's been "forgotten"):
   On the phone: **Settings → Developer options → Wireless debugging → Pair device with pairing code**. It shows an IP:port and a 6-digit code.
   ```bash
   adb pair <ip>:<pairing-port>
   # enter the 6-digit code when prompted
   ```

3. **Connect the phone** — back on the main "Wireless debugging" screen (not the pairing one), it shows a second IP:port.
   ```bash
   adb connect <ip>:<connect-port>
   adb devices   # should list the phone as "device"
   ```

4. **Point the app at your Mac, not "localhost."** On the phone, `localhost` means the phone itself — update both `.env` files to use your Mac's LAN IP from step 1:
   - `lain-dain-backend/.env` → add your IP to `ALLOWED_HOSTS` (e.g. `ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.21`)
   - `lain-dain/.env` → `VITE_API_BASE_URL=http://<your-mac-ip>:8000`
   - `lain-dain/.env` → `CAPACITOR_DEV_SERVER_URL=http://<your-mac-ip>:5173` (should already be set)

5. **Start both dev servers bound to all interfaces**, not just localhost:
   ```bash
   # backend
   uv run python manage.py runserver 0.0.0.0:8000

   # frontend — use `npx vite --host` directly, NOT `pnpm run dev -- --host`:
   # pnpm forwards that as a literal "-- --host" to vite, which silently
   # fails to bind on all interfaces (only binds to localhost).
   npx vite --host
   ```

6. **Sync and launch:**
   ```bash
   npx cap sync android
   npx cap run android --target=<device-ip>:<connect-port>   # from step 3
   ```
   This installs the debug APK and launches it pointed at your live Vite dev server — edits hot-reload without a rebuild.

If the app shows "Web page not available" / `ERR_CONNECTION_REFUSED`, it's almost always step 5's host binding — check with `lsof -iTCP:5173 -sTCP:LISTEN` that the process is listening on `*:5173`, not `localhost:5173`.

---

### 📦 Running the App Without Live Reload (Static Assets)
To test how the application behaves when fully offline or bundled statically:

1. **Disable `server.url` in `capacitor.config.ts`**:
   Make sure to comment out or delete the `server` block in `capacitor.config.ts`:
   ```typescript
   // server: {
   //   url: 'http://...',
   //   cleartext: true
   // }
   ```

2. **Build and Sync Assets**:
   Compile the web assets and copy them into the native directories:
   ```bash
   pnpm run build
   npx cap sync
   ```

3. **Run on Mobile**:
   ```bash
   # Android
   npx cap run android
   
   # iOS
   npx cap run ios
   ```

---

### 🛠️ Creating Standalone Installers (APKs & IPAs)

#### 🟢 For Android (APK / AAB)
1. Ensure the `server` block in `capacitor.config.ts` is commented out.
2. Build the web assets and sync:
   ```bash
   pnpm run build
   npx cap sync android
   ```
3. Generate the APK:
   * **Via Command Line:**
     ```bash
     cd android && ./gradlew assembleDebug && cd ..
     ```
     Your APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.
   * **Via Android Studio:**
     ```bash
     npx cap open android
     ```
     Inside Android Studio, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.

#### 🍎 For iOS (IPA)
1. Ensure the `server` block in `capacitor.config.ts` is commented out.
2. Build the web assets and sync:
   ```bash
   pnpm run build
   npx cap sync ios
   ```
3. Compile and Export:
   * **Via Xcode (Recommended for signing):**
     ```bash
     npx cap open ios
     ```
     * In Xcode, select **Product** > **Scheme** > **App**.
     * Select destination as **Any iOS Device (arm64)**.
     * Select **Product** > **Archive**.
     * When completed, click **Distribute App** in the Organizer window to export your `.ipa`.

