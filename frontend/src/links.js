export const links = {
  contractAnalysis: (id) => {
    void id;
    return "documents";
  },
  compare: (ids, room, deal) => {
    const params = new URLSearchParams({ ids: ids.join(",") });
    if (room) params.set("room", room);
    if (deal) params.set("deal", deal);
    return `/property-compare?${params.toString()}`;
  },
  region: (id) => `/regions/${id}`,
  policy: "https://www.bokjiro.go.kr",
};
