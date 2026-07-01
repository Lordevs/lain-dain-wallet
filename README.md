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

