import React, { useEffect, useRef, useState, useCallback } from "react";
import { Head } from "@inertiajs/react";

const DEFAULT_PROXY_BASE = "/api/backend";
const normalizeBase = (value) => value?.replace(/\/$/, "");
const VPS_ONLY_MODE = (import.meta.env.VITE_VPS_ONLY ?? "true").trim().toLowerCase() !== "false";
const shouldRetryWithFallback = (status) => [404, 413, 431, 500, 502, 503, 504].includes(status);
const clampProgress = (value) => (typeof value !== "number" || Number.isNaN(value) ? 0 : Math.max(0, Math.min(100, Math.round(value))));

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getFileKindLabel = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".brushset") || lower.endsWith(".brushset.zip")) return "Brushset";
  if (lower.endsWith(".brush") || lower.endsWith(".brush.zip")) return "Brush";
  if (lower.endsWith(".procreate") || lower.endsWith(".procreate.zip")) return "Procreate";
  if (lower.endsWith(".zip")) return "Zip";
  return "File";
};

const getContainerType = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".brushset") || lower.endsWith(".brushset.zip")) return "brushset";
  if (lower.endsWith(".brush") || lower.endsWith(".brush.zip")) return "brush";
  if (lower.endsWith(".procreate") || lower.endsWith(".procreate.zip")) return "procreate";
  return null;
};

const buildUploadFormData = (uploadFiles) => {
  const formData = new FormData();
  uploadFiles.forEach((file) => formData.append("files", file, file.name));
  return formData;
};

export default function Studio() {
  const [files, setFiles] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [manifest, setManifest] = useState(null);
  const [authorName, setAuthorName] = useState("");
  const [signatureFile, setSignatureFile] = useState(null);
  const [authorPictureFile, setAuthorPictureFile] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputFiles, setOutputFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [isContinuous, setIsContinuous] = useState(false);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [cleanupMessage, setCleanupMessage] = useState(null);
  const pollFailureCountRef = useRef(0);
  const cleanupProgressTimerRef = useRef(null);
  const cleanupProgressResetTimerRef = useRef(null);
  const activeApiBaseRef = useRef(normalizeBase(import.meta.env.VITE_API_BASE) || DEFAULT_PROXY_BASE);

  const totalSelectedSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalOutputSize = outputFiles.reduce((sum, file) => sum + file.size, 0);
  const processingMode = isContinuous ? "Continuous" : "Manual";
  const sourceNames = manifest?.source_files?.map((entry) => entry.name) ?? files.map((file) => file.name);
  const containerTotals = sourceNames.reduce((totals, name) => {
    const type = getContainerType(name);
    if (type) totals[type] += 1;
    return totals;
  }, { brushset: 0, brush: 0, procreate: 0 });

  const getApiBases = () => {
    const explicitBase = normalizeBase(import.meta.env.VITE_API_BASE);
    if (explicitBase) return [explicitBase];

    const bases = [activeApiBaseRef.current, DEFAULT_PROXY_BASE];
    if (!VPS_ONLY_MODE && typeof window !== "undefined") {
      bases.push(`http://${window.location.hostname}:8000`);
    }
    return Array.from(new Set(bases.filter(Boolean)));
  };

  const apiFetch = useCallback(async (path, init) => {
    let lastResponse = null;
    let lastError;
    for (const base of getApiBases()) {
      try {
        const response = await fetch(`${base}${path}`, init);
        if (response.ok) {
          activeApiBaseRef.current = base;
          return response;
        }
        lastResponse = response;
        if (!shouldRetryWithFallback(response.status)) {
          activeApiBaseRef.current = base;
          return response;
        }
      } catch (error) {
        lastError = error;
      }
    }
    if (lastResponse) return lastResponse;
    throw lastError instanceof Error ? lastError : new Error("Request failed");
  }, []);

  const uploadWithProgress = useCallback(async (uploadFiles) => {
    let lastResponse = null;
    let lastError;
    for (const [attemptIndex, base] of getApiBases().entries()) {
      if (attemptIndex > 0) {
        setDisplayProgress(2);
        setTargetProgress(2);
        setProgressMessage("Primary gateway failed. Retrying engine sync...");
      }
      try {
        const response = await new Promise((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("POST", `${base}/upload`);
          request.upload.onprogress = (event) => {
            if (!event.lengthComputable || event.total <= 0) return;
            const percent = Math.min(99, Math.max(1, Math.round((event.loaded / event.total) * 100)));
            setTargetProgress(percent);
            setProgressMessage(percent >= 99 ? "Finishing secure engine sync..." : `Syncing ${formatFileSize(event.loaded)} of ${formatFileSize(event.total)} to engine...`);
          };
          request.onload = () => resolve(new Response(request.responseText, { status: request.status, statusText: request.statusText, headers: { "content-type": request.getResponseHeader("content-type") ?? "" } }));
          request.onerror = () => reject(new Error("Upload request failed"));
          request.onabort = () => reject(new Error("Upload request was aborted"));
          request.send(buildUploadFormData(uploadFiles));
        });
        if (response.ok) {
          activeApiBaseRef.current = base;
          return response;
        }
        lastResponse = response;
        if (!shouldRetryWithFallback(response.status)) {
          activeApiBaseRef.current = base;
          return response;
        }
      } catch (error) {
        lastError = error;
      }
    }
    if (lastResponse) return lastResponse;
    throw lastError instanceof Error ? lastError : new Error("Upload request failed");
  }, []);

  const readErrorMessage = async (response, fallback) => {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await response.json().catch(() => null));
      if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
    }
    const text = (await response.text().catch(() => "")).trim();
    return text ? `${fallback} (${response.status}): ${text.slice(0, 180)}` : `${fallback} (${response.status})`;
  };

  const getResolvedFetchBase = () => activeApiBaseRef.current;
  const encodeAssetPath = (assetPath) => assetPath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  const getAssetPreviewUrl = (assetPath) => jobId ? `${getResolvedFetchBase()}/jobs/${encodeURIComponent(jobId)}/assets/${encodeAssetPath(assetPath)}` : "";

  const syncJobStatus = useCallback(async (activeJobId, currentStatus) => {
    try {
      const resp = await apiFetch(`/jobs/${activeJobId}?_t=${Date.now()}`, { cache: "no-store", headers: { Pragma: "no-cache", "Cache-Control": "no-cache" } });
      if (!resp.ok) {
        pollFailureCountRef.current += 1;
        if (pollFailureCountRef.current >= 3) {
          setErrorMessage("Backend se connection lose ho gaya. Backend server check karo aur retry karo.");
          setStatus("error");
        }
        return;
      }
      pollFailureCountRef.current = 0;
      const data = await resp.json();
      if (typeof data.progress === "number") setTargetProgress(clampProgress(data.progress));
      if (typeof data.progress_message === "string") setProgressMessage(data.progress_message);
      if (data.status === "scanned" && currentStatus !== "scanned") {
        setManifest(data.manifest ?? null);
        setDisplayProgress(100);
        setTargetProgress(100);
        setProgressMessage(data.progress_message ?? "Scan complete");
        window.setTimeout(() => setStatus("scanned"), 180);
      } else if (data.status === "completed" && currentStatus !== "completed") {
        setOutputFiles(data.outputs ?? []);
        setOutputUrl(`${getResolvedFetchBase()}/jobs/${activeJobId}/download?cleanup=true`);
        setDisplayProgress(100);
        setTargetProgress(100);
        setProgressMessage(data.progress_message ?? "Packaging complete");
        window.setTimeout(() => setStatus("completed"), 180);
      } else if (data.status === "failed" && currentStatus !== "error") {
        setErrorMessage(data.error || "System error");
        setStatus("error");
      }
    } catch {
      pollFailureCountRef.current += 1;
      if (pollFailureCountRef.current >= 3) {
        setErrorMessage("Backend se baat nahi ho pa rahi. Server status aur API configuration check karo.");
        setStatus("error");
      }
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!jobId || (status !== "scanning" && status !== "processing")) return;
    const intervalId = window.setInterval(() => void syncJobStatus(jobId, status), 1500);
    const handleFocus = () => void syncJobStatus(jobId, status);
    window.addEventListener("focus", handleFocus);
    const immediateCheckId = window.setTimeout(() => void syncJobStatus(jobId, status), 0);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(immediateCheckId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [jobId, status, syncJobStatus]);

  useEffect(() => {
    if (displayProgress === targetProgress) return;
    const timeoutId = window.setTimeout(() => setDisplayProgress((current) => (current === targetProgress ? current : current < targetProgress ? current + 1 : current - 1)), 24);
    return () => window.clearTimeout(timeoutId);
  }, [displayProgress, targetProgress]);

  const resetSession = () => {
    setStatus("idle");
    setFiles([]);
    setJobId(null);
    setManifest(null);
    setAuthorName("");
    setSignatureFile(null);
    setAuthorPictureFile(null);
    setOutputUrl(null);
    setOutputFiles([]);
    setErrorMessage(null);
    setStoreName("");
    setTargetProgress(0);
    setDisplayProgress(0);
    setProgressMessage("");
    pollFailureCountRef.current = 0;
  };

  const processMore = useCallback(() => {
    setStatus("idle");
    setFiles([]);
    setJobId(null);
    setManifest(null);
    setOutputUrl(null);
    setOutputFiles([]);
    setErrorMessage(null);
    setTargetProgress(0);
    setDisplayProgress(0);
    setProgressMessage("");
    pollFailureCountRef.current = 0;
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    const emptyFile = files.find((file) => file.size === 0);
    if (emptyFile) {
      setErrorMessage(`${emptyFile.name} browser mein 0 bytes dikh rahi hai. Is file ko actual .brushset, .procreate ya .zip file ke taur par re-export karke dobara upload karo.`);
      setStatus("error");
      return;
    }
    setErrorMessage(null);
    setStatus("uploading");
    setDisplayProgress(1);
    setTargetProgress(1);
    setProgressMessage("Preparing secure engine sync...");
    try {
      const resp = await uploadWithProgress(files);
      if (!resp.ok) {
        setErrorMessage(await readErrorMessage(resp, "Upload failed"));
        setStatus("error");
        return;
      }
      const data = await resp.json();
      setDisplayProgress(100);
      setTargetProgress(100);
      setProgressMessage("Upload complete. Container synced to engine.");
      window.setTimeout(() => {
        setJobId(data.job_id);
        setStatus("uploaded");
      }, 180);
    } catch (error) {
      setErrorMessage(`Upload request failed: ${error instanceof Error ? error.message : "Unknown network error"}`);
      setStatus("error");
    }
  }, [files, uploadWithProgress]);

  const handleScan = useCallback(async () => {
    if (!jobId) return;
    setErrorMessage(null);
    setStatus("scanning");
    pollFailureCountRef.current = 0;
    setTargetProgress(1);
    setDisplayProgress(1);
    setProgressMessage("Preparing scan...");
    const formData = new FormData();
    formData.append("blocked_keywords", JSON.stringify([]));
    try {
      const resp = await apiFetch(`/jobs/${jobId}/scan`, { method: "POST", body: formData });
      if (!resp.ok) {
        setErrorMessage(await readErrorMessage(resp, "Scan request failed"));
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage(`Scan request failed: ${error instanceof Error ? error.message : "Unknown network error"}`);
      setStatus("error");
    }
  }, [jobId, apiFetch]);

  const handleRebrand = useCallback(async () => {
    if (!jobId || !(authorName.trim() || storeName.trim() || signatureFile || authorPictureFile)) return;
    setErrorMessage(null);
    setStatus("processing");
    pollFailureCountRef.current = 0;
    setTargetProgress(1);
    setDisplayProgress(1);
    setProgressMessage("Preparing output package...");
    const formData = new FormData();
    formData.append("author_name", authorName.trim());
    formData.append("store_name", storeName.trim());
    if (signatureFile) formData.append("signature_file", signatureFile);
    if (authorPictureFile) formData.append("author_picture_file", authorPictureFile);
    try {
      const resp = await apiFetch(`/jobs/${jobId}/rebrand`, { method: "POST", body: formData });
      if (!resp.ok) {
        setErrorMessage(await readErrorMessage(resp, "Rebrand request failed"));
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage(`Rebrand request failed: ${error instanceof Error ? error.message : "Unknown network error"}`);
      setStatus("error");
    }
  }, [jobId, authorName, storeName, signatureFile, authorPictureFile]);

  const handleStorageCleanup = async () => {
    if (cleanupBusy) return;
    if (cleanupProgressResetTimerRef.current !== null) {
      window.clearTimeout(cleanupProgressResetTimerRef.current);
      cleanupProgressResetTimerRef.current = null;
    }
    if (cleanupProgressTimerRef.current !== null) {
      window.clearInterval(cleanupProgressTimerRef.current);
      cleanupProgressTimerRef.current = null;
    }
    setCleanupBusy(true);
    setCleanupProgress(1);
    cleanupProgressTimerRef.current = window.setInterval(() => {
      setCleanupProgress((current) => {
        if (current >= 95) return current;
        if (current < 30) return Math.min(95, current + 8);
        if (current < 60) return Math.min(95, current + 5);
        return Math.min(95, current + 3);
      });
    }, 340);
    setCleanupMessage(null);
    try {
      const cleanupQuery = jobId ? `?exclude_job_id=${encodeURIComponent(jobId)}` : "";
      const deepCleanQuery = cleanupQuery ? `${cleanupQuery}&deep_clean=true` : "?deep_clean=true";
      const resp = await apiFetch(`/maintenance/cleanup-storage${deepCleanQuery}`, { method: "POST" });
      if (!resp.ok) {
        setCleanupMessage(await readErrorMessage(resp, "Disk cleanup failed"));
        return;
      }

      const data = (await resp.json().catch(() => ({})));
      const freedBytes = typeof data.freed_bytes === "number" ? data.freed_bytes : 0;
      const removedJobs = typeof data.removed_terminal_jobs === "number" ? data.removed_terminal_jobs : 0;
      const removedOrphans = typeof data.removed_orphan_dirs === "number" ? data.removed_orphan_dirs : 0;
      const removedTemps = typeof data.removed_temp_files === "number" ? data.removed_temp_files : 0;
      const tempFreedBytes = typeof data.temp_freed_bytes === "number" ? data.temp_freed_bytes : 0;
      const tempDeletedFiles = typeof data.temp_deleted_files === "number" ? data.temp_deleted_files : 0;
      const tempDeletedDirs = typeof data.temp_deleted_dirs === "number" ? data.temp_deleted_dirs : 0;
      const tempCleanupEnabled = data.temp_cleanup_enabled === true;
      const totalFreed = freedBytes + tempFreedBytes;
      if (!tempCleanupEnabled) {
        setCleanupMessage(`Desk storage cleanup complete: ${formatFileSize(freedBytes)} freed (${removedJobs} jobs, ${removedOrphans} orphan folders, ${removedTemps} state temp files). System temp cleanup is disabled on server.`);
      } else {
        setCleanupMessage(`Desk storage cleanup complete: ${formatFileSize(totalFreed)} freed (app: ${formatFileSize(freedBytes)}, temp: ${formatFileSize(tempFreedBytes)} | ${removedJobs} jobs, ${removedOrphans} orphan folders, ${removedTemps} state temp files, ${tempDeletedFiles} system temp files, ${tempDeletedDirs} temp folders).`);
      }
    } catch (error) {
      setCleanupMessage(`Disk cleanup failed: ${error instanceof Error ? error.message : "Unknown network error"}`);
    } finally {
      if (cleanupProgressTimerRef.current !== null) {
        window.clearInterval(cleanupProgressTimerRef.current);
        cleanupProgressTimerRef.current = null;
      }
      setCleanupProgress(100);
      cleanupProgressResetTimerRef.current = window.setTimeout(() => {
        setCleanupProgress(0);
        cleanupProgressResetTimerRef.current = null;
      }, 1800);
      setCleanupBusy(false);
    }
  };

  const handleAssetDownload = async (assetPath) => {
    if (!jobId) return;
    try {
      const resp = await apiFetch(`/jobs/${encodeURIComponent(jobId)}/assets/${encodeAssetPath(assetPath)}`, { cache: "no-store" });
      if (!resp.ok) {
        setErrorMessage(await readErrorMessage(resp, "Asset download failed"));
        return;
      }

      const blob = await resp.blob();
      const fileName = assetPath.split("/").pop() || "asset";
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage(`Asset download failed: ${error instanceof Error ? error.message : "Unknown network error"}`);
    }
  };

  useEffect(() => { if (isContinuous && files.length > 0 && status === "idle") void handleUpload(); }, [files, isContinuous, status, handleUpload]);
  useEffect(() => { if (isContinuous && status === "uploaded") void handleScan(); }, [isContinuous, status, handleScan]);
  useEffect(() => {
    if (!(isContinuous && status === "scanned" && manifest)) return;
    const timeoutId = window.setTimeout(() => void handleRebrand(), 500);
    return () => window.clearTimeout(timeoutId);
  }, [isContinuous, status, manifest, handleRebrand]);
  useEffect(() => {
    if (!(isContinuous && status === "completed" && outputUrl)) return;
    if (typeof document !== "undefined") {
      const anchor = document.createElement("a");
      anchor.href = outputUrl;
      anchor.download = "";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    const timeoutId = window.setTimeout(() => processMore(), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isContinuous, status, outputUrl, processMore]);
  useEffect(() => () => {
    if (cleanupProgressTimerRef.current !== null) {
      window.clearInterval(cleanupProgressTimerRef.current);
    }
    if (cleanupProgressResetTimerRef.current !== null) {
      window.clearTimeout(cleanupProgressResetTimerRef.current);
    }
  }, []);

  return (
    <main className="studio-shell fade-in">
      <Head title="Smart Dairy Farm" />
      <header className="hero-panel">
        <div className="hero-top"><div className="hero-badge">Dairy Management Engine</div></div>
        <h1 className="hero-title">Smart Dairy Farm</h1>
        <p className="hero-copy">The future of automated dairy management. Precision tracking and intelligent operational control.</p>
        <div className="hero-actions">
          <button type="button" className="btn-primary hero-clean-btn" onClick={handleStorageCleanup} disabled={cleanupBusy}>
            {cleanupBusy ? "Cleaning Farm Records..." : "Maintain Storage Records"}
          </button>
        </div>
        {(cleanupBusy || cleanupProgress > 0) && <div className="hero-clean-progress"><div className="hero-clean-progress-top"><span>{cleanupBusy ? "Cleaning Progress" : "Cleanup Complete"}</span><strong>{cleanupProgress}%</strong></div><div className="hero-clean-progress-track"><div className="hero-clean-progress-fill" style={{ width: `${cleanupProgress}%` }} /></div></div>}
        {cleanupMessage && <p className="hero-clean-feedback">{cleanupMessage}</p>}
      </header>
      <div className="step-container">
        {status === "idle" && <section className="glass-panel upload-panel"><div className="dropzone" role="button" tabIndex={0} onClick={() => document.getElementById("fileInput")?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); document.getElementById("fileInput")?.click(); } }}><div className="dropzone-icon" aria-hidden="true"></div><div className="dropzone-copy"><span className="section-chip">Phase 1</span><h2>Sync Farm Data Container</h2><p>Upload operational logs, sensor data, or management exports for processing.</p></div><div className="dropzone-formats"><span className="format-pill">.log</span><span className="format-pill">.csv</span><span className="format-pill">.json</span><span className="format-pill">.zip</span></div><input id="fileInput" type="file" multiple className="hidden" accept=".log,.csv,.json,.zip" onChange={(event) => setFiles(Array.from(event.target.files || []))} /></div>{files.length > 0 && <div className="selection-panel"><div className="section-heading"><div><p className="stat-label">Staged Data</p><h3 className="section-title">{files.length} batches ready for processing</h3></div><div className="selection-summary"><div className="mini-stat"><span className="mini-stat-label">Volume</span><strong>{formatFileSize(totalSelectedSize)}</strong></div><div className="mini-stat"><span className="mini-stat-label">Mode</span><strong>{processingMode}</strong></div></div></div><div className="selected-file-grid selected-file-grid--rich">{files.map((file, index) => <article key={`${file.name}-${file.size}-${file.lastModified}`} className="selected-file-card"><div className="selected-file-top"><span className="file-kind">{getFileKindLabel(file.name)}</span><button type="button" className="remove-file-btn" onClick={(event) => { event.stopPropagation(); setFiles((prev) => prev.filter((_, idx) => idx !== index)); }}>Remove</button></div><span className="selected-file-name" title={file.name}>{file.name}</span><div className="selected-file-bottom"><span className="selected-file-size">{formatFileSize(file.size)}</span><span className="file-status-chip">Queued</span></div></article>)}</div></div>}<div className="upload-actions"><button type="button" className="btn-primary launch-button" onClick={handleUpload} disabled={files.length === 0}>Initialize Data Pipeline</button><label className="mode-toggle"><input type="checkbox" checked={isContinuous} onChange={(event) => setIsContinuous(event.target.checked)} /><span>Autonomous Mode (Auto-process incoming signals)</span></label></div>{(authorName || storeName || signatureFile || authorPictureFile) && <div className="saved-config-panel"><div className="saved-config-title">Staged Configuration</div><p className="saved-config-copy">{authorName || "Manager unchanged"}{storeName ? ` / ${storeName}` : ""}</p><div className="saved-config-tags">{signatureFile && <span className="format-pill">Auth. Key</span>}{authorPictureFile && <span className="format-pill">Operator ID</span>}</div></div>}</section>}
        {status === "uploading" && <section className="glass-panel progress-panel stage-panel"><span className="section-chip">Stage 1</span><div className="progress-percent">{displayProgress}%</div><div className="progress-track"><div className="progress-fill" style={{ width: `${displayProgress}%` }} /></div><h2 className="stage-title">Syncing to Engine...</h2><p className="stage-copy">{progressMessage || "Uploading files into the engine workspace."}</p></section>}
        {status === "uploaded" && <section className="glass-panel stage-panel"><span className="section-chip section-chip--success">Stage 2 Ready</span><h2 className="stage-title">Upload Successful</h2><p className="stage-copy">The container is staged and ready for deep heuristic scanning.</p><button type="button" className="btn-primary" onClick={handleScan}>Initialize Deep Scan</button></section>}
        {status === "scanning" && <section className="glass-panel progress-panel stage-panel"><span className="section-chip">Stage 2</span><div className="progress-percent">{displayProgress}%</div><div className="progress-track"><div className="progress-fill" style={{ width: `${displayProgress}%` }} /></div><h2 className="stage-title">Analyzing Binary Plists & Assets...</h2><p className="stage-copy">{progressMessage || "Scanning uploaded files."}</p></section>}
        {status === "scanned" && manifest && <section className="stage-block fade-in"><div className="section-heading section-heading--wide"><div><p className="stat-label">Identity Insights</p><h2 className="section-title">Scan intelligence is ready for review</h2></div><span className="section-chip section-chip--success">Scan Complete</span></div><div className="grid-container stage-grid"><div className="stat-box"><span className="stat-label">Detected Authors</span><div className="author-list">{manifest.detected_authors.length > 0 ? manifest.detected_authors.map((author) => <div key={author} className="author-pill">{author}</div>) : <div className="empty-copy">None detected</div>}</div></div><div className="stat-box"><span className="stat-label">Total Assets Found</span><span className="stat-value">{manifest.assets.length}</span></div><div className="stat-box"><span className="stat-label">Uploaded Files</span><span className="stat-value">{manifest.source_files?.length ?? files.length}</span></div><div className="stat-box"><span className="stat-label">Integrity Status</span><span className="stat-value stat-value--success">Verified</span></div></div><div className="glass-panel stage-section"><div className="section-heading"><div><p className="stat-label">Asset Classification</p><h3 className="section-title">Preview detected files before rebrand</h3></div></div><div className="asset-grid">{manifest.assets.map((asset, index) => <article key={`${asset.rel_path}-${index}`} className="asset-card fade-in" style={{ animationDelay: `${index * 0.03}s` }}><button type="button" className="asset-download-btn" onClick={() => void handleAssetDownload(asset.rel_path)}>Download</button><div className="badge">{asset.category.replace("_", " ")}</div><div className="asset-preview"><img src={getAssetPreviewUrl(asset.rel_path)} alt={asset.category} /></div><p className="asset-name" title={asset.rel_path}>{asset.rel_path.split("/").pop()}</p><div className="asset-meta"><span className="asset-size">{formatFileSize(asset.size)}</span>{asset.source_name && <div className="asset-source-block"><span className="asset-source-label">Source File</span><span className="asset-source" title={asset.source_name}>{asset.source_name}</span></div>}</div></article>)}</div></div><div className="config-panel"><div className="section-heading section-heading--wide"><div><p className="stat-label">Stage 3</p><h2 className="section-title">Rebranding Configuration</h2></div><span className="section-chip">Ready to Apply</span></div><div className="type-summary-grid"><div className="type-summary-card"><span className="stat-label">Total .brushset</span><strong>{containerTotals.brushset}</strong></div><div className="type-summary-card"><span className="stat-label">Total .brush</span><strong>{containerTotals.brush}</strong></div><div className="type-summary-card"><span className="stat-label">Total .procreate</span><strong>{containerTotals.procreate}</strong></div></div><div className="config-grid"><div><label className="stat-label">New Author Name</label><input className="input-field" type="text" placeholder="e.g. Creative" value={authorName} onChange={(event) => setAuthorName(event.target.value)} /></div><div><label className="stat-label">Store Name (Filename)</label><input className="input-field" type="text" placeholder="e.g. Smoke House" value={storeName} onChange={(event) => setStoreName(event.target.value)} /></div><div><label className="stat-label">Signature (PNG)</label><button type="button" className="input-field picker-button" onClick={() => document.getElementById("sigInput")?.click()}>{signatureFile ? signatureFile.name : "Select signature PNG"}</button><input id="sigInput" type="file" accept="image/png" className="hidden" onChange={(event) => setSignatureFile(event.target.files?.[0] || null)} /></div><div><label className="stat-label">Author Pic (PNG)</label><button type="button" className="input-field picker-button" onClick={() => document.getElementById("picInput")?.click()}>{authorPictureFile ? authorPictureFile.name : "Select author picture PNG"}</button><input id="picInput" type="file" accept="image/png" className="hidden" onChange={(event) => setAuthorPictureFile(event.target.files?.[0] || null)} /></div></div><button type="button" className="btn-primary launch-button" onClick={handleRebrand} disabled={!authorName.trim() && !storeName.trim() && !signatureFile && !authorPictureFile}>Apply Changes & Repackage</button></div></section>}
        {status === "processing" && <section className="glass-panel progress-panel stage-panel"><span className="section-chip">Stage 3</span><div className="progress-percent">{displayProgress}%</div><div className="progress-track"><div className="progress-fill" style={{ width: `${displayProgress}%` }} /></div><h2 className="stage-title">Injecting Metadata & Repacking...</h2><p className="stage-copy">{progressMessage || "Reconstructing ZIP container with sanitized assets."}</p></section>}
        {status === "completed" && <section className="glass-panel stage-panel stage-panel--success fade-in"><span className="section-chip section-chip--success">Record Compiled</span><h2 className="stage-title">Optimization Complete</h2><p className="stage-copy">Smart Dairy Farm operational data has been successfully processed.</p>{outputFiles.length > 0 && <div className="selection-panel selection-panel--outputs"><div className="section-heading"><div><p className="stat-label">Processed Logs</p><h3 className="section-title">{outputFiles.length} reports generated</h3></div><div className="selection-summary"><div className="mini-stat"><span className="mini-stat-label">Volume</span><strong>{formatFileSize(totalOutputSize)}</strong></div></div></div><div className="selected-file-grid selected-file-grid--rich">{outputFiles.map((file, index) => <a key={`${file.name}-${index}`} href={`${getResolvedFetchBase()}/jobs/${jobId}/outputs/${index}/download${outputFiles.length <= 1 ? "?cleanup=true" : ""}`} className="selected-file-card output-file-card"><div className="selected-file-top"><span className="file-kind">{getFileKindLabel(file.name)}</span><span className="file-status-chip">Export</span></div><span className="selected-file-name" title={file.name}>{file.name}</span><div className="selected-file-bottom"><span className="selected-file-size">{formatFileSize(file.size)}</span>{file.source_name && <span className="selected-file-source" title={file.source_name}>Source: {file.source_name}</span>}</div></a>)}</div></div>}<a href={outputUrl ?? "#"} className="btn-primary stage-download-link">{outputFiles.length > 1 ? "Export All Reports (.zip)" : "Export Processed Data"}</a><div className="completion-actions"><button type="button" className="secondary-action" onClick={processMore}>Analyze Next Batch</button><button type="button" className="ghost-action" onClick={resetSession}>Reset Parameters</button></div></section>}
        {status === "error" && <section className="glass-panel stage-panel stage-panel--error"><span className="section-chip section-chip--error">Pipeline Failure</span><h2 className="stage-title">Processing Stopped</h2><p className="stage-copy stage-copy--error">{errorMessage || "An error occurred. Check file permissions or format."}</p><button type="button" className="secondary-action" onClick={resetSession}>Retry</button></section>}
      </div>
      <footer className="studio-footer"><span>Secure Management</span><span>Real-time Analytics</span><span>System Status v2.4</span></footer>
    </main>
  );
}
