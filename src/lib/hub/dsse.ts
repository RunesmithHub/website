import { concatBytes, decodeBase64, sha256Hex, toArrayBuffer, utf8 } from "./bytes.ts";
import { FormatError, asObject, asString, parseJsonBytes, readArray, readString } from "./json.ts";
import type { RoleName, RootPayload } from "./model.ts";

export const PAYLOAD_TYPE = "application/vnd.runesmith.hub+json";

export class SignatureError extends Error {
  override readonly name = "SignatureError";
}

export interface Signature {
  readonly keyid: string;
  readonly sig: Uint8Array;
}

export interface Envelope {
  readonly payloadType: string;
  readonly payload: Uint8Array;
  readonly signatures: readonly Signature[];
}

export function preAuthenticationEncoding(type: string, body: Uint8Array): Uint8Array {
  const typeBytes = utf8(type);
  return concatBytes([utf8(`DSSEv1 ${typeBytes.length} `), typeBytes, utf8(` ${body.length} `), body]);
}

export function parseEnvelope(bytes: Uint8Array, what: string): Envelope {
  const source = asObject(parseJsonBytes(bytes, what), what);
  const payloadType = readString(source, "payloadType", what);
  if (payloadType !== PAYLOAD_TYPE) {
    throw new FormatError(`${what} has payload type "${payloadType}", expected "${PAYLOAD_TYPE}"`);
  }
  const payload = decodeBase64(readString(source, "payload", what));
  if (!payload) {
    throw new FormatError(`${what}.payload is not canonical base64`);
  }
  const signatures = readArray(source, "signatures", what, (element, path) => {
    const signature = asObject(element, path);
    const sig = decodeBase64(readString(signature, "sig", path));
    if (!sig) {
      throw new FormatError(`${path}.sig is not canonical base64`);
    }
    return { keyid: asString(signature.keyid, `${path}.keyid`), sig };
  });
  return { payloadType, payload, signatures };
}

export function envelopePayload(envelope: Envelope, what: string): unknown {
  return parseJsonBytes(envelope.payload, `${what} payload`);
}

const keyCache = new Map<string, Promise<CryptoKey>>();

async function importKey(root: RootPayload, keyid: string): Promise<CryptoKey> {
  const key = root.keys[keyid];
  if (!key) {
    throw new SignatureError(`key ${keyid} is not in the root`);
  }
  const der = decodeBase64(key.public);
  if (!der) {
    throw new FormatError(`root key ${keyid} is not canonical base64`);
  }
  if ((await sha256Hex(der)) !== keyid) {
    throw new SignatureError(`root key ${keyid} does not match its key ID`);
  }
  const cacheKey = `${keyid}:${key.public}`;
  let imported = keyCache.get(cacheKey);
  if (!imported) {
    imported = crypto.subtle.importKey("spki", toArrayBuffer(der), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    keyCache.set(cacheKey, imported);
  }
  return imported;
}

async function verifies(key: CryptoKey, signature: Uint8Array, message: Uint8Array): Promise<boolean> {
  if (signature.length !== 64) {
    return false;
  }
  return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, toArrayBuffer(signature), toArrayBuffer(message));
}

export async function countValidSignatures(envelope: Envelope, keyids: readonly string[], root: RootPayload): Promise<number> {
  const message = preAuthenticationEncoding(envelope.payloadType, envelope.payload);
  const allowed = new Set(keyids);
  const valid = new Set<string>();
  for (const signature of envelope.signatures) {
    if (!allowed.has(signature.keyid) || valid.has(signature.keyid)) {
      continue;
    }
    const key = await importKey(root, signature.keyid);
    if (await verifies(key, signature.sig, message)) {
      valid.add(signature.keyid);
    }
  }
  return valid.size;
}

export async function verifyRole(envelope: Envelope, root: RootPayload, role: RoleName, what: string): Promise<void> {
  const { keyids, threshold } = root.roles[role];
  const count = await countValidSignatures(envelope, keyids, root);
  if (count < threshold) {
    throw new SignatureError(`${what} has ${count} valid ${role} signature(s), needs ${threshold}`);
  }
}
