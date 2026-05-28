import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { adminSession } from './session';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7287';

export const passkey = {
  /** Returns false if WebAuthn isn't available in this browser (very old browsers or insecure contexts). */
  isSupported(): boolean {
    return browserSupportsWebAuthn();
  },

  async getStatus(): Promise<{ hasRegisteredCredentials: boolean; username: string; displayName: string }> {
    const res = await fetch(`${BASE_URL}/api/admin/auth/status`);
    if (!res.ok) throw new Error(`Status check failed (${res.status})`);
    return res.json();
  },

  /**
   * First-time enrollment ceremony. Prompts Windows Hello / Touch ID / Face ID
   * (whatever platform authenticator is available). Throws on cancel or failure.
   */
  async register(username: string, friendlyName?: string): Promise<void> {
    const beginRes = await fetch(`${BASE_URL}/api/admin/auth/register/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!beginRes.ok) {
      const err = await beginRes.json().catch(() => null);
      throw new Error(err?.error ?? `Registration failed to start (${beginRes.status})`);
    }
    const begin = await beginRes.json();
    const { challengeToken, options } = begin;

    // The Fido2NetLib CredentialCreateOptions matches the SimpleWebAuthn shape; pass it through.
    const attestation = await startRegistration({ optionsJSON: options });

    const completeRes = await fetch(`${BASE_URL}/api/admin/auth/register/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeToken,
        attestationResponse: attestation,
        friendlyName,
      }),
    });
    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => null);
      throw new Error(err?.error ?? `Registration failed to complete (${completeRes.status})`);
    }
  },

  /**
   * Sign-in ceremony. Prompts the user's biometric, then stores the issued JWT in sessionStorage.
   */
  async login(username: string): Promise<void> {
    const beginRes = await fetch(`${BASE_URL}/api/admin/auth/login/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!beginRes.ok) {
      const err = await beginRes.json().catch(() => null);
      throw new Error(err?.error ?? `Sign-in failed to start (${beginRes.status})`);
    }
    const begin = await beginRes.json();
    const { challengeToken, options } = begin;

    const assertion = await startAuthentication({ optionsJSON: options });

    const completeRes = await fetch(`${BASE_URL}/api/admin/auth/login/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeToken,
        assertionResponse: assertion,
      }),
    });
    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => null);
      throw new Error(err?.error ?? `Sign-in failed to complete (${completeRes.status})`);
    }

    const session = await completeRes.json();
    adminSession.set({
      accessToken: session.accessToken,
      expiresAtUtc: session.expiresAtUtc,
      displayName: session.displayName,
    });
  },
};
