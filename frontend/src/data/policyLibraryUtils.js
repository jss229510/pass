const regionAliases = { 충북: "충청북도", 충남: "충청남도", 전북: "전라북도", 전남: "전라남도", 경북: "경상북도", 경남: "경상남도" };

export function safeExternalUrl(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}

export function filterPolicies(items, { keyword = "", region = "전체 지역", source = "전체 기관", status = "전체 상태", category = "전체", savedOnly = false, saved = [], sort = "updated" } = {}) {
  const terms = keyword.toLocaleLowerCase("ko").split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const targetRegion = item.region || "";
    const text = [item.title, item.organization, item.description, item.benefit, item.eligibility, item.category, item.region].join(" ").toLocaleLowerCase("ko");
    return terms.every((term) => text.includes(term))
      && (category === "전체" || item.category === category)
      && (region === "전체 지역" || targetRegion === "전국" || targetRegion.includes(region) || (regionAliases[region] && targetRegion.includes(regionAliases[region])) || (region === "전북" && targetRegion.includes("전북특별자치도")))
      && (source === "전체 기관" || item.source === source)
      && (status === "전체 상태" || item.status === status)
      && (!savedOnly || saved.includes(item.id));
  }).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "ko") : (b.updatedAt || b.publishedAt || "").localeCompare(a.updatedAt || a.publishedAt || "") || a.title.localeCompare(b.title, "ko"));
}
