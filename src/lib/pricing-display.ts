import type { ApiPrice, BillingUnit } from '@/lib/schema';

export function billingUnitLabel(unit: BillingUnit | string | undefined): string {
  const labels: Record<string, string> = {
    month: 'per month',
    year: 'per year',
    seat_month: 'per seat per month',
    one_million_tokens: 'per 1M tokens',
    one_thousand_tokens: 'per 1K tokens',
    request: 'per request',
    image: 'per image',
    minute: 'per audio minute',
    unknown: 'see official source'
  };
  return labels[unit ?? 'unknown'] ?? 'see official source';
}

function inferUsageUnitLabel(price: ApiPrice): string {
  const raw = `${price.name} ${price.price_raw_text ?? ''} ${price.notes ?? ''}`.toLowerCase();

  if (
    raw.includes('1k search') ||
    raw.includes('1,000 search') ||
    raw.includes('/ 1k ') ||
    raw.includes('1,000 次') ||
    raw.includes('/ 1,000')
  ) {
    return 'per 1K searches';
  }
  if (raw.includes('session-hour') || raw.includes('session hour')) {
    return 'per session-hour';
  }
  if (raw.includes('per hour') || raw.includes('/ hour')) {
    return 'per hour';
  }
  if (price.billing_unit === 'minute') {
    return 'per audio minute';
  }
  if (price.billing_unit === 'image') {
    return 'per image';
  }
  if (price.billing_unit === 'request') {
    return 'per request';
  }
  return billingUnitLabel(price.billing_unit);
}

export function formatPriceLine(
  amount: number | null | undefined,
  currency: string,
  unitLabel: string
): string | null {
  if (amount === null || amount === undefined) return null;
  return `${currency} ${amount} — ${unitLabel}`;
}

export function describeApiPriceUnits(price: ApiPrice) {
  const tokenUnit = billingUnitLabel(
    price.billing_unit === 'one_million_tokens' ? 'one_million_tokens' : price.billing_unit
  );
  const usageUnit = inferUsageUnitLabel(price);

  return {
    billingUnitText:
      price.billing_unit === 'one_million_tokens'
        ? 'per 1M tokens (token-based models)'
        : usageUnit,
    inputText: formatPriceLine(price.input_price, price.currency, 'input per 1M tokens'),
    outputText: formatPriceLine(price.output_price, price.currency, 'output per 1M tokens'),
    cachedInputText: formatPriceLine(
      price.cached_input_price,
      price.currency,
      'cached input per 1M tokens'
    ),
    requestText: formatPriceLine(price.request_price, price.currency, usageUnit),
    audioText: formatPriceLine(price.audio_price, price.currency, 'per audio minute'),
    imageText: formatPriceLine(price.image_price, price.currency, 'per image'),
    rawFallback:
      price.input_price == null &&
      price.output_price == null &&
      price.request_price == null &&
      price.audio_price == null &&
      price.image_price == null &&
      price.cached_input_price == null &&
      price.price_raw_text
        ? `${price.price_raw_text} (${usageUnit})`
        : null,
    tokenUnit,
    usageUnit
  };
}
