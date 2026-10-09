import { decodeUtf8, isSha256Hex } from "./bytes.ts";

export class FormatError extends Error {
  override readonly name = "FormatError";
}

export type JsonObject = { readonly [key: string]: unknown };

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export function parseJsonBytes(bytes: Uint8Array, what: string): unknown {
  try {
    return JSON.parse(decodeUtf8(bytes)) as unknown;
  } catch (error) {
    throw new FormatError(`${what} is not valid UTF-8 JSON: ${(error as Error).message}`);
  }
}

export function asObject(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new FormatError(`${path} must be an object`);
  }
  return value as JsonObject;
}

export function asString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new FormatError(`${path} must be a string`);
  }
  return value;
}

export function asInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new FormatError(`${path} must be an integer`);
  }
  return value;
}

export function asArray<T>(value: unknown, path: string, item: (element: unknown, path: string) => T): T[] {
  if (!Array.isArray(value)) {
    throw new FormatError(`${path} must be an array`);
  }
  return value.map((element: unknown, index) => item(element, `${path}[${index}]`));
}

export function field(source: JsonObject, key: string, path: string): unknown {
  if (!Object.hasOwn(source, key) || source[key] === undefined) {
    throw new FormatError(`${path}.${key} is required`);
  }
  return source[key];
}

export function optionalField(source: JsonObject, key: string): unknown {
  return Object.hasOwn(source, key) && source[key] !== null ? source[key] : undefined;
}

export function readString(source: JsonObject, key: string, path: string): string {
  return asString(field(source, key, path), `${path}.${key}`);
}

export function readOptionalString(source: JsonObject, key: string, path: string): string | undefined {
  const value = optionalField(source, key);
  return value === undefined ? undefined : asString(value, `${path}.${key}`);
}

export function readInteger(source: JsonObject, key: string, path: string): number {
  return asInteger(field(source, key, path), `${path}.${key}`);
}

export function readNonNegative(source: JsonObject, key: string, path: string): number {
  const value = readInteger(source, key, path);
  if (value < 0) {
    throw new FormatError(`${path}.${key} must not be negative`);
  }
  return value;
}

export function readOptionalInteger(source: JsonObject, key: string, path: string): number | undefined {
  const value = optionalField(source, key);
  return value === undefined ? undefined : asInteger(value, `${path}.${key}`);
}

export function readBoolean(source: JsonObject, key: string, path: string): boolean {
  const value = field(source, key, path);
  if (typeof value !== "boolean") {
    throw new FormatError(`${path}.${key} must be a boolean`);
  }
  return value;
}

export function readObject(source: JsonObject, key: string, path: string): JsonObject {
  return asObject(field(source, key, path), `${path}.${key}`);
}

export function readOptionalObject(source: JsonObject, key: string, path: string): JsonObject | undefined {
  const value = optionalField(source, key);
  return value === undefined ? undefined : asObject(value, `${path}.${key}`);
}

export function readArray<T>(
  source: JsonObject,
  key: string,
  path: string,
  item: (element: unknown, path: string) => T,
): T[] {
  return asArray(field(source, key, path), `${path}.${key}`, item);
}

export function readOptionalArray<T>(
  source: JsonObject,
  key: string,
  path: string,
  item: (element: unknown, path: string) => T,
): T[] {
  const value = optionalField(source, key);
  return value === undefined ? [] : asArray(value, `${path}.${key}`, item);
}

export function readStringArray(source: JsonObject, key: string, path: string): string[] {
  return readOptionalArray(source, key, path, asString);
}

export function readEnum<T extends string>(source: JsonObject, key: string, path: string, allowed: readonly T[]): T {
  const value = readString(source, key, path);
  if (!(allowed as readonly string[]).includes(value)) {
    throw new FormatError(`${path}.${key} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

export function readTime(source: JsonObject, key: string, path: string): string {
  const value = readString(source, key, path);
  if (!isTime(value)) {
    throw new FormatError(`${path}.${key} must be an ISO 8601 UTC time with second precision`);
  }
  return value;
}

export function readOptionalTime(source: JsonObject, key: string, path: string): string | undefined {
  return optionalField(source, key) === undefined ? undefined : readTime(source, key, path);
}

export function readSha256(source: JsonObject, key: string, path: string): string {
  const value = readString(source, key, path);
  if (!isSha256Hex(value)) {
    throw new FormatError(`${path}.${key} must be a lowercase hex SHA-256`);
  }
  return value;
}

export function isTime(value: string): boolean {
  return TIME.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
}
