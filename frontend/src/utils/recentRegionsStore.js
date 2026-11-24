const STORAGE_KEY = "housingRecentRegions";
const FAVORITES_STORAGE_KEY = "housingFavoriteRegions";
const COMPARE_HISTORY_STORAGE_KEY = "housingRegionCompareHistory";
const MAX_RECENT_REGIONS = 6;
const MAX_COMPARE_HISTORY = 10;

const normalizeName = (value) => typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
const toNumberOrNull = (value) => Number.isFinite(value) ? value : null;

function normalizeComparisonProperty(value) {
  if (typeof value === "string") return { label: normalizeName(value) };
  const title = normalizeName(value?.title);
  const location = normalizeName(value?.location);
  const label = [location, title].filter(Boolean).join(" · ");
  if (!label) return null;
  return {
    label,
    title: title || label,
    location,
    rent: toNumberOrNull(value?.rent),
    maintenance: toNumberOrNull(value?.maintenance),
    area: toNumberOrNull(value?.area),
    score: toNumberOrNull(value?.score),
  };
}

export function loadRecentRegions() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((region) => normalizeName(region?.name) && Number.isFinite(region?.viewedAt))
      .map((region) => ({
        name: normalizeName(region.name),
        source: region.source === "maru" ? "maru" : "search",
        viewedAt: region.viewedAt,
      }))
      .slice(0, MAX_RECENT_REGIONS);
  } catch {
    return [];
  }
}

export function recordRecentRegion(name, source) {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return [];

  const next = [
    { name: normalizedName, source: source === "maru" ? "maru" : "search", viewedAt: Date.now() },
    ...loadRecentRegions().filter((region) => region.name !== normalizedName),
  ].slice(0, MAX_RECENT_REGIONS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage permission errors should not stop the current search flow.
  }
  return next;
}

export function loadFavoriteRegionNames() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return [...new Set(saved.map(normalizeName).filter(Boolean))];
  } catch {
    return [];
  }
}

export function toggleFavoriteRegion(name) {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return [];

  const favorites = loadFavoriteRegionNames();
  const next = favorites.includes(normalizedName)
    ? favorites.filter((item) => item !== normalizedName)
    : [normalizedName, ...favorites];

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage permission errors should not stop the current interaction.
  }
  return next;
}

export function loadRegionCompareHistory() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COMPARE_HISTORY_STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((item) => Array.isArray(item?.regions) && item.regions.length >= 2 && Number.isFinite(item?.comparedAt))
      .map((item) => {
        const properties = Array.isArray(item.properties)
          ? item.properties.map(normalizeComparisonProperty).filter(Boolean)
          : item.regions.map(normalizeComparisonProperty).filter(Boolean);
        return { id: String(item.id), regions: properties.map((property) => property.label), properties, comparedAt: item.comparedAt };
      })
      .filter((item) => item.properties.length >= 2)
      .slice(0, MAX_COMPARE_HISTORY);
  } catch {
    return [];
  }
}

export function recordRegionComparison(properties) {
  const normalizedProperties = properties.map(normalizeComparisonProperty).filter(Boolean)
    .filter((property, index, items) => items.findIndex((item) => item.label === property.label) === index);
  if (normalizedProperties.length < 2) return loadRegionCompareHistory();

  const regions = normalizedProperties.map((property) => property.label);
  const id = regions.slice().sort((left, right) => left.localeCompare(right, "ko")).join("|");
  const next = [
    { id, regions, properties: normalizedProperties, comparedAt: Date.now() },
    ...loadRegionCompareHistory().filter((item) => item.id !== id),
  ].slice(0, MAX_COMPARE_HISTORY);

  try {
    window.localStorage.setItem(COMPARE_HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage permission errors should not stop the current comparison.
  }
  return next;
}

export function removeRegionComparison(id) {
  const next = loadRegionCompareHistory().filter((item) => item.id !== id);
  try {
    window.localStorage.setItem(COMPARE_HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage permission errors should not stop the current interaction.
  }
  return next;
}
