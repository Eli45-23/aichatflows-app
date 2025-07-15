// Global error handler for early crashes
try {
  console.log("🟢 App starting...");
  console.log("🔧 index.js: Loading app entry point");
  
  // Wrap polyfill loading in try/catch
  try {
    console.log("📦 index.js: Loading polyfills...");
    require('./src/lib/polyfills');
    console.log("✅ index.js: Polyfills loaded successfully");
  } catch (polyfillError) {
    console.error("🔴 index.js: Failed to load polyfills");
    console.error("🔴 Error name:", polyfillError.name || 'Unknown');
    console.error("🔴 Error message:", polyfillError.message || 'No message');
    console.error("🔴 Has stack trace:", !!polyfillError.stack);
    throw polyfillError;
  }
  
  // Wrap expo-router loading in try/catch
  try {
    console.log("🚀 index.js: Loading expo-router...");
    require('expo-router/entry');
    console.log("✅ index.js: Expo router loaded successfully");
  } catch (routerError) {
    console.error("🔴 index.js: Failed to load expo-router");
    console.error("🔴 Error name:", routerError.name || 'Unknown');
    console.error("🔴 Error message:", routerError.message || 'No message');
    console.error("🔴 Has stack trace:", !!routerError.stack);
    throw routerError;
  }
  
  console.log("🟢 App started successfully");
} catch (globalError) {
  // Safe logging to prevent TurboModule crashes
  try {
    console.error("🔴 Global startup error occurred");
    console.error("🔴 Error type:", globalError.constructor?.name || 'Unknown');
    console.error("🔴 Error message:", globalError.message || 'No message');
    console.error("🔴 Has stack trace:", !!globalError.stack);
  } catch (logError) {
    // Fallback if even simple logging fails
    console.error("🔴 Global startup error logging failed");
  }
  
  // Try to show an alert if possible
  try {
    if (global.alert && globalError.message) {
      global.alert(`App Startup Error: ${globalError.message}`);
    }
  } catch (alertError) {
    // Silent fallback - don't try to log alert errors
  }
}