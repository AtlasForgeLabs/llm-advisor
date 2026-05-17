import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const defaultQaDir =
  '/Users/mini/AtlasForge/prod-env/atlasforge-data-hub/openclaw/llm-advisor/pre-import-qa/current';
const qaDir = process.env.OPENCLAW_QA_DIR ?? defaultQaDir;

const READY_DECISIONS = new Set(['import_ready', 'import_ready_with_warnings']);
const VENDOR_SLUG_MAP = {
  openai: 'openai',
  anthropic: 'anthropic',
  google: 'google',
  microsoft: 'microsoft',
  perplexity: 'perplexity',
  openrouter: 'openrouter',
  deepseek: 'deepseek',
  moonshot: 'moonshot-kimi',
  minimax: 'minimax',
  alibaba: 'alibaba-qwen-tongyi',
  bytedance: 'bytedance-doubao',
  zhipu: 'zhipu-glm',
  xiaomi: 'xiaomi-mimo'
};
const PRODUCT_SLUG_MAP = {
  chatgpt: 'chatgpt',
  claude: 'claude',
  gemini: 'gemini',
  doubao: 'doubao'
};
const PROVIDER_SLUG_MAP = {
  openai: 'openai-api',
  anthropic: 'anthropic-api',
  google: 'google-ai-studio',
  openrouter: 'openrouter',
  deepseek: 'deepseek-api',
  moonshot: 'moonshot-platform',
  alibaba: 'alibaba-model-studio',
  bytedance: 'volcengine-doubao',
  zhipu: 'bigmodel'
};

const OPENAI_LANGUAGE_WARNING =
  'OpenAI pricing page was localized to Chinese but USD amounts were verified on the official page.';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function loadData(name) {
  return readJson(join(root, 'src/data', `${name}.json`));
}

function siteVendorSlug(openclawVendorSlug) {
  return VENDOR_SLUG_MAP[openclawVendorSlug] ?? openclawVendorSlug;
}

function siteProductSlug(openclawProductSlug) {
  return PRODUCT_SLUG_MAP[openclawProductSlug] ?? openclawProductSlug;
}

function planSiteSlug(productSlug, planSlug) {
  const product = siteProductSlug(productSlug);
  if (product === 'chatgpt') return `chatgpt-${planSlug}`;
  if (product === 'claude') return `claude-${planSlug}`;
  return `${product}-${planSlug}`;
}

function mapBillingUnit(value, seatBased) {
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

function mapPlanType(value) {
  const map = {
    free: 'free',
    subscription: 'pro',
    business: 'team',
    team: 'team',
    enterprise: 'enterprise',
    developer: 'developer'
  };
  return map[value] ?? 'unknown';
}

function mapVerification(record, { metadataOnly = false, qaDecision }) {
  if (metadataOnly) {
    return {
      data_status: 'partial',
      verification_status: 'needs_review',
      needs_review: true
    };
  }
  const hasWarnings =
    record.needs_review ||
    record.review_reason ||
    (record.vendor_slug === 'openai' && record.pricing_region === 'US');
  if (hasWarnings || qaDecision === 'import_ready_with_warnings') {
    return {
      data_status: 'verified',
      verification_status: 'verified_with_warnings',
      needs_review: Boolean(record.needs_review)
    };
  }
  return {
    data_status: 'verified',
    verification_status: 'verified',
    needs_review: false
  };
}

function buildImportWarnings(record, metadataOnly) {
  const warnings = [];
  if (metadataOnly) warnings.push('Metadata only');
  if (record.vendor_slug === 'openai' && !metadataOnly) {
    warnings.push('OpenAI page localized (zh-Hans-CN)');
  }
  if (record.needs_review && record.review_reason) {
    warnings.push(record.review_reason.slice(0, 80));
  }
  return warnings.length ? warnings : undefined;
}

function rejectSgd(record) {
  if (record.currency === 'SGD') return true;
  if (record.pricing_region === 'SG') return true;
  if (record.excluded_from_default) return true;
  return false;
}

function ensureIso(value, fallback) {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed).toISOString();
}

function upsertPlan(plans, vendors, products, record, metadataOnly) {
  const vendor = vendors.find((item) => item.slug === siteVendorSlug(record.vendor_slug));
  const product = products.find((item) => item.slug === siteProductSlug(record.product_slug));
  if (!vendor || !product) {
    throw new Error(`Missing vendor/product for plan ${record.price_id}`);
  }

  const slug = planSiteSlug(record.product_slug, record.plan_slug);
  const id = `plan-${slug}`;
  const existing = plans.find((item) => item.id === id || item.slug === slug);
  const timestamps = {
    checked_at: ensureIso(record.source_accessed_at, existing?.checked_at),
    updated_at: ensureIso(record.normalized_at, new Date().toISOString()),
    normalized_at: ensureIso(record.normalized_at, undefined)
  };
  const verification = mapVerification(record, { metadataOnly });

  const plan = {
    id,
    slug,
    name: record.plan_name,
    vendor_id: vendor.id,
    product_id: product.id,
    description:
      existing?.description ??
      `${record.plan_name} plan for ${product.name}. ${metadataOnly ? 'Metadata only; numeric price not verified.' : 'Source-backed pricing imported from OpenClaw QA.'}`,
    plan_type: mapPlanType(record.plan_type),
    lifecycle_status: 'active',
    billing_units: [mapBillingUnit(record.billing_period ?? record.price_unit, record.seat_based)],
    features: existing?.features ?? [],
    source_ids: existing?.source_ids ?? [],
    created_at: existing?.created_at ?? timestamps.checked_at,
    ...timestamps,
    ...verification,
    confidence_score: record.source_confidence ?? 0.9,
    quality_flags: metadataOnly
      ? ['metadata_only', 'pricing_not_verified']
      : verification.verification_status === 'verified_with_warnings'
        ? ['openclaw_import', 'verified_with_warnings']
        : ['openclaw_import'],
    review_reason: metadataOnly
      ? record.review_reason ?? 'Metadata-only plan record without verified numeric price.'
      : record.review_reason ?? existing?.review_reason ?? null
  };

  if (existing) {
    Object.assign(existing, plan);
    return existing;
  }

  plans.push(plan);
  return plan;
}

function upsertModel(models, vendors, products, providers, record) {
  const vendor = vendors.find((item) => item.slug === siteVendorSlug(record.vendor_slug));
  const provider = providers.find((item) => item.slug === PROVIDER_SLUG_MAP[record.provider_slug]);
  if (!vendor || !provider) {
    throw new Error(`Missing vendor/provider for API price ${record.api_price_id}`);
  }

  const modelSlugPart =
    record.model_slug ||
    record.api_price_id?.replace(/^api-[^-]+-/, '') ||
    record.api_price_id?.replace(/^api-/, '') ||
    'platform-service';
  const slug = `${siteVendorSlug(record.vendor_slug)}-${modelSlugPart}`.replace(/[^a-z0-9-]/gi, '-');
  const id = `model-${slug}`;
  const product =
    products.find((item) => item.vendor_id === vendor.id && item.product_type === 'api_platform') ??
    products.find((item) => item.vendor_id === vendor.id);
  const existing = models.find((item) => item.id === id || item.slug === slug);
  const timestamps = {
    checked_at: ensureIso(record.source_accessed_at, existing?.checked_at),
    updated_at: ensureIso(record.normalized_at, new Date().toISOString()),
    normalized_at: ensureIso(record.normalized_at, undefined)
  };
  const verification = mapVerification(record, { metadataOnly: false });

  const model = {
    id,
    slug,
    name: record.model_name,
    vendor_id: vendor.id,
    product_id: product?.id,
    provider_ids: [provider.id],
    description:
      existing?.description ??
      `${record.model_name} API pricing imported from OpenClaw QA with official source attribution.`,
    model_family: record.model_name,
    modality: ['text'],
    lifecycle_status: 'active',
    context_window_tokens: null,
    source_ids: existing?.source_ids ?? [],
    created_at: existing?.created_at ?? timestamps.checked_at,
    ...timestamps,
    ...verification,
    confidence_score: record.source_confidence ?? 0.9,
    quality_flags: ['openclaw_import'],
    review_reason: record.review_reason ?? null
  };

  if (existing) {
    Object.assign(existing, model);
    return existing;
  }

  models.push(model);
  return model;
}

function mapSubscriptionPrice(record, plans, vendors, products, { metadataOnly, qaDecision }) {
  if (rejectSgd(record)) return null;

  const plan = upsertPlan(plans, vendors, products, record, metadataOnly);
  const vendor = vendors.find((item) => item.id === plan.vendor_id);
  const product = products.find((item) => item.id === plan.product_id);
  const verification = mapVerification(record, { metadataOnly, qaDecision });
  const amount = metadataOnly ? null : record.price_amount;
  const usdNote =
    record.usd_reference_price && record.currency === 'CNY'
      ? `USD reference only: ${record.usd_reference_currency ?? 'USD'} ${record.usd_reference_price}${record.usd_reference_note ? ` (${record.usd_reference_note})` : ''}`
      : record.usd_reference_note ?? undefined;

  return {
    id: record.price_id,
    slug: record.price_id.replace(/^sub-/, ''),
    name: metadataOnly ? `${record.plan_name} (metadata only)` : `${record.plan_name} (${record.pricing_region})`,
    description: metadataOnly
      ? 'Plan metadata imported without a verified public numeric price.'
      : `Source-backed ${record.currency} subscription price for ${record.pricing_region} default region.`,
    vendor_id: vendor.id,
    product_id: product.id,
    plan_id: plan.id,
    currency: record.currency,
    billing_unit: mapBillingUnit(record.billing_period ?? record.price_unit, record.seat_based),
    amount,
    notes: record.price_raw_text ?? record.pricing_notes ?? undefined,
    pricing_region: record.pricing_region,
    region_policy: record.region_policy,
    price_raw_text: record.price_raw_text ?? undefined,
    metadata_only: metadataOnly,
    enterprise_contact_required: record.enterprise_contact_required ?? false,
    seat_based: record.seat_based ?? false,
    minimum_seats: record.minimum_seats ?? null,
    import_warnings: buildImportWarnings(record, metadataOnly),
    openclaw_price_id: record.price_id,
    usd_reference_note: usdNote,
    source_url: record.source_url,
    source_name: `${record.plan_name} official pricing`,
    source_type: 'official_pricing_page',
    source_official: true,
    source_accessed_at: ensureIso(record.source_accessed_at, undefined),
    source_confidence: record.source_confidence,
    source_notes: record.fetch_region_hint ?? undefined,
    final_source_url: record.final_url ?? undefined,
    normalized_at: ensureIso(record.normalized_at, undefined),
    checked_at: ensureIso(record.source_accessed_at, undefined),
    updated_at: ensureIso(record.normalized_at, new Date().toISOString()),
    created_at: ensureIso(record.extracted_at, ensureIso(record.source_accessed_at, new Date().toISOString())),
    ...verification,
    confidence_score: record.source_confidence ?? 0.85,
    quality_flags: metadataOnly
      ? ['metadata_only']
      : ['openclaw_import', ...(verification.verification_status === 'verified_with_warnings' ? ['verified_with_warnings'] : [])],
    review_reason: metadataOnly
      ? record.review_reason ?? 'Metadata-only record; not a verified numeric price.'
      : record.review_reason ?? null
  };
}

function mapApiPrice(record, models, providers, vendors, products, qaDecision) {
  if (rejectSgd(record)) return null;

  const model = upsertModel(models, vendors, products, providers, record);
  const provider = providers.find((item) => item.id === model.provider_ids?.[0]);
  const verification = mapVerification(record, { metadataOnly: false, qaDecision });
  const usdNote =
    record.usd_reference_input_price && record.currency === 'CNY'
      ? `USD reference only (not official price): input ${record.usd_reference_input_price}, output ${record.usd_reference_output_price}`
      : record.usd_reference_note ?? undefined;

  return {
    id: record.api_price_id,
    slug: record.api_price_id.replace(/^api-/, ''),
    name: record.model_name,
    description: `Source-backed API pricing for ${record.model_name} (${record.pricing_region}).`,
    provider_id: provider.id,
    model_id: model.id,
    currency: record.currency,
    billing_unit: mapBillingUnit(record.billing_unit, false),
    input_price: record.input_price,
    output_price: record.output_price,
    cached_input_price: record.cached_input_price,
    request_price: record.request_price,
    audio_price: record.audio_price,
    image_price: record.image_price,
    notes: record.pricing_notes ?? record.price_raw_text ?? undefined,
    pricing_region: record.pricing_region,
    region_policy: record.region_policy,
    price_raw_text: record.price_raw_text ?? undefined,
    metadata_only: false,
    import_warnings: buildImportWarnings(record, false),
    openclaw_price_id: record.api_price_id,
    usd_reference_note: usdNote,
    source_url: record.source_url,
    source_name: `${record.model_name} official API pricing`,
    source_type: 'official_pricing_page',
    source_official: true,
    source_accessed_at: ensureIso(record.source_accessed_at, undefined),
    source_confidence: record.source_confidence,
    source_notes: record.fetch_region_hint ?? undefined,
    final_source_url: record.final_url ?? undefined,
    normalized_at: ensureIso(record.normalized_at, undefined),
    checked_at: ensureIso(record.source_accessed_at, undefined),
    updated_at: ensureIso(record.normalized_at, new Date().toISOString()),
    created_at: ensureIso(record.extracted_at, ensureIso(record.source_accessed_at, new Date().toISOString())),
    ...verification,
    confidence_score: record.source_confidence ?? 0.9,
    quality_flags: ['openclaw_import'],
    review_reason: record.review_reason ?? null
  };
}

function updateSources(sources, prices) {
  for (const price of prices) {
    if (!price?.source_url) continue;
    const existing = sources.find((item) => item.source_url === price.source_url);
    if (existing) {
      existing.source_accessed_at = price.source_accessed_at ?? existing.source_accessed_at;
      existing.checked_at = price.checked_at ?? existing.checked_at;
      continue;
    }
    sources.push({
      id: `src-import-${price.slug}`,
      source_url: price.source_url,
      source_name: price.source_name ?? 'Imported official source',
      source_type: price.source_type ?? 'official_pricing_page',
      source_official: true,
      source_accessed_at: price.source_accessed_at,
      source_confidence: price.source_confidence,
      source_notes: price.source_notes,
      checked_at: price.checked_at
    });
  }
}

function main() {
  if (!existsSync(qaDir)) {
    throw new Error(`OpenClaw QA directory not found: ${qaDir}`);
  }

  const qaSummary = readJson(join(qaDir, 'qa-summary.json'));
  if (!READY_DECISIONS.has(qaSummary.import_decision)) {
    throw new Error(`Import blocked: import_decision=${qaSummary.import_decision}`);
  }

  const subscriptionInput = readJson(join(qaDir, 'importable-normalized-subscription-prices.json'));
  const apiInput = readJson(join(qaDir, 'importable-normalized-api-prices.json'));
  const metadataInput = readJson(join(qaDir, 'metadata-only-records.json'));

  const vendors = loadData('vendors');
  const products = loadData('products');
  const plans = loadData('plans');
  const models = loadData('models');
  const providers = loadData('providers');
  const sources = loadData('sources');

  const supersededPendingPlanIds = new Set([
    'plan-chatgpt-plus',
    'plan-claude-pro',
    'plan-chatgpt-free',
    'plan-claude-free'
  ]);

  const importedSubscriptions = [
    ...subscriptionInput.map((record) =>
      mapSubscriptionPrice(record, plans, vendors, products, {
        metadataOnly: false,
        qaDecision: qaSummary.import_decision
      })
    ),
    ...metadataInput.map((record) =>
      mapSubscriptionPrice(record, plans, vendors, products, {
        metadataOnly: true,
        qaDecision: qaSummary.import_decision
      })
    )
  ].filter(Boolean);

  const importedApi = apiInput
    .map((record) => mapApiPrice(record, models, providers, vendors, products, qaSummary.import_decision))
    .filter(Boolean);

  const retainedPendingSubscriptions = loadData('subscription-prices').filter((price) => {
    if (importedSubscriptions.some((item) => item.plan_id === price.plan_id)) return false;
    if (supersededPendingPlanIds.has(price.plan_id) && importedSubscriptions.length > 0) {
      return !importedSubscriptions.some((item) => item.plan_id === price.plan_id);
    }
    return price.verification_status === 'pending_verification';
  });

  const retainedPendingApi = loadData('api-prices').filter((price) => {
    const providerIdsWithImport = new Set(importedApi.map((item) => item.provider_id));
    if (providerIdsWithImport.has(price.provider_id)) return false;
    return price.verification_status === 'pending_verification';
  });

  const subscriptionPrices = [...importedSubscriptions, ...retainedPendingSubscriptions];
  const apiPrices = [...importedApi, ...retainedPendingApi];

  updateSources(sources, [...subscriptionPrices, ...apiPrices]);

  writeJson(join(root, 'src/data/plans.json'), plans);
  writeJson(join(root, 'src/data/models.json'), models);
  writeJson(join(root, 'src/data/subscription-prices.json'), subscriptionPrices);
  writeJson(join(root, 'src/data/api-prices.json'), apiPrices);
  writeJson(join(root, 'src/data/sources.json'), sources);

  const manifest = {
    imported_at: qaSummary.qa_run_finished_at ?? new Date().toISOString(),
    qa_import_decision: qaSummary.import_decision,
    import_status: 'verified_with_warnings',
    subscription_imported_count: subscriptionInput.length,
    api_imported_count: apiInput.length,
    metadata_only_count: metadataInput.length,
    qa_warnings: [
      OPENAI_LANGUAGE_WARNING,
      'DeepSeek and ByteDance may need deeper scroll for remaining pricing gaps.',
      'Perplexity consumer pricing remains pending and was not imported.'
    ],
    source_directory: qaDir
  };
  writeJson(join(root, 'src/data/pricing-import-manifest.json'), manifest);

  const reportDir = join(root, 'reports');
  mkdirSync(reportDir, { recursive: true });
  writeJson(join(reportDir, 'openclaw-pricing-import-report.json'), {
    ...manifest,
    subscription_price_ids: importedSubscriptions.map((item) => item.id),
    api_price_ids: importedApi.map((item) => item.id),
    metadata_only_ids: metadataInput.map((item) => item.price_id),
    retained_pending_subscription_ids: retainedPendingSubscriptions.map((item) => item.id),
    retained_pending_api_ids: retainedPendingApi.map((item) => item.id)
  });

  console.log('OpenClaw pricing import completed.');
  console.log(`- Subscription prices: ${subscriptionInput.length} imported`);
  console.log(`- API prices: ${apiInput.length} imported`);
  console.log(`- Metadata-only: ${metadataInput.length} imported`);
  console.log(`- Manifest: src/data/pricing-import-manifest.json`);
}

main();
