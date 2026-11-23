import React, { useEffect, useState } from "react";

const roomTypes = ["원룸", "1.5룸", "투룸"];
const dealTypes = ["월세", "전세"];

function readFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    room: roomTypes.includes(params.get("room")) ? params.get("room") : "원룸",
    deal: dealTypes.includes(params.get("deal")) ? params.get("deal") : "월세",
  };
}

function FilterBar({ value, onChange }) {
  const [filters, setFilters] = useState(() => value ?? readFilters());

  useEffect(() => {
    if (value) setFilters(value);
  }, [value]);

  const update = (key, nextValue) => {
    const next = { ...filters, [key]: nextValue };
    setFilters(next);
    const params = new URLSearchParams(window.location.search);
    params.set("room", next.room);
    params.set("deal", next.deal);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    onChange?.(next);
  };

  return <section className="dashboard-filter-bar" aria-label="지역 기록 필터">
    <div className="dashboard-filter-group"><span>방 유형</span><div role="group" aria-label="방 유형">{roomTypes.map((room) => <button type="button" className={filters.room === room ? "active" : ""} key={room} onClick={() => update("room", room)}>{room}</button>)}</div></div>
    <div className="dashboard-filter-group"><span>거래 유형</span><div role="group" aria-label="거래 유형">{dealTypes.map((deal) => <button type="button" className={filters.deal === deal ? "active" : ""} key={deal} onClick={() => update("deal", deal)}>{deal}</button>)}</div></div>
  </section>;
}

export default FilterBar;
