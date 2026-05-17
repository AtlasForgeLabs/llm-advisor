import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const dataFiles = [
  'vendors',
  'products',
  'plans',
  'models',
  'providers',
  'api-prices',
  'subscription-prices',
  'comparisons',
  'use-cases',
  'price-changes',
  'sources'
];

const trustPages = [
  'src/pages/about.astro',
  'src/pages/contact.astro',
  'src/pages/privacy.astro',
  'src/pages/terms.astro',
  'src/pages/methodology.astro',
  'src/pages/editorial-policy.astro',
  'src/pages/disclaimer.astro'
];

const routeFiles = [
  'src/pages/vendors/index.astro',
  'src/pages/vendors/[vendor].astro',
  'src/pages/products/index.astro',
  'src/pages/products/[product].astro',
  'src/pages/plans/index.astro',
  'src/pages/plans/[plan].astro',
  'src/pages/models/index.astro',
  'src/pages/models/[model].astro',
  'src/pages/api-pricing/index.astro',
  'src/pages/api-pricing/[provider].astro',
  'src/pages/compare/index.astro',
  'src/pages/compare/[comparison].astro',
  'src/pages/use-cases/index.astro',
  'src/pages/use-cases/[useCase].astro',
  'src/pages/price-radar/index.astro',
  'src/pages/calculators/ai-api-cost.astro',
  'src/pages/calculators/ai-subscription-cost.astro',
  'src/pages/calculators/ai-team-cost.astro'
];

const failures = [];
const data = {};

function readJson(fileName) {
  const filePath = join(root, 'src/data', `${fileName}.json`);
  if (!existsSync(filePath)) {
    failures.push(`Missing data file: src/data/${fileName}.json`);
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!Array.isArray(parsed)) {
      failures.push(`Data file must contain an array: src/data/${fileName}.json`);
      return [];
    }
    return parsed;
  } catch (error) {
    failures.push(`Invalid JSON in src/data/${fileName}.json: ${error.message}`);
    return [];
  }
}

function isValidIso(value) {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

function walk(value, visitor, path = '') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    visitor(value, path);
    for (const [key, child] of Object.entries(value)) {
      walk(child, visitor, path ? `${path}.${key}` : key);
    }
  }
}

function uniqueBy(collection, field, label) {
  const seen = new Set();
  for (const item of collection) {
    if (!item[field]) {
      failures.push(`${label} missing ${field}: ${JSON.stringify(item).slice(0, 120)}`);
      continue;
    }
    if (seen.has(item[field])) {
      failures.push(`${label} has duplicate ${field}: ${item[field]}`);
    }
    seen.add(item[field]);
  }
  return seen;
}

for (const name of dataFiles) {
  data[name] = readJson(name);
}

const vendorIds = uniqueBy(data.vendors, 'id', 'vendors');
uniqueBy(data.vendors, 'slug', 'vendors');
const productIds = uniqueBy(data.products, 'id', 'products');
uniqueBy(data.products, 'slug', 'products');
const planIds = uniqueBy(data.plans, 'id', 'plans');
uniqueBy(data.plans, 'slug', 'plans');
const modelIds = uniqueBy(data.models, 'id', 'models');
uniqueBy(data.models, 'slug', 'models');
const providerIds = uniqueBy(data.providers, 'id', 'providers');
uniqueBy(data.providers, 'slug', 'providers');
uniqueBy(data.comparisons, 'id', 'comparisons');
uniqueBy(data.comparisons, 'slug', 'comparisons');
uniqueBy(data['use-cases'], 'id', 'use-cases');
uniqueBy(data['use-cases'], 'slug', 'use-cases');
const sourceIds = uniqueBy(data.sources, 'id', 'sources');

for (const product of data.products) {
  if (!vendorIds.has(product.vendor_id)) failures.push(`Product ${product.id} references missing vendor_id ${product.vendor_id}`);
}

for (const plan of data.plans) {
  if (!productIds.has(plan.product_id)) failures.push(`Plan ${plan.id} references missing product_id ${plan.product_id}`);
  if (!vendorIds.has(plan.vendor_id)) failures.push(`Plan ${plan.id} references missing vendor_id ${plan.vendor_id}`);
}

for (const model of data.models) {
  if (!vendorIds.has(model.vendor_id)) failures.push(`Model ${model.id} references missing vendor_id ${model.vendor_id}`);
}

for (const provider of data.providers) {
  if (!vendorIds.has(provider.vendor_id)) failures.push(`Provider ${provider.id} references missing vendor_id ${provider.vendor_id}`);
}

for (const price of data['api-prices']) {
  if (!providerIds.has(price.provider_id)) failures.push(`API price ${price.id} references missing provider_id ${price.provider_id}`);
  if (price.model_id && !modelIds.has(price.model_id)) failures.push(`API price ${price.id} references missing model_id ${price.model_id}`);
}

for (const price of data['subscription-prices']) {
  if (!planIds.has(price.plan_id)) failures.push(`Subscription price ${price.id} references missing plan_id ${price.plan_id}`);
  if (!productIds.has(price.product_id)) failures.push(`Subscription price ${price.id} references missing product_id ${price.product_id}`);
}

for (const comparison of data.comparisons) {
  for (const productId of comparison.product_ids ?? []) {
    if (!productIds.has(productId)) failures.push(`Comparison ${comparison.id} references missing product_id ${productId}`);
  }
}

for (const useCase of data['use-cases']) {
  for (const productId of useCase.relevant_product_ids ?? []) {
    if (!productIds.has(productId)) failures.push(`Use case ${useCase.id} references missing product_id ${productId}`);
  }
}

for (const change of data['price-changes']) {
  if (change.vendor_id && !vendorIds.has(change.vendor_id)) failures.push(`Price change ${change.id} references missing vendor_id ${change.vendor_id}`);
  if (change.product_id && !productIds.has(change.product_id)) failures.push(`Price change ${change.id} references missing product_id ${change.product_id}`);
}

for (const [fileName, records] of Object.entries(data)) {
  records.forEach((record, index) => {
    const label = `${fileName}[${index}]`;
    for (const [key, value] of Object.entries(record)) {
      if (key.endsWith('_at') && value !== null && value !== undefined && !isValidIso(value)) {
        failures.push(`${label}.${key} must be ISO string, found ${value}`);
      }
    }
    for (const sourceId of record.source_ids ?? []) {
      if (!sourceIds.has(sourceId)) failures.push(`${label} references missing source_id ${sourceId}`);
    }
  });

  walk(records, (node, path) => {
    const hasNumericPrice = ['amount', 'price', 'unit_price', 'input_price', 'output_price'].some(
      (key) => typeof node[key] === 'number'
    );
    if (hasNumericPrice && (!node.source_url || !node.source_accessed_at)) {
      failures.push(`${fileName}.${path} has numeric pricing without source_url and source_accessed_at`);
    }
  });
}

for (const page of [...trustPages, ...routeFiles]) {
  const fullPath = join(root, page);
  if (!existsSync(fullPath)) {
    failures.push(`Missing page: ${page}`);
    continue;
  }
  const text = readFileSync(fullPath, 'utf8').trim();
  if (text.length < 80) failures.push(`Page appears empty: ${page}`);
  if (/TODO\s*$/i.test(text)) failures.push(`Page appears TODO-only: ${page}`);
}

if (failures.length > 0) {
  console.error('Data validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Data validation passed.');
