import { useCallback, useEffect, useState } from "react";
import { contractSamples } from "../mocks/contracts";

const makeId = () => `contract-${Date.now()}`;

export function useContracts() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setIsLoading(true);
    setError("");
    window.setTimeout(() => {
      setContracts(contractSamples);
      setIsLoading(false);
    }, 250);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addContract = (values) => setContracts((items) => [{ id: makeId(), status: "분석 전", uploadedAt: "오늘", disposalDue: "D-30", summary: "분석 전", ...values }, ...items]);
  const renameContract = (id, fileName) => setContracts((items) => items.map((item) => item.id === id ? { ...item, fileName } : item));
  const removeContract = (id) => setContracts((items) => items.filter((item) => item.id !== id));
  const restoreContract = (contract) => setContracts((items) => [contract, ...items]);

  return { contracts, isLoading, error, load, addContract, renameContract, removeContract, restoreContract };
}
