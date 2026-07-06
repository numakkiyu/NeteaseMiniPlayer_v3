import type {
  NMPv3PlusExtensionManifest,
  NMPv3PlusExtensionType,
  NMPv3PlusManifestFieldSchema,
  NMPv3PlusPlugin,
  NMPv3PlusPluginPackage,
  NMPv3PlusSkin,
  NMPv3PlusSkinManifest,
} from "../types";

const extensionTypes = new Set<NMPv3PlusExtensionType>([
  "visual",
  "layout",
  "host",
  "source",
  "lyrics",
  "media",
  "cache",
  "sync",
  "utility",
]);

const schemaTypes = new Set<NMPv3PlusManifestFieldSchema["type"]>([
  "string",
  "number",
  "boolean",
  "array",
  "object",
]);

export function parseNMPv3PlusExtensionManifest(
  input: unknown,
  source = "extension manifest",
): NMPv3PlusExtensionManifest {
  const record = asRecord(input, source);
  const type = requiredString(record, "type", source);

  if (!extensionTypes.has(type as NMPv3PlusExtensionType)) {
    throw new Error(`Invalid NMPv3+ extension manifest type: ${type}`);
  }

  return {
    name: requiredString(record, "name", source),
    displayName: requiredString(record, "displayName", source),
    version: requiredString(record, "version", source),
    author: optionalString(record, "author", source),
    entry: requiredString(record, "entry", source),
    style: optionalString(record, "style", source),
    type: type as NMPv3PlusExtensionType,
    description: requiredString(record, "description", source),
    configSchema: parseConfigSchema(record.configSchema, source),
  };
}

export function parseNMPv3PlusSkinManifest(
  input: unknown,
  source = "skin manifest",
): NMPv3PlusSkinManifest {
  const record = asRecord(input, source);
  const supports = record.supports;

  if (
    !Array.isArray(supports) ||
    supports.some((item) => typeof item !== "string")
  ) {
    throw new Error(`Invalid NMPv3+ skin manifest supports: ${source}`);
  }

  return {
    name: requiredString(record, "name", source),
    displayName: requiredString(record, "displayName", source),
    version: requiredString(record, "version", source),
    author: optionalString(record, "author", source),
    supports,
    tokens: parseTokenRecord(record.tokens, source),
  };
}

export function createNMPv3PlusSkinFromManifest(
  manifestInput: unknown,
  options: {
    cssText?: string;
    className?: string;
  } = {},
): NMPv3PlusSkin {
  const manifest = parseNMPv3PlusSkinManifest(manifestInput);

  return {
    ...manifest,
    cssText: options.cssText,
    className: options.className,
  };
}

export function defineNMPv3PlusPluginPackage(input: {
  manifest: unknown;
  plugin: NMPv3PlusPlugin;
}): NMPv3PlusPluginPackage {
  const manifest = parseNMPv3PlusExtensionManifest(input.manifest);

  if (input.plugin.name !== manifest.name) {
    throw new Error(
      `NMPv3+ plugin name does not match manifest: ${input.plugin.name} !== ${manifest.name}`,
    );
  }

  if (input.plugin.version && input.plugin.version !== manifest.version) {
    throw new Error(
      `NMPv3+ plugin version does not match manifest: ${input.plugin.version} !== ${manifest.version}`,
    );
  }

  return {
    manifest,
    plugin: {
      ...input.plugin,
      version: input.plugin.version ?? manifest.version,
      manifest,
    },
  };
}

function parseConfigSchema(
  value: unknown,
  source: string,
): Record<string, NMPv3PlusManifestFieldSchema> | undefined {
  if (value == null) {
    return undefined;
  }

  const schema = asRecord(value, `${source}.configSchema`);
  const parsed: Record<string, NMPv3PlusManifestFieldSchema> = {};

  for (const [key, rawField] of Object.entries(schema)) {
    const field = asRecord(rawField, `${source}.configSchema.${key}`);
    const type = requiredString(field, "type", `${source}.configSchema.${key}`);

    if (!schemaTypes.has(type as NMPv3PlusManifestFieldSchema["type"])) {
      throw new Error(`Invalid NMPv3+ manifest schema field type: ${type}`);
    }

    const enumValues = field.enum;
    if (
      enumValues != null &&
      (!Array.isArray(enumValues) ||
        enumValues.some(
          (item) => !["string", "number", "boolean"].includes(typeof item),
        ))
    ) {
      throw new Error(`Invalid NMPv3+ manifest schema enum: ${key}`);
    }

    parsed[key] = {
      type: type as NMPv3PlusManifestFieldSchema["type"],
      enum: enumValues as NMPv3PlusManifestFieldSchema["enum"],
      default: field.default,
      description: optionalString(
        field,
        "description",
        `${source}.configSchema.${key}`,
      ),
    };
  }

  return parsed;
}

function parseTokenRecord(
  value: unknown,
  source: string,
): Record<string, string> {
  const record = asRecord(value, `${source}.tokens`);
  const tokens: Record<string, string> = {};

  for (const [key, tokenValue] of Object.entries(record)) {
    if (typeof tokenValue !== "string") {
      throw new Error(`Invalid NMPv3+ skin token value: ${key}`);
    }

    tokens[key] = tokenValue;
  }

  return tokens;
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  source: string,
): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing NMPv3+ manifest string field: ${source}.${key}`);
  }

  return value;
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
  source: string,
): string | undefined {
  const value = record[key];

  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid NMPv3+ manifest string field: ${source}.${key}`);
  }

  return value;
}

function asRecord(value: unknown, source: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid NMPv3+ manifest object: ${source}`);
  }

  return value as Record<string, unknown>;
}
