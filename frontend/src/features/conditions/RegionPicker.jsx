import React, { useMemo, useState } from "react";

const regionOptions = {
  서울특별시: ["강서구", "관악구", "마포구", "송파구"],
  대전광역시: ["유성구", "서구", "중구", "동구", "대덕구"],
  충청남도: ["아산시", "천안시", "공주시"],
  광주광역시: ["북구", "동구", "서구", "남구", "광산구"],
};

const searchableRegions = Object.entries(regionOptions).flatMap(([province, districts]) => districts.map((district) => `${province} ${district}`));

function RegionPicker({ currentProvince, currentDistrict, onCurrentProvinceChange, onCurrentDistrictChange, desiredRegions = [], onDesiredRegionsChange, error }) {
  const [query, setQuery] = useState("");
  const districts = regionOptions[currentProvince] ?? [];
  const matches = useMemo(() => searchableRegions.filter((region) => region.includes(query.trim())).filter((region) => !desiredRegions.includes(region)).slice(0, 6), [desiredRegions, query]);
  const isFull = desiredRegions.length >= 5;
  const addRegion = (region) => { if (!isFull && !desiredRegions.includes(region)) { onDesiredRegionsChange([...desiredRegions, region]); setQuery(""); } };
  const removeRegion = (region) => onDesiredRegionsChange(desiredRegions.filter((item) => item !== region));

  return <div className="region-picker">
    <div className="region-picker-current">
      <label className="field">현재 거주 시도<select value={currentProvince} onChange={(event) => onCurrentProvinceChange(event.target.value)}><option value="">시도를 선택하세요</option>{Object.keys(regionOptions).map((province) => <option key={province}>{province}</option>)}</select></label>
      <label className="field">현재 거주 시군구<select value={currentDistrict} disabled={!currentProvince} onChange={(event) => onCurrentDistrictChange(event.target.value)}><option value="">시군구를 선택하세요</option>{districts.map((district) => <option key={district}>{district}</option>)}</select></label>
    </div>
    <label className="field region-picker-search">희망 지역 검색<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 대전 유성구" aria-describedby="desired-region-help" /><small id="desired-region-help">최대 5개까지 추가할 수 있어요.</small></label>
    {query.trim() && <div className="region-picker-results" role="listbox" aria-label="희망 지역 검색 결과">{matches.length ? matches.map((region) => <button type="button" role="option" key={region} onClick={() => addRegion(region)} disabled={isFull}>{region}<span>추가</span></button>) : <p>추가할 수 있는 지역이 없어요.</p>}</div>}
    <div className="region-picker-chips" aria-label="선택한 희망 지역">{desiredRegions.map((region) => <span key={region}>{region}<button type="button" onClick={() => removeRegion(region)} aria-label={`${region} 삭제`}>×</button></span>)}</div>
    {error && <p className="field-error" role="alert">{error}</p>}
  </div>;
}

export default RegionPicker;
