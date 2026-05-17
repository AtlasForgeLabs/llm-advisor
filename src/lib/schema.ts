export type Currency = 'USD' | 'CNY' | 'EUR' | 'GBP' | 'JPY' | 'KRW' | 'UNKNOWN';

export type BillingUnit =
  | 'month'
  | 'year'
  | 'seat_month'
  | 'one_million_tokens'
  | 'one_thousand_tokens'
  | 'request'
  | 'image'
  | 'minute'
  | 'unknown';

export type DataQualityStatus = 'verified' | 'pending_verification' | 'partial' | 'stale' | 'deprecated';

export type LifecycleStatus = 'active' | 'preview' | 'beta' | 'deprecated' | 'unknown';

export type VerificationStatus =
  | 'verified'
  | 'verified_with_warnings'
  | 'pending_verification'
  | 'needs_review'
  | 'rejected';

export type PricingRegion = 'US' | 'CN' | 'EU' | 'SG' | 'GLOBAL' | 'UNKNOWN';

export type RegionPolicy =
  | 'default_international_us'
  | 'default_china_cn'
  | 'excluded_regional'
  | 'unknown';

export interface PricingImportFields {
  pricing_region?: PricingRegion;
  region_policy?: RegionPolicy;
  price_raw_text?: string;
  metadata_only?: boolean;
  enterprise_contact_required?: boolean;
  seat_based?: boolean;
  minimum_seats?: number | null;
  import_warnings?: string[];
  openclaw_price_id?: string;
  usd_reference_note?: string;
  final_source_url?: string;
}

export type RegionAvailability = {
  regions: string[];
  availability_status: 'available' | 'limited' | 'unknown' | 'unavailable';
  notes?: string;
};

export type SourceType =
  | 'official_pricing_page'
  | 'official_docs'
  | 'official_blog'
  | 'official_console'
  | 'public_announcement'
  | 'third_party'
  | 'manual_review';

export interface TimestampFields {
  created_at?: string;
  updated_at?: string;
  discovered_at?: string;
  fetched_at?: string;
  checked_at?: string;
  normalized_at?: string;
  validated_at?: string;
  generated_at?: string;
  published_at?: string;
  pricing_effective_at?: string;
  source_updated_at?: string;
}

export interface SourceFields {
  source_url?: string;
  source_name?: string;
  source_type?: SourceType;
  source_official?: boolean;
  source_accessed_at?: string;
  source_confidence?: number;
  source_notes?: string;
}

export interface QualityFields {
  data_status: DataQualityStatus;
  verification_status: VerificationStatus;
  confidence_score?: number;
  quality_flags?: string[];
  needs_review?: boolean;
  review_reason?: string;
}

export interface BaseRecord extends TimestampFields, SourceFields, QualityFields {
  id: string;
  slug: string;
  name: string;
  description?: string;
  source_ids?: string[];
}

export interface Source extends TimestampFields {
  id: string;
  source_url: string;
  source_name: string;
  source_type: SourceType;
  source_official: boolean;
  source_accessed_at?: string;
  source_confidence?: number;
  source_notes?: string;
  checked_at?: string;
}

export interface Feature {
  id: string;
  name: string;
  category: string;
  description?: string;
  data_status?: DataQualityStatus;
}

export interface Vendor extends BaseRecord {
  legal_name?: string;
  ecosystem: 'us_global' | 'china' | 'global' | 'multi_region';
  headquarters_region?: string;
  website_url?: string;
  lifecycle_status: LifecycleStatus;
  region_availability: RegionAvailability[];
  categories: string[];
}

export interface Product extends BaseRecord {
  vendor_id: string;
  product_type: 'chat_app' | 'api_platform' | 'assistant' | 'model_family' | 'router' | 'workspace_tool';
  lifecycle_status: LifecycleStatus;
  region_availability: RegionAvailability[];
  capabilities: string[];
}

export interface Plan extends BaseRecord {
  vendor_id: string;
  product_id: string;
  plan_type: 'free' | 'individual' | 'pro' | 'team' | 'enterprise' | 'developer' | 'unknown';
  lifecycle_status: LifecycleStatus;
  billing_units: BillingUnit[];
  features: Feature[];
}

export interface Model extends BaseRecord {
  vendor_id: string;
  product_id?: string;
  provider_ids?: string[];
  model_family?: string;
  modality: Array<'text' | 'vision' | 'audio' | 'image' | 'video' | 'embedding' | 'multimodal'>;
  lifecycle_status: LifecycleStatus;
  context_window_tokens?: number | null;
}

export interface Provider extends BaseRecord {
  vendor_id: string;
  provider_type: 'direct_api' | 'router' | 'cloud_platform' | 'marketplace';
  lifecycle_status: LifecycleStatus;
  region_availability: RegionAvailability[];
}

export interface ApiPrice extends BaseRecord, PricingImportFields {
  provider_id: string;
  model_id?: string;
  currency: Currency;
  billing_unit: BillingUnit;
  input_price?: number | null;
  output_price?: number | null;
  cached_input_price?: number | null;
  request_price?: number | null;
  audio_price?: number | null;
  image_price?: number | null;
  notes?: string;
}

export interface SubscriptionPrice extends BaseRecord, PricingImportFields {
  vendor_id: string;
  product_id: string;
  plan_id: string;
  currency: Currency;
  billing_unit: BillingUnit;
  amount?: number | null;
  notes?: string;
}

export interface PricingImportManifest {
  imported_at: string;
  qa_import_decision: string;
  import_status: 'verified_with_warnings' | 'verified' | 'blocked';
  subscription_imported_count: number;
  api_imported_count: number;
  metadata_only_count: number;
  qa_warnings: string[];
  source_directory: string;
}

export interface Comparison extends BaseRecord {
  comparison_type: 'product' | 'plan' | 'model' | 'provider' | 'use_case';
  product_ids?: string[];
  plan_ids?: string[];
  model_ids?: string[];
  provider_ids?: string[];
  use_case_ids?: string[];
  decision_factors: string[];
}

export interface UseCase extends BaseRecord {
  audience: string[];
  workload_type: string;
  relevant_product_ids?: string[];
  relevant_model_ids?: string[];
  decision_factors: string[];
}

export interface PriceChange extends BaseRecord {
  vendor_id?: string;
  product_id?: string;
  plan_id?: string;
  model_id?: string;
  provider_id?: string;
  change_type: 'new_price' | 'price_increase' | 'price_decrease' | 'packaging_change' | 'availability_change' | 'unknown';
  impact_level: 'low' | 'medium' | 'high' | 'unknown';
  summary: string;
}
