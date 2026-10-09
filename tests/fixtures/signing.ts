import { encodeBase64, sha256Hex, toArrayBuffer, utf8 } from "../../src/lib/hub/bytes.ts";
import { PAYLOAD_TYPE, preAuthenticationEncoding } from "../../src/lib/hub/dsse.ts";

export interface FixtureKey {
  readonly keyid: string;
  readonly publicKey: string;
  readonly privateKey: CryptoKey;
  readonly pkcs8: string;
}

export async function generateKey(): Promise<FixtureKey> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  return { keyid: await sha256Hex(spki), publicKey: encodeBase64(spki), privateKey: pair.privateKey, pkcs8: encodeBase64(pkcs8) };
}

export function keyEntry(key: FixtureKey): { scheme: string; public: string } {
  return { scheme: "ecdsa-p256-sha256", public: key.publicKey };
}

export async function signEnvelope(payload: unknown, keys: readonly FixtureKey[]): Promise<Uint8Array> {
  const body = utf8(JSON.stringify(payload));
  const message = toArrayBuffer(preAuthenticationEncoding(PAYLOAD_TYPE, body));
  const signatures = [];
  for (const key of keys) {
    const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key.privateKey, message));
    signatures.push({ keyid: key.keyid, sig: encodeBase64(sig) });
  }
  return utf8(JSON.stringify({ payloadType: PAYLOAD_TYPE, payload: encodeBase64(body), signatures }, null, 2));
}

export function pem(key: FixtureKey): string {
  const lines = key.pkcs8.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
}
