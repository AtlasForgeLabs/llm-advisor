import vendors from '@/data/vendors.json';
import products from '@/data/products.json';
import plans from '@/data/plans.json';
import models from '@/data/models.json';
import providers from '@/data/providers.json';
import apiPrices from '@/data/api-prices.json';
import subscriptionPrices from '@/data/subscription-prices.json';
import comparisons from '@/data/comparisons.json';
import useCases from '@/data/use-cases.json';
import priceChanges from '@/data/price-changes.json';
import sources from '@/data/sources.json';
import pricingImportManifest from '@/data/pricing-import-manifest.json';
import type {
  ApiPrice,
  Comparison,
  Model,
  Plan,
  PriceChange,
  PricingImportManifest,
  Product,
  Provider,
  Source,
  SubscriptionPrice,
  UseCase,
  Vendor
} from './schema';

const typedVendors = vendors as Vendor[];
const typedProducts = products as Product[];
const typedPlans = plans as Plan[];
const typedModels = models as Model[];
const typedProviders = providers as Provider[];
const typedApiPrices = apiPrices as ApiPrice[];
const typedSubscriptionPrices = subscriptionPrices as SubscriptionPrice[];
const typedComparisons = comparisons as Comparison[];
const typedUseCases = useCases as UseCase[];
const typedPriceChanges = priceChanges as unknown as PriceChange[];
const typedSources = sources as Source[];

function bySlug<T extends { slug: string }>(records: T[], slug: string): T | undefined {
  return records.find((record) => record.slug === slug);
}

function latestTimestamp(records: Array<Record<string, unknown>>, fields: string[]) {
  const timestamps = records
    .flatMap((record) => fields.map((field) => record[field]))
    .filter((value): value is string => typeof value === 'string')
    .sort();

  return timestamps.at(-1) ?? null;
}

export function getVendors() {
  return typedVendors;
}

export function getVendorBySlug(slug: string) {
  return bySlug(typedVendors, slug);
}

export function getProducts() {
  return typedProducts;
}

export function getProductBySlug(slug: string) {
  return bySlug(typedProducts, slug);
}

export function getPlans() {
  return typedPlans;
}

export function getPlanBySlug(slug: string) {
  return bySlug(typedPlans, slug);
}

export function getModels() {
  return typedModels;
}

export function getModelBySlug(slug: string) {
  return bySlug(typedModels, slug);
}

export function getProviders() {
  return typedProviders;
}

export function getProviderBySlug(slug: string) {
  return bySlug(typedProviders, slug);
}

export function getPlansByProduct(productId: string) {
  return typedPlans.filter((plan) => plan.product_id === productId);
}

export function getModelsByVendor(vendorId: string) {
  return typedModels.filter((model) => model.vendor_id === vendorId);
}

export function getApiPricesByProvider(providerId: string) {
  return typedApiPrices.filter((price) => price.provider_id === providerId);
}

export function getSubscriptionPricesByPlan(planId: string) {
  return typedSubscriptionPrices.filter((price) => price.plan_id === planId);
}

export function getComparisons() {
  return typedComparisons;
}

export function getComparisonBySlug(slug: string) {
  return bySlug(typedComparisons, slug);
}

export function getUseCases() {
  return typedUseCases;
}

export function getUseCaseBySlug(slug: string) {
  return bySlug(typedUseCases, slug);
}

export function getPriceChanges() {
  return typedPriceChanges;
}

export function getSources() {
  return typedSources;
}

export function getSourcesByIds(sourceIds: string[] = []) {
  return sourceIds
    .map((id) => typedSources.find((source) => source.id === id))
    .filter((source): source is Source => Boolean(source));
}

export function getPricingImportManifest() {
  return pricingImportManifest as PricingImportManifest;
}

export function getDataFreshnessSummary() {
  const allRecords = [
    ...typedVendors,
    ...typedProducts,
    ...typedPlans,
    ...typedModels,
    ...typedProviders,
    ...typedApiPrices,
    ...typedSubscriptionPrices,
    ...typedComparisons,
    ...typedUseCases,
    ...typedPriceChanges
  ] as unknown as Array<Record<string, unknown>>;

  return {
    record_count: allRecords.length,
    source_count: typedSources.length,
    latest_checked_at: latestTimestamp(allRecords, ['checked_at', 'validated_at']),
    latest_updated_at: latestTimestamp(allRecords, ['updated_at', 'normalized_at']),
    pending_verification_count: allRecords.filter(
      (record) => record.verification_status === 'pending_verification'
    ).length,
    verified_count: allRecords.filter((record) => record.verification_status === 'verified').length
  };
}
