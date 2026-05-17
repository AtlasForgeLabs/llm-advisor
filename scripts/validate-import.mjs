import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isOpenclawManaged } from './lib/openclaw-import-utils.mjs';

const root = process.cwd();
const failures = [];

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadData(name) {
  return readJson(join(root, 'src/data', `${name}.json`)) ?? [];
}

function assertUniqueIds(records, label) {
  const ids = new Set();
  for (const record of records) {
    if (ids.has(record.id)) failures.push(`${label} duplicate id: ${record.id}`);
    ids.add(record.id);
  }
}

function logicalSubscriptionKey(record) {
  return [
    record.vendor_id,
    record.product_id,
    record.plan_id,
    record.pricing_region,
    record.currency,
    record.billing_unit,
    record.metadata_only ? 'meta' : 'price'
  ].join('|');
}

function logicalApiKey(record) {
  return [
    record.provider_id,
    record.model_id,
    record.pricing_region,
    record.currency,
    record.billing_unit
  ].join('|');
}

function checkLogicalDuplicates(records, keyFn, label) {
  const map = new Map();
  for (const record of records) {
    const key = keyFn(record);
    const prior = map.get(key);
    if (prior && prior.id !== record.id) {
      failures.push(
        `${label} logical duplicate: ${prior.id} and ${record.id} share key ${key}`
      );
    }
    map.set(key, record);
  }
}

function validatePrices(records, kind) {
  for (const price of records) {
    if (price.currency === 'SGD' || price.pricing_region === 'SG') {
      failures.push(`${kind} ${price.id} must not use SGD or SG region`);
    }
    if (price.metadata_only && price.verification_status === 'verified') {
      failures.push(`${kind} ${price.id} metadata-only cannot be verified`);
    }
    if (
      isOpenclawManaged(price) &&
      !price.metadata_only &&
      (price.input_price != null || price.output_price != null || price.amount != null || price.amount === 0)
    ) {
      if (!price.source_url || !price.source_accessed_at) {
        failures.push(`${kind} ${price.id} missing source_url or source_accessed_at`);
      }
      if (!price.pricing_region || !price.currency) {
        failures.push(`${kind} ${price.id} missing pricing_region or currency`);
      }
    }
    if (price.metadata_only && price.amount != null && !price.enterprise_contact_required) {
      failures.push(`${kind} ${price.id} metadata-only must not have verified numeric amount`);
    }
  }
}

const subscriptions = loadData('subscription-prices');
const apiPrices = loadData('api-prices');
const plans = loadData('plans');
const models = loadData('models');
const sources = loadData('sources');
const priceChanges = loadData('price-changes');

assertUniqueIds(subscriptions, 'subscription-prices');
assertUniqueIds(apiPrices, 'api-prices');
assertUniqueIds(plans, 'plans');
assertUniqueIds(models, 'models');
assertUniqueIds(sources, 'sources');
assertUniqueIds(priceChanges, 'price-changes');

checkLogicalDuplicates(subscriptions, logicalSubscriptionKey, 'subscription-prices');
checkLogicalDuplicates(apiPrices, logicalApiKey, 'api-prices');

validatePrices(subscriptions, 'subscription');
validatePrices(apiPrices, 'api');

const reportPath = join(root, 'reports/openclaw-pricing-import-report.json');
if (!existsSync(reportPath)) {
  failures.push('Missing reports/openclaw-pricing-import-report.json (run import first)');
} else {
  const report = readJson(reportPath);
  if (!report.import_batch_id) failures.push('Import report missing import_batch_id');
  if (typeof report.inserted_records_count !== 'number') {
    failures.push('Import report missing inserted_records_count');
  }
}

const historyPath = join(root, 'reports/openclaw-pricing-import-history.json');
if (existsSync(historyPath)) {
  const history = readJson(historyPath);
  if (!Array.isArray(history.imports)) {
    failures.push('Import history must contain imports array');
  } else if (history.imports.length > 50) {
    failures.push(`Import history exceeds 50 entries: ${history.imports.length}`);
  }
}

if (failures.length > 0) {
  console.error('Import validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Import validation passed.');
