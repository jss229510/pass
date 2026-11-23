import test from "node:test";
import assert from "node:assert/strict";
import { filterPolicies, safeExternalUrl } from "./policyLibraryUtils.js";

const items = [
  { id: "a", title: "월세 지원", region: "전국", category: "월세·주거비", source: "youth", status: "접수중", updatedAt: "2026-11-20" },
  { id: "b", title: "서울 이사비 지원", region: "서울", category: "이사·중개비", source: "youth", status: "마감", updatedAt: "2026-11-21" },
  { id: "c", title: "행복주택 모집", region: "경기도", category: "공공임대", source: "lh", status: "공고 확인", updatedAt: "2026-11-22" },
  { id: "d", title: "주거 상담", region: "충청북도", category: "기타 주거지원", source: "youth", status: "상시", updatedAt: "2026-11-19" },
];

test("region searches include nationwide support and normalize provincial names", () => {
  assert.deepEqual(filterPolicies(items, { region: "서울" }).map((item) => item.id), ["b", "a"]);
  assert.deepEqual(filterPolicies(items, { region: "충북" }).map((item) => item.id), ["a", "d"]);
  assert.deepEqual(filterPolicies(items, { region: "전국" }).map((item) => item.id), ["a"]);
});
test("search combines keyword, category, source and application status", () => {
  assert.deepEqual(filterPolicies(items, { keyword: "서울 지원", category: "이사·중개비", source: "youth", status: "마감" }).map((item) => item.id), ["b"]);
  assert.equal(filterPolicies(items, { keyword: "월세", source: "lh" }).length, 0);
  assert.equal(filterPolicies(items, { keyword: "없는 정책" }).length, 0);
});
test("saved filters use stable policy ids and sorting preserves source data", () => {
  assert.deepEqual(filterPolicies(items, { savedOnly: true, saved: ["a", "c"] }).map((item) => item.id), ["c", "a"]);
  assert.equal(filterPolicies(items, { savedOnly: true }).length, 0);
  assert.equal(items[0].id, "a");
});
test("official links reject executable and local URL schemes", () => {
  assert.equal(safeExternalUrl("javascript:alert(1)"), "");
  assert.equal(safeExternalUrl("data:text/html,test"), "");
  assert.equal(safeExternalUrl("https://apply.lh.or.kr/"), "https://apply.lh.or.kr/");
});
