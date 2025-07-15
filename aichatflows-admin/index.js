// Main app initialization function with hardened error handling
function initializeApp() {
  try {
    console.log("🟢 App starting Build 5...");
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
      
      // Don't throw polyfill errors - try to continue
      console.log("⚠️ index.js: Continuing without polyfills...");
    }
    
    // Wrap expo-router loading with enhanced error handling
    try {
      console.log("🚀 index.js: Loading expo-router...");
      require('expo-router/entry');
      console.log("✅ index.js: Expo router loaded successfully");
    } catch (routerError) {
      console.error("🔴 index.js: Critical failure loading expo-router");
      console.error("🔴 Error name:", routerError.name || 'Unknown');
      console.error("🔴 Error message:", routerError.message || 'No message');
      console.error("🔴 Has stack trace:", !!routerError.stack);
      
      // This is critical - try to show fallback UI
      try {
        const React = require('react');
        const { AppRegistry, View, Text } = require('react-native');
        
        function FallbackApp() {
          return React.createElement(View, {
            style: {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
              padding: 20
            }
          }, [
            React.createElement(Text, {
              key: 'title',
              style: {
                fontSize: 18,
                color: '#DC2626',
                textAlign: 'center',
                marginBottom: 10
              }
            }, 'Startup Error'),
            React.createElement(Text, {
              key: 'message',
              style: {
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center'
              }
            }, 'Please restart the app')
          ]);
        }
        
        AppRegistry.registerComponent('AIChatFlowsAdmin', () => FallbackApp);
        console.log("✅ index.js: Fallback UI registered");
        return; // Exit early with fallback
      } catch (fallbackError) {
        console.error("🔴 index.js: Failed to register fallback UI");
        // Last resort - throw the original error
        throw routerError;
      }
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
    
    // Final fallback - try to register a basic error app
    try {
      const { AppRegistry } = require('react-native');
      const { createElement } = require('react');
      
      AppRegistry.registerComponent('AIChatFlowsAdmin', () => () => 
        createElement('div', { style: { padding: 20 } }, 'App Error - Please restart')
      );
    } catch (finalError) {
      // Nothing more we can do
      console.error("🔴 Final fallback failed");
    }
  }
}

// Initialize the app
initializeApp();