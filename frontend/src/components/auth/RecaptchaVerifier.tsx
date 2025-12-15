/**
 * RECAPTCHA VERIFIER
 * Google reCAPTCHA v3 component for React Native
 * Uses invisible reCAPTCHA that runs in background
 */

import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { View, Modal, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

// Your reCAPTCHA site key - should be in environment variable
const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key for development

export interface RecaptchaVerifierRef {
  getToken: () => Promise<string>;
}

interface RecaptchaVerifierProps {
  onVerify?: (token: string) => void;
  onError?: (error: string) => void;
}

const RecaptchaVerifier = forwardRef<RecaptchaVerifierRef, RecaptchaVerifierProps>(
  ({ onVerify, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [showWebView, setShowWebView] = useState(false);
    const [resolveToken, setResolveToken] = useState<((token: string) => void) | null>(null);
    const [rejectToken, setRejectToken] = useState<((error: Error) => void) | null>(null);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}"></script>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: transparent;
            }
            .loading {
              color: #666;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="loading">Verifying...</div>
          <script>
            function executeRecaptcha() {
              grecaptcha.ready(function() {
                grecaptcha.execute('${RECAPTCHA_SITE_KEY}', { action: 'login' })
                  .then(function(token) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', token: token }));
                  })
                  .catch(function(error) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: error.message }));
                  });
              });
            }
            
            // Auto-execute when loaded
            if (document.readyState === 'complete') {
              executeRecaptcha();
            } else {
              window.addEventListener('load', executeRecaptcha);
            }
          </script>
        </body>
      </html>
    `;

    const getToken = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        // For web platform, use a different approach
        if (Platform.OS === 'web') {
          // On web, we'll skip reCAPTCHA for now (or implement web-specific solution)
          // In production, you'd use the actual reCAPTCHA JS library
          resolve('web-platform-token');
          return;
        }

        setResolveToken(() => resolve);
        setRejectToken(() => reject);
        setShowWebView(true);

        // Timeout after 30 seconds
        setTimeout(() => {
          setShowWebView(false);
          reject(new Error('reCAPTCHA verification timeout'));
        }, 30000);
      });
    };

    useImperativeHandle(ref, () => ({
      getToken,
    }));

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        setShowWebView(false);

        if (data.type === 'success' && data.token) {
          if (resolveToken) {
            resolveToken(data.token);
          }
          if (onVerify) {
            onVerify(data.token);
          }
        } else if (data.type === 'error') {
          const error = new Error(data.error || 'reCAPTCHA verification failed');
          if (rejectToken) {
            rejectToken(error);
          }
          if (onError) {
            onError(data.error);
          }
        }
      } catch (e) {
        console.error('reCAPTCHA message parse error:', e);
      }
    };

    if (Platform.OS === 'web') {
      // Don't render WebView on web
      return null;
    }

    return (
      <Modal
        visible={showWebView}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.container}>
          <View style={styles.webViewContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent }}
              onMessage={handleMessage}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              mixedContentMode="compatibility"
            />
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  webViewContainer: {
    width: 300,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 1,
  },
});

export default RecaptchaVerifier;
