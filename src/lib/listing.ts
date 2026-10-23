import { formatEuros } from './format';
import type { ListingKind } from '../types';

export const listingBadge = (kind: ListingKind | null | undefined) =>
  kind === 'sale' ? 'À vendre' : kind === 'exchange' ? 'À échanger' : null;

export const listingPrice = (kind: ListingKind | null | undefined, price: number | null | undefined) =>
  kind === 'sale' ? (price !== null && price !== undefined ? formatEuros(Number(price)) : 'Prix sur demande')
    : kind === 'exchange' ? 'Échange' : null;

export const statusKind = (status: string | null | undefined): ListingKind | null =>
  status === 'for_sale' ? 'sale' : status === 'for_exchange' ? 'exchange' : null;
