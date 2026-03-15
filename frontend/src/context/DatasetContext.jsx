import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const DatasetContext = createContext(null);

const STORAGE_KEY = "insyte.datasetState.v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function DatasetProvider({ children }) {
  const [file, setFile] = useState(null);
  const [datasetId, setDatasetId] = useState(null);

  const [uploadInfo, setUploadInfo] = useState(null);
  const [edaResult, setEdaResult] = useState(null);
  const [feResult, setFeResult] = useState(null);
  const [automlResult, setAutomlResult] = useState(null);

  // Restore persisted dataset state so Dashboard works after refresh.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? safeParse(raw) : null;
    if (saved?.datasetId) setDatasetId(saved.datasetId);
    if (saved?.uploadInfo) setUploadInfo(saved.uploadInfo);
    if (saved?.edaResult) setEdaResult(saved.edaResult);
    if (saved?.feResult) setFeResult(saved.feResult);
    if (saved?.automlResult) setAutomlResult(saved.automlResult);
  }, []);

  // Persist minimal state (file is not persisted).
  useEffect(() => {
    const payload = {
      datasetId,
      uploadInfo,
      edaResult,
      feResult,
      automlResult,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [datasetId, uploadInfo, edaResult, feResult, automlResult]);

  const resetAll = useCallback(() => {
    setFile(null);
    setDatasetId(null);
    setUploadInfo(null);
    setEdaResult(null);
    setFeResult(null);
    setAutomlResult(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      file,
      setFile,
      datasetId,
      setDatasetId,
      uploadInfo,
      setUploadInfo,
      edaResult,
      setEdaResult,
      feResult,
      setFeResult,
      automlResult,
      setAutomlResult,
      resetAll,
    }),
    [file, datasetId, uploadInfo, edaResult, feResult, automlResult, resetAll],
  );

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error("useDataset must be used within DatasetProvider");
  }
  return ctx;
}
