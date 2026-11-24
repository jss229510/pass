import { useCallback, useEffect, useState } from "react";
import { loadUserState, saveUserState } from "../utils/userStateSync";

const makeId = () => `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useContracts() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const saveContracts = useCallback((next) => {
    setContracts(next);
    saveUserState("contracts", next).catch(() => setError("계약서 목록을 서버에 저장하지 못했어요."));
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const saved = await loadUserState("contracts");
      setContracts(Array.isArray(saved) ? saved : []);
    } catch {
      setError("계약서 목록을 불러오지 못했어요. 다시 로그인한 뒤 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addContract = (values) => {
    const item = {
      id: makeId(),
      status: "분석 전",
      uploadedAt: new Date().toLocaleDateString("ko-KR"),
      disposalDue: "D-30",
      summary: "분석을 시작할 준비가 됐어요.",
      ...values,
    };
    saveContracts([item, ...contracts]);
  };

  const renameContract = (id, fileName) =>
    saveContracts(contracts.map((item) => (item.id === id ? { ...item, fileName } : item)));

  const removeContract = (id) =>
    saveContracts(contracts.filter((item) => item.id !== id));

  const restoreContract = (contract) =>
    saveContracts([contract, ...contracts.filter((item) => item.id !== contract.id)]);

  return { contracts, isLoading, error, load, addContract, renameContract, removeContract, restoreContract };
}
