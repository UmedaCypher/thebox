-- =============================================================================
-- Liste officielle des marques, complément : marques chinoises montantes et microbrands répandues
-- Sans doublon de casse avec les marques déjà présentes ; se relance sans risque.
-- =============================================================================

insert into public.brands (name)
select x from unnest(array[
  -- Chine et Hong Kong
  'Addiesdive', 'Atelier Wen', 'Baltany', 'Behrens', 'Beijing', 'Benyar', 'Bliger', 'Cadisen', 'Ciga Design', 'Corgeut', 'Cronos',
  'Ebohr', 'Escapement Time', 'Fiyta', 'Heimdallr', 'Hruodland', 'Memorigin', 'Merkur', 'Militado', 'Pagani Design', 'Parnis',
  'Phylida', 'Proxima', 'Rdunae', 'Red Star', 'Rossini', 'San Martin', 'Sea-Gull', 'Seestern', 'Shanghai', 'Spinnaker', 'Steeldive',
  'Sugess', 'Tandorio', 'Thorn', 'Tiger Concept', 'Tisell', 'Tsar Bomba', 'Vixa', 'Watchdives',
  -- Microbrands et indépendants
  'Aera', 'Aquastar', 'Autodromo', 'Avi-8', 'Awake', 'Axios', 'Beaubleu', 'Benarus', 'Brew', 'Briston', 'Charlie Paris', 'Depancel',
  'Draken', 'Echo/Neutra', 'Elliot Brown', 'Formex', 'Gerald Genta', 'Gruppo Gamma', 'Hemel', 'Herbelin', 'Islander', 'Kentex', 'Knot',
  'Kuoe', 'Le Jour', 'Lew & Huey', 'March LA.B', 'Marathon', 'Marloe', 'Minase', 'Mk II', 'Monta', 'Naoya Hida', 'Nezumi',
  'Oak & Oscar', 'Ollech & Wajs', 'Out of Order', 'Pequignet', 'Pinion', 'Raven', 'Ressence', 'RGM', 'Sangin', 'Schofield', 'Serica',
  'Shinola', 'Sternglas', 'Straton', 'Traska', 'Tsao Baltimore', 'Undone', 'Weiss', 'Wolbrook', 'Zelos',
  -- Grandes séries et maisons à compléter
  'Aristo', 'Daniel Wellington', 'Favre-Leuba', 'Fossil', 'Guinand', 'Invicta', 'Luminox', 'Mathey-Tissot', 'MeisterSinger', 'Poljot',
  'Raketa', 'Stowa', 'Sturmanskie', 'Tutima', 'Union Glashütte', 'Victorinox', 'Vostok', 'Wenger'
]) as x
where not exists (select 1 from public.brands b where lower(b.name) = lower(x));
