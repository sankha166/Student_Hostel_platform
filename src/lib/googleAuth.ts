/**
 * Google OAuth via Google Identity Services (GSI)
 * Works entirely client-side — no backend or npm package needed.
 * 
 * SETUP: Create a project at https://console.cloud.google.com/
 * 1. Enable "Google Identity" API
 * 2. Create OAuth 2.0 credentials → Web application
 * 3. Add your domain to "Authorised JavaScript origins"
 *    e.g. http://localhost:8082 and https://your-netlify-app.netlify.app
 * 4. Set VITE_GOOGLE_CLIENT_ID in .env
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google's unique user ID
}

// Decode JWT token from Google (no library needed)
function decodeJWT(token: string): GoogleUser | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as GoogleUser;
  } catch {
    return null;
  }
}

// Load Google Identity Services script
function loadGSI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).google !== "undefined") {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Sign in with Google using the One Tap / popup flow.
 * Returns decoded user info on success.
 */
export async function signInWithGoogle(role: "student" | "owner"): Promise<GoogleUser> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.\n" +
      "Get it from: https://console.cloud.google.com/"
    );
  }

  await loadGSI();

  return new Promise((resolve, reject) => {
    const google = (window as any).google;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        const user = decodeJWT(response.credential);
        if (user) {
          resolve(user);
        } else {
          reject(new Error("Failed to decode Google token"));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Use the popup flow
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fall back to rendering the button
        reject(new Error("Google One Tap was suppressed. Please use the Sign In button."));
      }
    });
  });
}

/**
 * Render the Google Sign In button in a container element.
 * This is more reliable than One Tap for some browsers.
 */
export async function renderGoogleButton(
  containerId: string,
  onSuccess: (user: GoogleUser) => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    onError(new Error("VITE_GOOGLE_CLIENT_ID not set in .env"));
    return;
  }

  try {
    await loadGSI();
    const google = (window as any).google;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        const user = decodeJWT(response.credential);
        if (user) {
          onSuccess(user);
        } else {
          onError(new Error("Failed to decode Google token"));
        }
      },
    });

    const container = document.getElementById(containerId);
    if (container) {
      google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: container.offsetWidth || 320,
        text: "continue_with",
        shape: "rectangular",
      });
    }
  } catch (err) {
    onError(err instanceof Error ? err : new Error("Google Auth failed"));
  }
}

export { GOOGLE_CLIENT_ID };
