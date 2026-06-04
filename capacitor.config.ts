import type { CapacitorConfig } from "@capacitor/cli";

const liveServerUrl =
  process.env.CAPACITOR_SERVER_URL || process.env.RIFQ_CAPACITOR_LIVE_URL;

const config: CapacitorConfig = {
  appId: "com.rifq.app",
  appName: "رفق",
  webDir: "out",
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#F7F0DF",
      showSpinner: false
    }
  }
};

if (liveServerUrl) {
  config.server = {
    url: liveServerUrl,
    cleartext: liveServerUrl.startsWith("http://")
  };
}

export default config;
