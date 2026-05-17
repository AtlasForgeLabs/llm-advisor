import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALLOWED_INPUT_FILES,
  FORBIDDEN_INPUT_PATTERNS,
  READY_DECISIONS,
  hashFilePayload,
  hashValue,
  legacyOpenclawId,
  mapBillingUnit,
  priceContentFingerprint,
  recordsEqual,
  rejectSgd,
  isSupersededByImport,
  resolveApiId,
  resolveSubscriptionId,
  slugPart
} from './lib/openclaw-import-utils.mjs';

const root = process.cwd();
const defaultQaDir =
  '/Users/mini/AtlasForge/prod-env/atlasforge-data-hub/openclaw/llm-advisor/pre-import-qa/current';
const qaDir = process.env.OPENCLAW_QA_DIR ?? defaultQaDir;
const dryRun = process.argv.includes('--dry-run');
const HISTORY_LIMIT = 50;

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
const PRODUCT_SLUG_MAP = { chatgpt: 'chatgpt', claude: 'claude', gemini: 'gemini', doubao: 'doubao' };
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

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function loadData(name) {
  const path = join(root, 'src/data', `${name}.json`);
  return existsSync(path) ? readJson(path) : [];
}

function siteVendorSlug(slug) {
  return VENDOR_SLUG_MAP[slug] ?? slug;
}

function siteProductSlug(slug) {
  return PRODUCT_SLUG_MAP[slug] ?? slug;
}

function planSiteSlug(productSlug, planSlug) {
  const product = siteProductSlug(productSlug);
  if (product === 'chatgpt') return `chatgpt-${planSlug}`;
  if (product === 'claude') return `claude-${planSlug}`;
  return `${product}-${planSlug}`;
}

function ensureIso(value, fallback) {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed).toISOString();
}

function mapPlanType(value) {
  const map = { free: 'free', subscription: 'pro', business: 'team', team: 'team', enterprise: 'enterprise' };
  return map[value] ?? 'unknown';
}

function mapVerification(record, { metadataOnly = false, qaDecision }) {
  if (metadataOnly) {
    return { data_status: 'partial', verification_status: 'needs_review', needs_review: true };
  }
  const hasWarnings = record.needs_review || record.review_reason || record.vendor_slug === 'openai';
  if (hasWarnings || qaDecision === 'import_ready_with_warnings') {
    return {
      data_status: 'verified',
      verification_status: 'verified_with_warnings',
      needs_review: Boolean(record.needs_review)
    };
  }
  return { data_status: 'verified', verification_status: 'verified', needs_review: false };
}

function buildImportWarnings(record, metadataOnly) {
  const warnings = [];
  if (metadataOnly) warnings.push('Metadata only');
  if (record.vendor_slug === 'openai' && !metadataOnly) warnings.push('OpenAI page localized (zh-Hans-CN)');
  if (record.needs_review && record.review_reason) warnings.push(record.review_reason.slice(0, 80));
  return warnings.length ? warnings : undefined;
}

function assertImportSafety(qaDirPath) {
  if (!existsSync(qaDirPath)) {
    throw new Error(`OpenClaw QA directory not found: ${qaDirPath}`);
  }
  if (!qaDirPath.includes('pre-import-qa')) {
    throw new Error(`Import source must be pre-import-qa/current, got: ${qaDirPath}`);
  }
  for (const pattern of FORBIDDEN_INPUT_PATTERNS) {
    if (qaDirPath.includes(pattern.replace('.json', ''))) {
      throw new Error(`Forbidden import source path pattern: ${pattern}`);
    }
  }
  for (const file of ALLOWED_INPUT_FILES) {
    const full = join(qaDirPath, file);
    if (!existsSync(full)) {
      throw new Error(`Missing required QA file: ${full}`);
    }
    readJson(full);
  }
  const blocked = join(qaDirPath, 'blocked-until-review.json');
  if (existsSync(blocked)) {
    const blockedData = readJson(blocked);
    if (Array.isArray(blockedData) && blockedData.length > 0) {
      console.warn(`Note: blocked-until-review.json has ${blockedData.length} records (not imported).`);
    }
  }
}

function scanSgdInInput(subscriptionInput, apiInput, metadataInput) {
  for (const record of [...subscriptionInput, ...apiInput, ...metadataInput]) {
    if (rejectSgd(record)) {
      throw new Error(`SGD or excluded regional record in importable input: ${record.price_id ?? record.api_price_id}`);
    }
  }
}

function upsertPlan(plans, vendors, products, record, metadataOnly) {
  const vendor = vendors.find((item) => item.slug === siteVendorSlug(record.vendor_slug));
  const product = products.find((item) => item.slug === siteProductSlug(record.product_slug));
  if (!vendor || !product) throw new Error(`Missing vendor/product for plan ${record.price_id}`);

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
      `${record.plan_name} plan for ${product.name}. ${metadataOnly ? 'Metadata only.' : 'Source-backed pricing from OpenClaw QA.'}`,
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
      : ['openclaw_import', ...(verification.verification_status === 'verified_with_warnings' ? ['verified_with_warnings'] : [])],
    review_reason: metadataOnly
      ? record.review_reason ?? 'Metadata-only plan record without verified numeric price.'
      : record.review_reason ?? existing?.review_reason ?? null
  };
  if (existing) Object.assign(existing, plan);
  else plans.push(plan);
  return plan;
}

function upsertModel(models, vendors, products, providers, record) {
  const vendor = vendors.find((item) => item.slug === siteVendorSlug(record.vendor_slug));
  const provider = providers.find((item) => item.slug === PROVIDER_SLUG_MAP[record.provider_slug]);
  if (!vendor || !provider) throw new Error(`Missing vendor/provider for API ${record.api_price_id}`);

  const stableId = resolveApiId(record);
  const slug = stableId.replace(/^api-/, '');
  const product =
    products.find((item) => item.vendor_id === vendor.id && item.product_type === 'api_platform') ??
    products.find((item) => item.vendor_id === vendor.id);
  const existing = models.find(
    (item) => item.id === `model-${slug}` || item.slug === slug || item.id === `model-${stableId.replace(/^api-/, '')}`
  );
  const timestamps = {
    checked_at: ensureIso(record.source_accessed_at, existing?.checked_at),
    updated_at: ensureIso(record.normalized_at, new Date().toISOString()),
    normalized_at: ensureIso(record.normalized_at, undefined)
  };
  const model = {
    id: `model-${slug}`,
    slug,
    name: record.model_name,
    vendor_id: vendor.id,
    product_id: product?.id,
    provider_ids: [provider.id],
    description: existing?.description ?? `${record.model_name} API pricing from OpenClaw QA.`,
    model_family: record.model_name,
    modality: ['text'],
    lifecycle_status: 'active',
    context_window_tokens: null,
    source_ids: existing?.source_ids ?? [],
    created_at: existing?.created_at ?? timestamps.checked_at,
    ...timestamps,
    ...mapVerification(record, { metadataOnly: false }),
    confidence_score: record.source_confidence ?? 0.9,
    quality_flags: ['openclaw_import'],
    review_reason: record.review_reason ?? null
  };
  if (existing) Object.assign(existing, model);
  else models.push(model);
  return model;
}

function mapSubscriptionPrice(record, plans, vendors, products, { metadataOnly, qaDecision }) {
  if (rejectSgd(record)) return null;
  const stableId = resolveSubscriptionId(record, metadataOnly);
  const plan = upsertPlan(plans, vendors, products, record, metadataOnly);
  const vendor = vendors.find((item) => item.id === plan.vendor_id);
  const product = products.find((item) => item.id === plan.product_id);
  const verification = mapVerification(record, { metadataOnly, qaDecision });
  return {
    id: stableId,
    slug: stableId.replace(/^sub-/, ''),
    name: metadataOnly ? `${record.plan_name} (metadata only)` : `${record.plan_name} (${record.pricing_region})`,
    description: metadataOnly
      ? 'Plan metadata imported without a verified public numeric price.'
      : `Source-backed ${record.currency} subscription price for ${record.pricing_region} default region.`,
    vendor_id: vendor.id,
    product_id: product.id,
    plan_id: plan.id,
    currency: record.currency,
    billing_unit: mapBillingUnit(record.billing_period ?? record.price_unit, record.seat_based),
    amount: metadataOnly ? null : record.price_amount,
    notes: record.price_raw_text ?? undefined,
    pricing_region: record.pricing_region,
    region_policy: record.region_policy,
    price_raw_text: record.price_raw_text ?? undefined,
    metadata_only: metadataOnly,
    enterprise_contact_required: record.enterprise_contact_required ?? false,
    seat_based: record.seat_based ?? false,
    minimum_seats: record.minimum_seats ?? null,
    import_warnings: buildImportWarnings(record, metadataOnly),
    openclaw_price_id: legacyOpenclawId(record, 'subscription'),
    stable_price_key: stableId,
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
      ? ['metadata_only', 'openclaw_import']
      : ['openclaw_import', ...(verification.verification_status === 'verified_with_warnings' ? ['verified_with_warnings'] : [])],
    review_reason: metadataOnly
      ? record.review_reason ?? 'Metadata-only record; not a verified numeric price.'
      : record.review_reason ?? null
  };
}

function mapApiPrice(record, models, providers, vendors, products, qaDecision) {
  if (rejectSgd(record)) return null;
  const stableId = resolveApiId(record);
  const model = upsertModel(models, vendors, products, providers, record);
  const provider = providers.find((item) => item.id === model.provider_ids?.[0]);
  const verification = mapVerification(record, { metadataOnly: false, qaDecision });
  return {
    id: stableId,
    slug: stableId.replace(/^api-/, ''),
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
    openclaw_price_id: legacyOpenclawId(record, 'api'),
    stable_price_key: stableId,
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
    quality_flags: [
      'openclaw_import',
      ...(verification.verification_status === 'verified_with_warnings' ? ['verified_with_warnings'] : [])
    ],
    review_reason: record.review_reason ?? null
  };
}

function findExistingPrice(collection, stableId, legacyId) {
  return collection.find(
    (item) =>
      item.id === stableId ||
      item.stable_price_key === stableId ||
      item.openclaw_price_id === legacyId ||
      item.id === legacyId
  );
}

function mergeImportedPrices(existing, importedMap) {
  const result = [];

  for (const price of existing) {
    if (isSupersededByImport(price, importedMap)) continue;
    result.push(price);
  }

  for (const price of importedMap.values()) {
    result.push(price);
  }

  return result;
}

function detectSubscriptionChange(oldRecord, newRecord) {
  if (!oldRecord || recordsEqual(oldRecord, newRecord)) return null;
  if (oldRecord.amount === newRecord.amount) return null;
  const changeType =
    newRecord.amount == null
      ? 'packaging_change'
      : oldRecord.amount == null
        ? 'new_price'
        : newRecord.amount > oldRecord.amount
          ? 'price_increase'
          : 'price_decrease';
  return { changeType, field: 'amount', previous: oldRecord.amount, current: newRecord.amount };
}

function detectApiChange(oldRecord, newRecord) {
  if (!oldRecord || recordsEqual(oldRecord, newRecord)) return null;
  const fields = ['input_price', 'output_price', 'cached_input_price', 'request_price', 'audio_price', 'image_price'];
  const changes = fields.filter((field) => oldRecord[field] !== newRecord[field]);
  if (changes.length === 0) return null;
  return {
    changeType: 'packaging_change',
    fields: changes,
    previous: Object.fromEntries(fields.map((field) => [field, oldRecord[field]])),
    current: Object.fromEntries(fields.map((field) => [field, newRecord[field]]))
  };
}

function appendPriceChange(priceChanges, { batchId, kind, newRecord, detected, now }) {
  const id = `price-change-${newRecord.id}-${now.slice(0, 10).replace(/-/g, '')}`;
  if (priceChanges.some((item) => item.id === id)) return;

  const summary =
    kind === 'subscription'
      ? `Subscription ${newRecord.name}: ${detected.previous ?? 'n/a'} → ${detected.current ?? 'n/a'} ${newRecord.currency}`
      : `API ${newRecord.name}: ${detected.fields.join(', ')} updated`;

  priceChanges.push({
    id,
    slug: id.replace(/^price-change-/, ''),
    name: `${newRecord.name} price change`,
    description: `Detected during OpenClaw import batch ${batchId}.`,
    change_type: detected.changeType,
    impact_level: 'medium',
    summary,
    vendor_id: newRecord.vendor_id,
    product_id: newRecord.product_id ?? undefined,
    plan_id: newRecord.plan_id,
    model_id: newRecord.model_id,
    provider_id: newRecord.provider_id,
    import_batch_id: batchId,
    previous_value: detected.previous,
    current_value: detected.current,
    currency: newRecord.currency,
    billing_unit: newRecord.billing_unit,
    source_url: newRecord.source_url,
    source_accessed_at: newRecord.source_accessed_at,
    created_at: now,
    updated_at: now,
    checked_at: now,
    published_at: now,
    data_status: 'verified',
    verification_status: 'verified_with_warnings',
    confidence_score: 0.85,
    quality_flags: ['openclaw_import', 'import_detected_change'],
    needs_review: false,
    review_reason: null
  });
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
      id: `src-${slugPart(price.source_url).slice(0, 40)}`,
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

function writeMarkdownReport(path, batch) {
  const lines = [
    '# OpenClaw pricing import report',
    '',
    `- Import batch: ${batch.import_batch_id}`,
    `- Mode: ${batch.dry_run ? 'dry-run' : 'apply'}`,
    `- Decision: ${batch.import_decision}`,
    `- Started: ${batch.started_at}`,
    `- Finished: ${batch.finished_at}`,
    `- Inserted: ${batch.inserted_records_count}`,
    `- Updated: ${batch.updated_records_count}`,
    `- Unchanged: ${batch.unchanged_records_count}`,
    `- Skipped: ${batch.skipped_records_count}`,
    `- Input hash: ${batch.input_hash}`,
    `- Data hash before: ${batch.data_hash_before}`,
    `- Data hash after: ${batch.data_hash_after}`,
    ''
  ];
  writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
}

function appendHistory(reportDir, summary) {
  const historyPath = join(reportDir, 'openclaw-pricing-import-history.json');
  const history = existsSync(historyPath) ? readJson(historyPath) : { imports: [] };
  history.imports = [summary, ...(history.imports ?? [])].slice(0, HISTORY_LIMIT);
  if (!dryRun) writeJson(historyPath, history);
  return history;
}

function runImport() {
  const startedAt = new Date().toISOString();
  const importBatchId = `import-${startedAt.replace(/[:.]/g, '-').slice(0, 19)}Z`;

  assertImportSafety(qaDir);

  const qaSummary = readJson(join(qaDir, 'qa-summary.json'));
  const qaIssues = readJson(join(qaDir, 'qa-issues.json'));
  const runState = existsSync(join(qaDir, 'run-state.json')) ? readJson(join(qaDir, 'run-state.json')) : {};
  if (!READY_DECISIONS.has(qaSummary.import_decision)) {
    throw new Error(`Import blocked: import_decision=${qaSummary.import_decision}`);
  }

  const subscriptionInput = readJson(join(qaDir, 'importable-normalized-subscription-prices.json'));
  const apiInput = readJson(join(qaDir, 'importable-normalized-api-prices.json'));
  const metadataInput = readJson(join(qaDir, 'metadata-only-records.json'));
  scanSgdInInput(subscriptionInput, apiInput, metadataInput);

  const inputHash = hashFilePayload({
    subscriptionInput,
    apiInput,
    metadataInput,
    qaSummary,
    import_decision: qaSummary.import_decision
  });

  const vendors = loadData('vendors');
  const products = loadData('products');
  const plans = loadData('plans');
  const models = loadData('models');
  const providers = loadData('providers');
  const sources = loadData('sources');
  const existingSubscriptions = loadData('subscription-prices');
  const existingApi = loadData('api-prices');
  let priceChanges = loadData('price-changes').filter((item) => item.id !== 'price-change-foundation-pending');

  const dataHashBefore = hashValue({
    subscription: existingSubscriptions.map((item) => priceContentFingerprint(item)),
    api: existingApi.map((item) => priceContentFingerprint(item))
  });

  const importedSubscriptionMap = new Map();
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  const processPrice = (record, kind, metadataOnly = false) => {
    const mapped =
      kind === 'subscription'
        ? mapSubscriptionPrice(record, plans, vendors, products, {
            metadataOnly,
            qaDecision: qaSummary.import_decision
          })
        : mapApiPrice(record, models, providers, vendors, products, qaSummary.import_decision);
    if (!mapped) {
      skipped += 1;
      return;
    }

    const collection = kind === 'subscription' ? existingSubscriptions : existingApi;
    const map = kind === 'subscription' ? importedSubscriptionMap : importedApiMap;
    const legacyId = legacyOpenclawId(record, kind);
    const existing = findExistingPrice(collection, mapped.id, legacyId);

    if (existing && recordsEqual(existing, mapped)) {
      if (!existing.stable_price_key) existing.stable_price_key = mapped.id;
      if (!existing.openclaw_price_id) existing.openclaw_price_id = legacyId;
      map.set(mapped.id, existing);
      unchanged += 1;
      return;
    }

    if (existing) {
      const detected =
        kind === 'subscription'
          ? detectSubscriptionChange(existing, mapped)
          : detectApiChange(existing, mapped);
      if (detected) {
        appendPriceChange(priceChanges, {
          batchId: importBatchId,
          kind,
          newRecord: mapped,
          detected,
          now: startedAt
        });
      }
      map.set(mapped.id, { ...mapped, created_at: existing.created_at ?? mapped.created_at });
      updated += 1;
      return;
    }

    map.set(mapped.id, mapped);
    inserted += 1;
  };

  const importedApiMap = new Map();

  for (const record of subscriptionInput) processPrice(record, 'subscription', false);
  for (const record of metadataInput) processPrice(record, 'subscription', true);
  for (const record of apiInput) processPrice(record, 'api', false);

  const subscriptionPrices = mergeImportedPrices(existingSubscriptions, importedSubscriptionMap);
  const apiPrices = mergeImportedPrices(existingApi, importedApiMap);

  const dataHashAfter = hashValue({
    subscription: subscriptionPrices.map((item) => priceContentFingerprint(item)),
    api: apiPrices.map((item) => priceContentFingerprint(item))
  });

  const batch = {
    import_batch_id: importBatchId,
    project_slug: 'llm-advisor',
    source_directory: qaDir,
    qa_summary_path: join(qaDir, 'qa-summary.json'),
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    import_decision: qaSummary.import_decision,
    source_qa_run_id: runState.run_id ?? qaSummary.qa_run_finished_at ?? null,
    imported_subscription_prices_count: subscriptionInput.length,
    imported_api_prices_count: apiInput.length,
    metadata_only_count: metadataInput.length,
    inserted_records_count: inserted,
    updated_records_count: updated,
    unchanged_records_count: unchanged,
    skipped_records_count: skipped,
    warnings_count: (qaIssues?.warnings ?? qaSummary.warnings_count ?? 0) || 0,
    errors_count: qaSummary.errors_count ?? 0,
    input_hash: inputHash,
    data_hash_before: dataHashBefore,
    data_hash_after: dataHashAfter,
    data_unchanged: dataHashBefore === dataHashAfter,
    dry_run: dryRun,
    notes: [
      'Upsert by stable deterministic price IDs.',
      'Non-import pending records and prior OpenClaw rows absent from input are retained.',
      'International default US/USD; China default CN/CNY; SGD excluded.'
    ]
  };

  const reportDir = join(root, 'reports');
  mkdirSync(reportDir, { recursive: true });
  const report = {
    ...batch,
    subscription_price_ids: [...importedSubscriptionMap.keys()],
    api_price_ids: [...importedApiMap.keys()],
    price_change_ids: priceChanges.map((item) => item.id)
  };

  writeJson(join(reportDir, 'openclaw-pricing-import-report.json'), report);
  writeMarkdownReport(join(reportDir, 'openclaw-pricing-import-report.md'), batch);
  appendHistory(reportDir, {
    import_batch_id: importBatchId,
    finished_at: batch.finished_at,
    import_decision: batch.import_decision,
    inserted_records_count: inserted,
    updated_records_count: updated,
    unchanged_records_count: unchanged,
    data_unchanged: batch.data_unchanged,
    dry_run: dryRun
  });

  if (!dryRun) {
    updateSources(sources, [...subscriptionPrices, ...apiPrices]);
    writeJson(join(root, 'src/data/plans.json'), plans);
    writeJson(join(root, 'src/data/models.json'), models);
    writeJson(join(root, 'src/data/subscription-prices.json'), subscriptionPrices);
    writeJson(join(root, 'src/data/api-prices.json'), apiPrices);
    writeJson(join(root, 'src/data/sources.json'), sources);
    writeJson(join(root, 'src/data/price-changes.json'), priceChanges);
    writeJson(join(root, 'src/data/pricing-import-manifest.json'), {
      imported_at: batch.finished_at,
      qa_import_decision: batch.import_decision,
      import_status: 'verified_with_warnings',
      subscription_imported_count: subscriptionInput.length,
      api_imported_count: apiInput.length,
      metadata_only_count: metadataInput.length,
      last_import_batch_id: importBatchId,
      input_hash: inputHash,
      qa_warnings: [
        'OpenAI pricing page was localized to Chinese but USD amounts were verified.',
        'DeepSeek and ByteDance may need deeper scroll for remaining pricing gaps.',
        'Perplexity consumer pricing remains pending.'
      ],
      source_directory: qaDir
    });
  }

  console.log(dryRun ? 'OpenClaw pricing import dry-run completed.' : 'OpenClaw pricing import completed.');
  console.log(`- Batch: ${importBatchId}`);
  console.log(`- Inserted: ${inserted}, Updated: ${updated}, Unchanged: ${unchanged}, Skipped: ${skipped}`);
  console.log(`- Data unchanged: ${batch.data_unchanged}`);
  if (dryRun) console.log('- No src/data files were modified.');
}

runImport();
