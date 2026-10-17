import { authHeaders, methodNotAllowed } from '../lib/auth.js';

const API = 'https://api-public.anstat.ci/api/v1';

async function fetchAll(resource) {
  const records = [];
  let next = `${API}/${resource}?annee=2021&pagination=oui&page=1`;
  for (let page = 0; next && page < 40; page += 1) {
    const response = await fetch(next, { signal: AbortSignal.timeout(7000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('ANSTAT_LOCATION_UNAVAILABLE');
    const data = await response.json();
    if (!Array.isArray(data.results)) throw new Error('ANSTAT_LOCATION_FORMAT');
    records.push(...data.results);
    next = data.result_info && data.result_info.next;
  }
  return records;
}

export default async function locations(req, res) {
  authHeaders(res);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  if (methodNotAllowed(req, res, 'GET')) return;
  try {
    const [regions, departments, subprefectures] = await Promise.all([
      fetchAll('regions'), fetchAll('departements'), fetchAll('sous-prefectures'),
    ]);
    const departmentRegion = new Map(departments.map((item) => [String(item.cod_dep), String(item.cod_reg)]));
    const divisionMap = new Map(regions.map((item) => [String(item.cod_reg), { code: String(item.cod_reg), name: String(item.nom_reg || '').trim(), cities: [] }]));
    for (const locality of subprefectures) {
      const regionCode = departmentRegion.get(String(locality.cod_dep));
      const division = divisionMap.get(regionCode);
      if (division && locality.nom_sp) division.cities.push(String(locality.nom_sp).trim());
    }
    const divisions = Array.from(divisionMap.values()).filter((item) => item.name).map((item) => ({ ...item, cities: Array.from(new Set(item.cities)).sort((a, b) => a.localeCompare(b, 'fr')) })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    if (!divisions.length || divisions.every((item) => !item.cities.length)) throw new Error('ANSTAT_LOCATION_EMPTY');
    return res.status(200).json({ divisions, source: 'ANStat RGPH 2021' });
  } catch (error) {
    console.error('[locations] official dataset unavailable:', error && error.name || 'Error');
    return res.status(503).json({ error: 'Official Côte d’Ivoire locations are temporarily unavailable.' });
  }
}
