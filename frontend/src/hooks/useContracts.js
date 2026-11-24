import { useCallback, useEffect, useRef, useState } from "react";
import { contractSamples } from "../mocks/contracts";
import { apiRequest } from "../utils/apiClient";
import { loadUserState, saveUserState } from "../utils/userStateSync";

const makeId = () => `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// 삭제 후 "실행 취소"를 누를 수 있는 시간이 지나면 서버의 원본 파일도 지웁니다.
const FILE_DELETE_DELAY = 6000;

export function useContracts() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const contractsRef = useRef(contracts);
  const pendingFileDeletes = useRef(new Map());

  const saveContracts = useCallback((next) => {
    contractsRef.current = next;
    setContracts(next);
    saveUserState("contracts", next).catch(() => setError("계약서 목록을 서버에 저장하지 못했어요."));
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const saved = await loadUserState("contracts");
      if (Array.isArray(saved)) {
        contractsRef.current = saved;
        setContracts(saved);
      } else {
        // 처음 쓰는 사용자는 예시 5건으로 시작하고, 이후 수정·삭제가 이어지도록 서버에 저장합니다.
        saveContracts(contractSamples);
      }
    } catch {
      setError("계약서 목록을 불러오지 못했어요. 다시 로그인한 뒤 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [saveContracts]);

  useEffect(() => {
    load();
  }, [load]);

  const addContract = async (values, file) => {
    let fileInfo = {};
    if (file) {
      const body = new FormData();
      body.append("file", file);
      const uploaded = await apiRequest("/api/my/contract-files", { method: "POST", body });
      fileInfo = { fileId: uploaded.fileId, fileSize: uploaded.size, contentType: uploaded.contentType };
    }
    const item = {
      id: makeId(),
      status: "분석 전",
      uploadedAt: new Date().toLocaleDateString("ko-KR"),
      disposalDue: "D-30",
      summary: "분석을 시작할 준비가 됐어요.",
      ...values,
      ...fileInfo,
    };
    saveContracts([item, ...contractsRef.current]);
  };

  const renameContract = (id, fileName) =>
    saveContracts(contractsRef.current.map((item) => (item.id === id ? { ...item, fileName } : item)));

  const removeContract = (id) => {
    const removed = contractsRef.current.find((item) => item.id === id);
    saveContracts(contractsRef.current.filter((item) => item.id !== id));
    if (removed?.fileId) {
      const timer = window.setTimeout(() => {
        pendingFileDeletes.current.delete(id);
        apiRequest(`/api/my/contract-files/${encodeURIComponent(removed.fileId)}`, { method: "DELETE" }).catch(() => undefined);
      }, FILE_DELETE_DELAY);
      pendingFileDeletes.current.set(id, timer);
    }
  };

  const restoreContract = (contract) => {
    window.clearTimeout(pendingFileDeletes.current.get(contract.id));
    pendingFileDeletes.current.delete(contract.id);
    saveContracts([contract, ...contractsRef.current.filter((item) => item.id !== contract.id)]);
  };

  // 인증 헤더가 필요해 링크 대신 blob으로 받아 새 탭에서 엽니다.
  const openContractFile = async (contract) => {
    if (!contract.fileId) return false;
    const preview = window.open("", "_blank");
    if (!preview) return false;
    try {
      const blob = await apiRequest(`/api/my/contract-files/${encodeURIComponent(contract.fileId)}`, { responseType: "blob" });
      const url = URL.createObjectURL(blob);
      preview.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return true;
    } catch {
      preview.close();
      return false;
    }
  };

  return { contracts, isLoading, error, load, addContract, renameContract, removeContract, restoreContract, openContractFile };
}
