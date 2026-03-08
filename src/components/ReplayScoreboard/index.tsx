import React, { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { parseReplay, formatScore, getCharacterDisplay } from './replayParser';
import type { ReplayInfo } from './replayParser';
// @ts-expect-error -- CSS modules
import styles from './styles.module.css';

type SortKey = 'game' | 'score' | 'character' | 'difficulty' | 'stage' | 'date' | 'slowRate';
type SortDir = 'asc' | 'desc';

interface Toast {
  id: number;
  message: string;
}

const DIFF_ORDER: Record<string, number> = {
  Easy: 0, Normal: 1, Hard: 2, Lunatic: 3, Extra: 4, Phantasm: 5, Overdrive: 6,
};

function getDiffClass(diff: string): string {
  const lower = diff.toLowerCase();
  if (lower === 'easy') return styles.diffEasy;
  if (lower === 'normal') return styles.diffNormal;
  if (lower === 'hard') return styles.diffHard;
  if (lower === 'lunatic') return styles.diffLunatic;
  if (lower === 'extra' || lower === 'phantasm' || lower === 'overdrive') return styles.diffExtra;
  return styles.diffOther;
}

function ReplayScoreboardInner() {
  const [replays, setReplays] = useState<ReplayInfo[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dragActive, setDragActive] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [capturing, setCapturing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const toastId = useRef(0);

  const addToast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const results: ReplayInfo[] = [];

    for (const file of fileArr) {
      if (!file.name.endsWith('.rpy')) {
        addToast(`${file.name}: .rpy 파일만 지원됩니다`);
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const info = parseReplay(buffer);
        results.push(info);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        addToast(`${file.name}: ${msg}`);
      }
    }

    if (results.length > 0) {
      setReplays(prev => [...prev, ...results]);
    }
  }, [addToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return key;
      }
      setSortDir(key === 'score' ? 'desc' : 'asc');
      return key;
    });
  }, []);

  const handleScreenshot = useCallback(async () => {
    if (!captureRef.current || replays.length === 0) return;
    setCapturing(true);
    try {
      const el = captureRef.current;
      el.classList.add(styles.captureMode);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const bgColor = isDark ? '#1b1b1d' : '#ffffff';
      const canvas = await html2canvas(el, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true,
      });
      el.classList.remove(styles.captureMode);
      const link = document.createElement('a');
      link.download = `touhou-scores-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast(`Screenshot failed: ${msg}`);
    } finally {
      setCapturing(false);
    }
  }, [replays.length, addToast]);

  const sortedReplays = React.useMemo(() => {
    const arr = [...replays];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'game': cmp = a.game.localeCompare(b.game); break;
        case 'score': cmp = a.score - b.score; break;
        case 'character': cmp = getCharacterDisplay(a).localeCompare(getCharacterDisplay(b)); break;
        case 'difficulty': cmp = (DIFF_ORDER[a.difficulty] ?? 99) - (DIFF_ORDER[b.difficulty] ?? 99); break;
        case 'stage': cmp = a.stageCount - b.stageCount; break;
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'slowRate': cmp = a.slowRate - b.slowRate; break;
      }
      return cmp * dir;
    });
    return arr;
  }, [replays, sortKey, sortDir]);

  const totalScore = replays.reduce((s, r) => s + r.score, 0);
  const clears = replays.filter(r => r.stage.includes('Clear')).length;
  const games = new Set(replays.map(r => r.game)).size;
  const highestScore = replays.length > 0 ? Math.max(...replays.map(r => r.score)) : 0;

  const renderSortHeader = (key: SortKey, label: string, align?: 'right') => (
    <th
      className={`${sortKey === key ? styles.thActive : ''} ${align === 'right' ? styles.thRight : ''}`}
      onClick={() => handleSort(key)}
    >
      {label}
      {sortKey === key && (
        <span className={styles.sortIndicator}>{sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>
      )}
    </th>
  );

  return (
    <div className={styles.container}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <span className={styles.dropIcon}>&#128190;</span>
        <div className={styles.dropTitle}>
          .rpy 리플레이 파일을 여기에 드래그하거나 클릭하세요
        </div>
        <div className={styles.dropSubtitle}>
          여러 파일을 한번에 업로드할 수 있습니다 (th6~th18, th20 지원)
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".rpy"
          multiple
          className={styles.hiddenInput}
          onChange={handleFileChange}
        />
      </div>

      {/* Capture area for screenshot */}
      {replays.length > 0 && (
        <>
          <div ref={captureRef} className={styles.captureArea}>
            {/* Header for screenshot */}
            <div className={styles.captureHeader}>
              <span className={styles.captureTitle}>Touhou Replay Scoreboard</span>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total Score</span>
                <span className={styles.summaryValueGold}>{formatScore(totalScore)}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Games</span>
                <span className={styles.summaryValuePurple}>{games}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Clears</span>
                <span className={styles.summaryValueGreen}>{clears} / {replays.length}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Highest Score</span>
                <span className={styles.summaryValueGold}>{formatScore(highestScore)}</span>
              </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {renderSortHeader('game', 'Game')}
                    {renderSortHeader('score', 'Score', 'right')}
                    {renderSortHeader('character', 'Character')}
                    {renderSortHeader('difficulty', 'Difficulty')}
                    {renderSortHeader('stage', 'Stage')}
                    {renderSortHeader('date', 'Date')}
                    {renderSortHeader('slowRate', 'Slow', 'right')}
                  </tr>
                </thead>
                <tbody>
                  {sortedReplays.map((r, i) => (
                    <tr key={i}>
                      <td className={styles.gameCell}>{r.game}</td>
                      <td className={styles.scoreCell}>{formatScore(r.score)}</td>
                      <td className={styles.characterCell}>{getCharacterDisplay(r)}</td>
                      <td>
                        <span className={getDiffClass(r.difficulty)}>{r.difficulty}</span>
                      </td>
                      <td className={`${styles.stageCell} ${r.stage.includes('Clear') ? styles.stageClear : styles.stagePartial}`}>
                        {r.stage}
                      </td>
                      <td className={styles.dateCell}>{r.date}</td>
                      <td className={styles.slowCell}>{r.slowRate > 0 ? r.slowRate.toFixed(2) + '%' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Toolbar (outside capture area) */}
          <div className={styles.toolbar}>
            <span className={styles.resultCount}>{replays.length}개 리플레이</span>
            <div className={styles.buttonGroup}>
              <button
                className={styles.screenshotButton}
                onClick={handleScreenshot}
                disabled={capturing}
              >
                {capturing ? 'Capturing...' : 'Save as Image'}
              </button>
              <button
                className={styles.clearButton}
                onClick={() => setReplays([])}
              >
                Clear All
              </button>
            </div>
          </div>
        </>
      )}

      {replays.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>&#127918;</span>
          <div>리플레이 파일을 업로드하면 여기에 결과가 표시됩니다</div>
        </div>
      )}

      {/* Error Toasts */}
      {toasts.length > 0 && (
        <div className={styles.toastContainer}>
          {toasts.map(t => (
            <div key={t.id} className={styles.toast}>
              <span>{t.message}</span>
              <button className={styles.toastClose} onClick={() => removeToast(t.id)}>
                &#10005;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReplayScoreboard(): React.JSX.Element {
  return <ReplayScoreboardInner />;
}
