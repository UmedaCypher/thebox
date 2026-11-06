import { useEffect, useId, useState } from 'react';
import { TextField } from '../ui';
import { defineStrings, useStrings } from '../../i18n';
import { closeBrand, loadBrands, loadModels, officialBrand } from '../../lib/brands';
import s from './BrandModelFields.module.css';

const S = defineStrings({
  brand: 'Marque',
  model: 'Modèle',
  didYouMean: 'Vouliez-vous dire',
  newBrand: 'Marque absente de notre liste : vérifiez l’orthographe, elle sera ajoutée après vérification.',
}, {
  brand: 'Brand',
  model: 'Model',
  didYouMean: 'Did you mean',
  newBrand: 'This brand isn’t in our list yet: check the spelling, it will be added after review.',
});

/**
 * Marque et modèle : saisie libre, guidée par la liste officielle des marques et par les modèles
 * déjà saisis dans la communauté. Une faute probable propose la bonne écriture, sans l'imposer.
 */
export default function BrandModelFields({ brand, model, onBrand, onModel, brandError, modelError, modelPlaceholder }: {
  brand: string; model: string; onBrand: (v: string) => void; onModel: (v: string) => void;
  brandError?: string | null; modelError?: string | null; modelPlaceholder?: string;
}) {
  const t = useStrings(S);
  const id = useId();
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  useEffect(() => { loadBrands().then(setBrands); }, []);

  // Modèles de la marque saisie, une fois la frappe posée
  useEffect(() => {
    const target = officialBrand(brand, brands) ?? brand;
    const timer = window.setTimeout(() => { loadModels(target).then(setModels); }, 300);
    return () => window.clearTimeout(timer);
  }, [brand, brands]);

  const suggestion = closeBrand(brand, brands);
  const unknown = touched && brand.trim().length >= 2 && brands.length > 0 && !suggestion && !officialBrand(brand, brands);

  const brandHint = suggestion ? (
    <span className={s.suggest}>
      {t.didYouMean}{' '}
      <button type="button" className={s.suggestBtn} onClick={() => onBrand(suggestion)}>{suggestion}</button>
      {' '}?
    </span>
  ) : unknown ? t.newBrand : undefined;

  return (
    <>
      <TextField label={t.brand} list={`${id}-brands`} value={brand} onChange={e => onBrand(e.target.value)}
        onBlur={() => setTouched(true)} error={brandError} hint={brandHint} autoComplete="off" required />
      <datalist id={`${id}-brands`}>{brands.map(b => <option key={b} value={b} />)}</datalist>
      <TextField label={t.model} list={`${id}-models`} value={model} onChange={e => onModel(e.target.value)}
        error={modelError} placeholder={modelPlaceholder} autoComplete="off" required />
      <datalist id={`${id}-models`}>{models.map(m => <option key={m} value={m} />)}</datalist>
    </>
  );
}
