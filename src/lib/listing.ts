import { formatEuros } from './format';
import { tr } from '../i18n';
import { COMMON } from '../i18n/common';
import type { ListingKind } from '../types';

export const listingBadge = (kind: ListingKind | null | undefined) =>
  kind === 'sale' ? tr(COMMON).listing.forSale : kind === 'exchange' ? tr(COMMON).listing.forTrade : null;

export const listingPrice = (kind: ListingKind | null | undefined, price: number | null | undefined) =>
  kind === 'sale' ? (price !== null && price !== undefined ? formatEuros(Number(price)) : tr(COMMON).listing.priceOnRequest)
    : kind === 'exchange' ? tr(COMMON).listing.trade : null;

export const statusKind = (status: string | null | undefined): ListingKind | null =>
  status === 'for_sale' ? 'sale' : status === 'for_exchange' ? 'exchange' : null;
