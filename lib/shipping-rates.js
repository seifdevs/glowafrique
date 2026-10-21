export const DELIVERY_ZONES = [
  {
    id: 'zone-1000',
    rateXof: 1000,
    label: 'Zone 4 · Biétry',
    areas: ['Biétry'],
  },
  {
    id: 'zone-1500',
    rateXof: 1500,
    label: 'Zone 3 · Marcory / limite feu de Bernabé',
    areas: [
      'Zone 3 (Limite feu de Bernabé)',
      'Église Méthodiste',
      'Gelti',
      'Marcory',
      'Marcory Résidentiel',
      'Dépôt Céleste',
    ],
  },
  {
    id: 'zone-2000',
    rateXof: 2000,
    label: 'Koumassi / Treichville / Port-Bouët',
    areas: [
      'Koumassi Zone Industrielle',
      'Treichville',
      'CHU Treichville',
      'Rue des Pêcheurs',
      'Port-Bouët',
      'Anoumabo',
      'ARTCI',
    ],
  },
  {
    id: 'zone-2500',
    rateXof: 2500,
    label: 'Aéroport / Vridi / Plateau',
    areas: ['Aéroport', 'Vridi', 'Koumassi 05 / Campement', 'Plateau', 'Sans-fil'],
  },
  {
    id: 'zone-3500',
    rateXof: 3500,
    label: 'Riviera Golf / Cocody Centre / Adjamé',
    areas: [
      'Riviera Golf',
      'Cocody Centre (Danga, St Jean)',
      'Carena',
      'Adjouffou',
      'Adjamé',
    ],
  },
  {
    id: 'zone-4000',
    rateXof: 4000,
    label: 'II-Plateaux / Palmeraie / Riviera',
    areas: ['II-Plateaux', 'Palmeraie', 'Riviera', "M'Badon", 'Pisane', 'Anani', 'Gonzague', 'Attécoubé'],
  },
  {
    id: 'zone-5000',
    rateXof: 5000,
    label: 'Angré / Bassam / Yopougon (secteurs ouest)',
    areas: [
      'Plateau Dokui',
      'Angré',
      'Bingerville (limite feux de Bangui)',
      'Yopougon (Sable, Selmer, Koweït, Bel Air, Sicogi, Toits Rouges, Palais)',
      'Bassam',
      'Feh Kessé / Abatta Village',
    ],
  },
  {
    id: 'zone-6000',
    rateXof: 6000,
    label: 'Angré-Bessikoi / Abobo / Yopougon',
    areas: [
      'Angré-Bessikoi',
      'Abobo (limite mairie)',
      'Abobo-Doumé',
      'Yopougon (Maroc, Niangon, Akadjoba, Azito, Cité Verte, etc.)',
    ],
  },
  {
    id: 'zone-7000',
    rateXof: 7000,
    label: 'Bingerville / Prison Civile / Cité ADO',
    areas: ['Bingerville', 'Prison Civile', 'Cité ADO'],
  },
  {
    id: 'zone-8000',
    rateXof: 8000,
    label: 'Attinguié / Brassivoire / N’Dotré',
    areas: ['Attinguié', 'Brassivoire', 'Adjamé-Bingerville-Éloka-Té', 'N’Dotré'],
  },
];

export function findDeliveryZone(value) {
  const id = String(value || '').trim().toLowerCase();
  return DELIVERY_ZONES.find((zone) => zone.id === id) || null;
}

export function configuredFallbackShippingXof() {
  if (process.env.SHIPPING_FEE_XOF === undefined || process.env.SHIPPING_FEE_XOF === '')
    return null;
  const value = Number(process.env.SHIPPING_FEE_XOF);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}
