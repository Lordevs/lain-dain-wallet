package com.laindain.wallet;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Lock WebView text zoom at 100% so Android's system font-size preference
        // doesn't scale the app UI. Without this, phones set to "Large" font show
        // everything ~130% bigger than designed.
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebSettings settings = getBridge().getWebView().getSettings();
                settings.setTextZoom(100);
            }
        }, 100);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply on resume in case the user changes font size while app is backgrounded
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setTextZoom(100);
        }
    }
}
