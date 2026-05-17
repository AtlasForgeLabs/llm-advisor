import { createHash } from 'node:crypto';

export const READY_DECISIONS = new Set(['import_ready', 'import_ready_with_warnings']);

export const ALLOWED_INPUT_FILES = [
  'importable-normalized-subscription-prices.json',
  'importable-normalized-api-prices.json',
  'metadata-only-records.json',
  'qa-summary.json',
  'qa-issues.json',
  'run-state.json'
];

export const FORBIDDEN_INPUT_PATTERNS = [
  'blocked-until-review.json',
  'normalized-subscription-prices.json',
  'normalized-api-prices.json',
  'regional-pricing-normalization'
];

export function slugPart(value) {
  return String(value ?? 'none')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export function hashValue(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

export function hashFilePayload(payload) {
  return hashValue(payload);
}

const VOLATILE_PRICE_FIELDS = new Set([
  'updated_at',
  'checked_at',
  'created_at',
  'normalized_at',
  'validated_at',
  'generated_at'
]);

export function priceContentFingerprint(price) {
  const copy = { ...price };
  for (const field of VOLATILE_PRICE_FIELDS) {
    delete copy[field];
  }
  for (const key of Object.keys(copy)) {
    if (copy[key] === undefined) delete copy[key];
  }
  if (Array.isArray(copy.quality_flags)) {
    copy.quality_flags = [...copy.quality_flags].sort();
  }
  if (Array.isArray(copy.import_warnings)) {
    copy.import_warnings = [...copy.import_warnings].sort();
  }
  return hashValue(copy);
}

export function recordsEqual(a, b) {
  return priceContentFingerprint(a) === priceContentFingerprint(b);
}

export function rejectSgd(record) {
  if (record.currency === 'SGD') return true;
  if (record.pricing_region === 'SG') return true;
  if (record.excluded_from_default) return true;
  return false;
}

export function isOpenclawManaged(record) {
  return Array.isArray(record.quality_flags) && record.quality_flags.includes('openclaw_import');
}

export function mapBillingUnit(value, seatBased) {
  if (seatBased || value === 'per_seat_month') return 'seat_month';
  if (value === 'monthly' || value === 'per_month') return 'month';
  if (value === 'yearly' || value === 'per_year') return 'year';
  if (value === 'per_1m_tokens') return 'one_million_tokens';
  if (value === 'per_1k_tokens') return 'one_thousand_tokens';
  if (value === 'per_request') return 'request';
  if (value === 'per_image') return 'image';
  if (value === 'per_audio_minute') return 'minute';
  return 'unknown';
}

export function stableSubscriptionId(record, metadataOnly) {
  const billing = mapBillingUnit(record.billing_period ?? record.price_unit, record.seat_based);
  return [
    'sub',
    slugPart(record.vendor_slug),
    slugPart(record.product_slug),
    slugPart(record.plan_slug),
    slugPart(record.pricing_region),
    slugPart(record.currency),
    slugPart(billing),
    metadataOnly ? 'meta' : 'price'
  ].join('-');
}

export function stableApiId(record) {
  const modelPart =
    record.model_slug ||
    record.api_price_id?.replace(/^api-[^-]+-/, '') ||
    slugPart(record.model_name) ||
    'platform-service';
  return [
    'api',
    slugPart(record.vendor_slug),
    slugPart(record.provider_slug),
    slugPart(modelPart),
    slugPart(record.billing_unit),
    slugPart(record.pricing_region),
    slugPart(record.currency)
  ].join('-');
}

export function legacyOpenclawId(record, kind) {
  return kind === 'subscription' ? record.price_id : record.api_price_id;
}

/** Prefer OpenClaw legacy IDs when present; otherwise derive from stable fields. */
export function resolveSubscriptionId(record, metadataOnly) {
  const legacy = legacyOpenclawId(record, 'subscription');
  if (legacy && /^sub-[a-z0-9-]+$/.test(legacy)) return legacy;
  return stableSubscriptionId(record, metadataOnly);
}

export function resolveApiId(record) {
  const legacy = legacyOpenclawId(record, 'api');
  if (legacy && /^api-[a-z0-9-]+$/.test(legacy)) return legacy;
  return stableApiId(record);
}

export function isSupersededByImport(price, importedMap) {
  for (const imported of importedMap.values()) {
    if (price.id === imported.id) return true;
    if (price.stable_price_key && price.stable_price_key === imported.stable_price_key) return true;
    if (price.openclaw_price_id && price.openclaw_price_id === imported.openclaw_price_id) return true;
    if (
      isOpenclawManaged(price) &&
      isOpenclawManaged(imported) &&
      price.plan_id &&
      price.plan_id === imported.plan_id &&
      Boolean(price.metadata_only) === Boolean(imported.metadata_only)
    ) {
      return true;
    }
    if (
      isOpenclawManaged(price) &&
      isOpenclawManaged(imported) &&
      price.provider_id === imported.provider_id &&
      price.model_id &&
      price.model_id === imported.model_id
    ) {
      return true;
    }
  }
  return false;
}
