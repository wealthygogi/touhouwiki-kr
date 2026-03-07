import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "./styles.module.css";
import type { PlacedCharacter, PlacedText } from "./types";
import { games } from "./data/games";

const CharacterTool: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [placedCharacters, setPlacedCharacters] = useState<PlacedCharacter[]>(
    []
  );
  const [placedTexts, setPlacedTexts] = useState<PlacedText[]>([]);
  const [textInput, setTextInput] = useState<string>("");
  const [textColor, setTextColor] = useState<string>("#000000");
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 텍스트 실제 px 크기 측정
  const measureTextSize = useCallback((text: string, fontSize: number) => {
    if (!measureCanvasRef.current) {
      measureCanvasRef.current = document.createElement("canvas");
    }
    const ctx = measureCanvasRef.current.getContext("2d");
    if (!ctx) {
      const fallback = {
        width: Math.ceil(text.length * fontSize * 0.6) + 16,
        height: Math.ceil(fontSize * 1.2) + 8,
      };
      return fallback;
    }
    const fontFamily =
      getComputedStyle(document.body).fontFamily || "sans-serif";
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    // 패딩(.placedText padding: 4px 8px) 보정 포함
    const width = Math.ceil(metrics.width) + 16;
    const height = Math.ceil(fontSize * 1.2) + 8;
    return { width, height };
  }, []);

  // 유틸: 캔버스 크기와 값 클램프
  const getCanvasSize = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return { width: 0, height: 0 };
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  const MIN_SIZE = 50;
  const RESIZE_SENSITIVITY = 0.5; // 민감도(0~1). 낮을수록 더 천천히 커짐

  // 이미지 경로 생성 함수
  const getImagePath = (gameId: string, imageName: string) => {
    // Docusaurus의 올바른 정적 파일 접근 방법 사용
    try {
      const imageModule = require(`@site/static/img/${gameId}/${imageName}`);
      const path = imageModule.default;
      console.log(`이미지 경로 생성: ${path}`);
      return path;
    } catch (error) {
      console.error(
        `이미지 로드 실패 (require): ${gameId}/${imageName}`,
        error
      );
      // fallback으로 상대 경로 사용
      return `/img/${gameId}/${imageName}`;
    }
  };

  const currentGame = games.find((game) => game.id === selectedGame);

  const handleGameChange = (gameId: string) => {
    setSelectedGame(gameId);
    setSelectedCharacter("");
  };

  const handleCharacterChange = (characterId: string) => {
    setSelectedCharacter(characterId);
  };

  const addCharacterToCanvas = () => {
    if (!selectedCharacter || !currentGame) return;

    const character = currentGame.characters.find(
      (c) => c.id === selectedCharacter
    );
    if (!character) return;

    const newPlacedCharacter: PlacedCharacter = {
      id: `${character.id}_${Date.now()}`,
      character,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      isSelected: false,
      isResizing: false,
      resizeHandle: null,
    };

    setPlacedCharacters((prev) => [...prev, newPlacedCharacter]);
  };

  const removeCharacter = (id: string) => {
    setPlacedCharacters((prev) => prev.filter((char) => char.id !== id));
  };

  // 텍스트 추가 함수
  const addText = useCallback(() => {
    if (!textInput.trim()) return;
    const fontSize = 64; // 기본 폰트 크기
    const { width: textWidth, height: textHeight } = measureTextSize(
      textInput,
      fontSize
    );

    const newText: PlacedText = {
      id: `text_${Date.now()}`,
      text: textInput,
      x: 50,
      y: 50,
      width: textWidth,
      height: textHeight,
      fontSize: fontSize,
      color: textColor,
      isSelected: false,
      isResizing: false,
      resizeHandle: null,
    };
    setPlacedTexts((prev) => [...prev, newText]);
    setTextInput("");
  }, [textInput, textColor]);

  // 텍스트 삭제 함수
  const removeText = (id: string) => {
    setPlacedTexts((prev) => prev.filter((text) => text.id !== id));
  };

  // 텍스트 선택 함수
  const handleTextClick = (textId: string) => {
    setPlacedTexts((prev) =>
      prev.map((text) => ({
        ...text,
        isSelected: text.id === textId,
        resizeHandle: null,
      }))
    );
    // 다른 요소들의 선택 해제
    setPlacedCharacters((prev) =>
      prev.map((char) => ({
        ...char,
        isSelected: false,
        resizeHandle: null,
      }))
    );
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, characterId: string) => {
      const character = placedCharacters.find((c) => c.id === characterId);
      if (!character) return;

      setIsDragging(true);
      setDragTarget(characterId);
      setDragOffset({
        x: e.clientX - character.x,
        y: e.clientY - character.y,
      });

      // 선택 상태 변경 및 resizeHandle 설정
      setPlacedCharacters((prev) =>
        prev.map((c) => ({
          ...c,
          isSelected: c.id === characterId,
          resizeHandle: null,
        }))
      );

      // 텍스트 선택 해제
      setPlacedTexts((prev) =>
        prev.map((text) => ({
          ...text,
          isSelected: false,
          resizeHandle: null,
        }))
      );
    },
    [placedCharacters]
  );

  // 텍스트 드래그 시작
  const handleTextMouseDown = useCallback(
    (e: React.MouseEvent, textId: string) => {
      const text = placedTexts.find((t) => t.id === textId);
      if (!text) return;

      setIsDragging(true);
      setDragTarget(textId);
      setDragOffset({
        x: e.clientX - text.x,
        y: e.clientY - text.y,
      });

      // 텍스트 선택
      handleTextClick(textId);
    },
    [placedTexts]
  );

  // 텍스트 리사이징 시작
  const handleTextResizeStart = useCallback(
    (e: React.MouseEvent, textId: string, handle: string) => {
      e.stopPropagation();
      const text = placedTexts.find((t) => t.id === textId);
      if (!text) return;

      setIsResizing(true);
      setResizeTarget(textId);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: text.width,
        height: text.height,
      });

      // 텍스트 선택 및 resizeHandle 설정
      setPlacedTexts((prev) =>
        prev.map((t) => ({
          ...t,
          isSelected: t.id === textId,
          resizeHandle: t.id === textId ? handle : null,
        }))
      );

      // 캐릭터 선택 해제
      setPlacedCharacters((prev) =>
        prev.map((char) => ({
          ...char,
          isSelected: false,
          resizeHandle: null,
        }))
      );
    },
    [placedTexts]
  );

  // 패닝 시작 (손잡이 커서 모드)
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  // 패닝 종료
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTarget(null);
    setIsResizing(false);
    setResizeTarget(null);
    setIsPanning(false);

    // 리사이징이 끝났을 때 resizeHandle 초기화
    setPlacedCharacters((prev) =>
      prev.map((char) => ({
        ...char,
        resizeHandle: null,
      }))
    );

    setPlacedTexts((prev) =>
      prev.map((text) => ({
        ...text,
        resizeHandle: null,
      }))
    );
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, characterId: string, handle: string) => {
      e.stopPropagation();
      const character = placedCharacters.find((c) => c.id === characterId);
      if (!character) return;

      setIsResizing(true);
      setResizeTarget(characterId);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: character.width,
        height: character.height,
      });

      // 선택 상태 변경 및 resizeHandle 설정
      setPlacedCharacters((prev) =>
        prev.map((c) => ({
          ...c,
          isSelected: c.id === characterId,
          resizeHandle: c.id === characterId ? handle : null,
        }))
      );
    },
    [placedCharacters]
  );

  // 빈 공간 클릭 시 언포커싱
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 캔버스 배경을 직접 클릭한 경우에만 언포커싱
    // e.target이 캔버스 자체이거나 캔버스 컨텐츠인 경우 언포커싱
    if (
      e.target === e.currentTarget ||
      e.target === canvasRef.current ||
      (e.target as HTMLElement).classList.contains(styles.canvas) ||
      (e.target as HTMLElement).classList.contains(styles.canvasContent)
    ) {
      console.log("빈 공간 클릭 - 언포커싱 실행");
      setPlacedCharacters((prev) =>
        prev.map((char) => ({
          ...char,
          isSelected: false,
          resizeHandle: null,
        }))
      );
      setPlacedTexts((prev) =>
        prev.map((text) => ({
          ...text,
          isSelected: false,
          resizeHandle: null,
        }))
      );
    }
  }, []);

  // 레이어 순서 조정 함수들
  const bringToFront = useCallback((id: string) => {
    setPlacedCharacters((prev) => {
      const charIndex = prev.findIndex((char) => char.id === id);
      if (charIndex === -1) return prev;

      const newChars = [...prev];
      const [char] = newChars.splice(charIndex, 1);
      newChars.push(char);
      return newChars;
    });

    setPlacedTexts((prev) => {
      const textIndex = prev.findIndex((text) => text.id === id);
      if (textIndex === -1) return prev;

      const newTexts = [...prev];
      const [text] = newTexts.splice(textIndex, 1);
      newTexts.push(text);
      return newTexts;
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setPlacedCharacters((prev) => {
      const charIndex = prev.findIndex((char) => char.id === id);
      if (charIndex === -1) return prev;

      const newChars = [...prev];
      const [char] = newChars.splice(charIndex, 1);
      newChars.unshift(char);
      return newChars;
    });

    setPlacedTexts((prev) => {
      const textIndex = prev.findIndex((text) => text.id === id);
      if (textIndex === -1) return prev;

      const newTexts = [...prev];
      const [text] = newTexts.splice(textIndex, 1);
      newTexts.unshift(text);
      return newTexts;
    });
  }, []);

  const bringForward = useCallback((id: string) => {
    setPlacedCharacters((prev) => {
      const charIndex = prev.findIndex((char) => char.id === id);
      if (charIndex === -1 || charIndex === prev.length - 1) return prev;

      const newChars = [...prev];
      [newChars[charIndex], newChars[charIndex + 1]] = [
        newChars[charIndex + 1],
        newChars[charIndex],
      ];
      return newChars;
    });

    setPlacedTexts((prev) => {
      const textIndex = prev.findIndex((text) => text.id === id);
      if (textIndex === -1 || textIndex === prev.length - 1) return prev;

      const newTexts = [...prev];
      [newTexts[textIndex], newTexts[textIndex + 1]] = [
        newTexts[textIndex + 1],
        newTexts[textIndex],
      ];
      return newTexts;
    });
  }, []);

  const sendBackward = useCallback((id: string) => {
    setPlacedCharacters((prev) => {
      const charIndex = prev.findIndex((char) => char.id === id);
      if (charIndex === -1 || charIndex === 0) return prev;

      const newChars = [...prev];
      [newChars[charIndex], newChars[charIndex - 1]] = [
        newChars[charIndex - 1],
        newChars[charIndex],
      ];
      return newChars;
    });

    setPlacedTexts((prev) => {
      const textIndex = prev.findIndex((text) => text.id === id);
      if (textIndex === -1 || textIndex === 0) return prev;

      const newTexts = [...prev];
      [newTexts[textIndex], newTexts[textIndex - 1]] = [
        newTexts[textIndex - 1],
        newTexts[textIndex],
      ];
      return newTexts;
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing && resizeTarget) {
        // 리사이징 처리
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        // 텍스트 리사이징 처리
        if (resizeTarget.startsWith("text_")) {
          setPlacedTexts((prev) =>
            prev.map((text) => {
              if (text.id === resizeTarget) {
                let newFontSize = text.fontSize;
                let newX = text.x;
                let newY = text.y;

                // 리사이즈 핸들에 따른 폰트 크기 조절
                if (text.resizeHandle?.includes("e")) {
                  newFontSize = Math.max(32, text.fontSize + deltaX * 0.5);
                }
                if (text.resizeHandle?.includes("w")) {
                  newFontSize = Math.max(32, text.fontSize - deltaX * 0.5);
                  // 왼쪽 핸들일 때는 x 위치도 조정
                  newX = text.x + (text.fontSize - newFontSize) * 0.3;
                }
                if (text.resizeHandle?.includes("s")) {
                  newFontSize = Math.max(32, text.fontSize + deltaY * 0.5);
                }
                if (text.resizeHandle?.includes("n")) {
                  newFontSize = Math.max(32, text.fontSize - deltaY * 0.5);
                  // 위쪽 핸들일 때는 y 위치도 조정
                  newY = text.y + (text.fontSize - newFontSize) * 0.3;
                }

                // 폰트 크기에 따른 텍스트 크기 자동 계산
                const { width: newWidth, height: newHeight } = measureTextSize(
                  text.text,
                  newFontSize
                );

                // 경계 클램핑
                const { width: cw, height: ch } = getCanvasSize();
                newX = clamp(newX, 0, Math.max(0, cw - newWidth));
                newY = clamp(newY, 0, Math.max(0, ch - newHeight));

                return {
                  ...text,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                  fontSize: newFontSize,
                };
              }
              return text;
            })
          );
        } else {
          // 캐릭터 리사이징 처리 (대각선은 원본 비율 유지, 직선은 자유)
          setPlacedCharacters((prev) =>
            prev.map((char) => {
              if (char.id === resizeTarget) {
                const ratio =
                  char.aspectRatio ||
                  resizeStart.width / Math.max(1, resizeStart.height);
                let newWidth = resizeStart.width;
                let newHeight = resizeStart.height;
                let newX = char.x;
                let newY = char.y;

                const { width: cw, height: ch } = getCanvasSize();

                const isCorner = ["nw", "ne", "sw", "se"].includes(
                  char.resizeHandle || ""
                );

                if (isCorner) {
                  // 대각선 리사이즈: 원본 비율 유지 + 민감도 적용
                  const dx =
                    (char.resizeHandle?.includes("w") ? -deltaX : deltaX) *
                    RESIZE_SENSITIVITY;
                  const dy =
                    (char.resizeHandle?.includes("n") ? -deltaY : deltaY) *
                    RESIZE_SENSITIVITY;
                  const dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;

                  // 가로 기준으로 새 너비 계산 후 비율로 높이 산출
                  const widthChange = char.resizeHandle?.includes("w")
                    ? -dominant
                    : dominant;
                  newWidth = Math.max(
                    MIN_SIZE,
                    resizeStart.width + widthChange
                  );
                  newHeight = Math.max(MIN_SIZE, Math.round(newWidth / ratio));

                  // 각 코너에 따라 x,y 보정
                  if (char.resizeHandle?.includes("w")) {
                    newX = char.x + (resizeStart.width - newWidth);
                  }
                  if (char.resizeHandle?.includes("n")) {
                    newY = char.y + (resizeStart.height - newHeight);
                  }
                } else {
                  // 직선 핸들: 자유 비율 + 민감도 적용
                  if (char.resizeHandle?.includes("e")) {
                    newWidth = Math.max(
                      MIN_SIZE,
                      resizeStart.width + deltaX * RESIZE_SENSITIVITY
                    );
                  }
                  if (char.resizeHandle?.includes("w")) {
                    newWidth = Math.max(
                      MIN_SIZE,
                      resizeStart.width - deltaX * RESIZE_SENSITIVITY
                    );
                    newX = char.x + (resizeStart.width - newWidth);
                  }
                  if (char.resizeHandle?.includes("s")) {
                    newHeight = Math.max(
                      MIN_SIZE,
                      resizeStart.height + deltaY * RESIZE_SENSITIVITY
                    );
                  }
                  if (char.resizeHandle?.includes("n")) {
                    newHeight = Math.max(
                      MIN_SIZE,
                      resizeStart.height - deltaY * RESIZE_SENSITIVITY
                    );
                    newY = char.y + (resizeStart.height - newHeight);
                  }
                }

                // 경계 클램핑 (우하단 넘치지 않게)
                newX = clamp(newX, 0, Math.max(0, cw - newWidth));
                newY = clamp(newY, 0, Math.max(0, ch - newHeight));
                newWidth = clamp(newWidth, MIN_SIZE, cw - newX);
                newHeight = clamp(newHeight, MIN_SIZE, ch - newY);

                return {
                  ...char,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                };
              }
              return char;
            })
          );
        }
      } else if (isDragging && dragTarget) {
        // 드래그 처리
        if (dragTarget.startsWith("text_")) {
          // 텍스트 드래그 처리
          setPlacedTexts((prev) =>
            prev.map((text) => {
              if (text.id === dragTarget) {
                const { width: cw, height: ch } = getCanvasSize();
                const nextX = e.clientX - dragOffset.x;
                const nextY = e.clientY - dragOffset.y;
                return {
                  ...text,
                  x: clamp(nextX, 0, Math.max(0, cw - text.width)),
                  y: clamp(nextY, 0, Math.max(0, ch - text.height)),
                };
              }
              return text;
            })
          );
        } else {
          // 캐릭터 드래그 처리 (기존 코드)
          setPlacedCharacters((prev) =>
            prev.map((char) => {
              if (char.id === dragTarget) {
                const { width: cw, height: ch } = getCanvasSize();
                const nextX = e.clientX - dragOffset.x;
                const nextY = e.clientY - dragOffset.y;
                return {
                  ...char,
                  x: clamp(nextX, 0, Math.max(0, cw - char.width)),
                  y: clamp(nextY, 0, Math.max(0, ch - char.height)),
                };
              }
              return char;
            })
          );
        }
      } else if (isPanning) {
        // 패닝 처리 (줌 후 화면 이동)
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        // 모든 요소들의 위치를 이동
        setPlacedCharacters((prev) =>
          prev.map((char) => ({
            ...char,
            x: char.x + deltaX,
            y: char.y + deltaY,
          }))
        );

        setPlacedTexts((prev) =>
          prev.map((text) => ({
            ...text,
            x: text.x + deltaX,
            y: text.y + deltaY,
          }))
        );

        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [
      isDragging,
      dragTarget,
      dragOffset,
      isResizing,
      resizeTarget,
      resizeStart,
      isPanning,
      panStart,
    ]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)));
  }, []);

  // PNG 다운로드 함수
  const downloadCanvasAsPNG = () => {
    const root = canvasRef.current;
    if (!root) return;

    import("html2canvas")
      .then((html2canvas) => {
        // 1) 격자 제거 (외곽 캔버스에 일시 적용)
        const gridEl = root as HTMLElement;
        const prevBgImage = gridEl.style.backgroundImage;
        const prevBgSize = gridEl.style.backgroundSize;
        const prevBg = gridEl.style.background;
        gridEl.classList.add(styles.noGrid);
        gridEl.style.backgroundImage = "none";
        gridEl.style.backgroundSize = "auto";
        gridEl.style.background = "none";

        // 2) 선택 해제 (테두리/조작버튼 방지)
        const prevSelectedChars = placedCharacters
          .filter((c) => c.isSelected)
          .map((c) => c.id);
        const prevSelectedTexts = placedTexts
          .filter((t) => t.isSelected)
          .map((t) => t.id);
        setPlacedCharacters((prev) =>
          prev.map((c) => ({ ...c, isSelected: false }))
        );
        setPlacedTexts((prev) =>
          prev.map((t) => ({ ...t, isSelected: false }))
        );

        // 소폭 대기 후 캡처
        setTimeout(() => {
          html2canvas
            .default(root, {
              backgroundColor: "#ffffff",
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              // 조작 UI 제거
              ignoreElements: (el) => {
                const cls = (el as HTMLElement).classList;
                if (!cls) return false;
                return (
                  cls.contains(styles.resizeHandle) ||
                  cls.contains(styles.removeButton) ||
                  cls.contains(styles.layerControls)
                );
              },
            })
            .then((canvas) => {
              // 격자 복원
              gridEl.classList.remove(styles.noGrid);
              gridEl.style.backgroundImage = prevBgImage;
              gridEl.style.backgroundSize = prevBgSize;
              gridEl.style.background = prevBg;

              // 선택 상태 복원
              if (prevSelectedChars.length > 0)
                setPlacedCharacters((prev) =>
                  prev.map((c) => ({
                    ...c,
                    isSelected: prevSelectedChars.includes(c.id),
                  }))
                );
              if (prevSelectedTexts.length > 0)
                setPlacedTexts((prev) =>
                  prev.map((t) => ({
                    ...t,
                    isSelected: prevSelectedTexts.includes(t.id),
                  }))
                );

              canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "character-canvas.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }, "image/png");
            })
            .catch((err) => {
              // 실패 시 복원
              gridEl.classList.remove(styles.noGrid);
              gridEl.style.backgroundImage = prevBgImage;
              gridEl.style.backgroundSize = prevBgSize;
              gridEl.style.background = prevBg;
              setPlacedCharacters((prev) =>
                prev.map((c) => ({
                  ...c,
                  isSelected: prevSelectedChars.includes(c.id),
                }))
              );
              setPlacedTexts((prev) =>
                prev.map((t) => ({
                  ...t,
                  isSelected: prevSelectedTexts.includes(t.id),
                }))
              );
              console.error("PNG 캡처 실패", err);
              alert("이미지 생성에 실패했습니다.");
            });
        }, 150);
      })
      .catch((error) => {
        console.error("html2canvas 로드 실패:", error);
        alert(
          "이미지 다운로드에 실패했습니다. html2canvas 라이브러리를 설치해주세요."
        );
      });
  };

  // Delete 키로 선택된 요소 삭제
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // 선택된 캐릭터 삭제
        const selectedCharacter = placedCharacters.find(
          (char) => char.isSelected
        );
        if (selectedCharacter) {
          removeCharacter(selectedCharacter.id);
          return;
        }

        // 선택된 텍스트 삭제
        const selectedText = placedTexts.find((text) => text.isSelected);
        if (selectedText) {
          removeText(selectedText.id);
          return;
        }
      }
    },
    [placedCharacters, placedTexts]
  );

  useEffect(() => {
    if (selectedCharacter) {
      addCharacterToCanvas();
      setSelectedCharacter("");
    }
  }, [selectedCharacter]);

  useEffect(() => {
    // 키보드 이벤트 리스너 추가
    document.addEventListener("keydown", handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.selectGroup}>
          <label htmlFor="game-select">게임 선택:</label>
          <select
            id="game-select"
            value={selectedGame}
            onChange={(e) => handleGameChange(e.target.value)}
            className={styles.select}
          >
            <option value="">게임을 선택하세요</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="character-select">캐릭터 선택:</label>
          <select
            id="character-select"
            value={selectedCharacter}
            onChange={(e) => handleCharacterChange(e.target.value)}
            className={styles.select}
            disabled={!selectedGame}
          >
            <option value="">캐릭터를 선택하세요</option>
            {currentGame?.characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        {/* 텍스트 추가 컨트롤 */}
        <div className={styles.textControls}>
          <div className={styles.textInputGroup}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="텍스트를 입력하세요"
              className={styles.textInput}
              onKeyPress={(e) => e.key === "Enter" && addText()}
            />
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className={styles.colorPicker}
              title="텍스트 색상 선택"
            />
            <button onClick={addText} className={styles.addTextButton}>
              텍스트 추가
            </button>
          </div>
        </div>

        {/* 다운로드 버튼 */}
        <button onClick={downloadCanvasAsPNG} className={styles.downloadButton}>
          📥 PNG 다운로드
        </button>
      </div>

      <div className={styles.canvasContainer}>
        <div
          ref={canvasRef}
          className={styles.canvas}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        >
          <div
            className={styles.canvasContent}
            style={{ transform: `scale(${zoom})` }}
            onClick={handleCanvasClick}
          >
            {placedCharacters.map((character) => (
              <div
                key={character.id}
                className={`${styles.placedCharacter} ${
                  character.isSelected ? styles.selected : ""
                }`}
                style={{
                  left: character.x,
                  top: character.y,
                  width: character.width,
                  height: character.height,
                }}
                onMouseDown={(e) => handleMouseDown(e, character.id)}
              >
                <img
                  src={character.character.image}
                  alt={character.character.name}
                  className={styles.characterImage}
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    const naturalW = img.naturalWidth;
                    const naturalH = img.naturalHeight;
                    const ratio =
                      naturalW && naturalH ? naturalW / naturalH : undefined;

                    // 캔버스 크기 기준으로 초기 크기 결정: 원본 사이즈가 기준, 다만 캔버스를 넘으면 비율 유지 축소
                    const { width: cw, height: ch } = getCanvasSize();
                    let initW = naturalW || character.width;
                    let initH = naturalH || character.height;
                    if (cw > 0 && ch > 0 && naturalW && naturalH) {
                      const maxW = Math.max(50, cw - 20);
                      const maxH = Math.max(50, ch - 20);
                      const scale = Math.min(
                        1,
                        Math.min(maxW / naturalW, maxH / naturalH)
                      );
                      initW = Math.floor(naturalW * scale);
                      initH = Math.floor(naturalH * scale);
                    }

                    setPlacedCharacters((prev) =>
                      prev.map((c) => {
                        if (c.id !== character.id) return c;
                        if (c.initializedFromNatural) return c;
                        return {
                          ...c,
                          width: initW,
                          height: initH,
                          naturalWidth: naturalW,
                          naturalHeight: naturalH,
                          aspectRatio: ratio,
                          initializedFromNatural: true,
                        } as PlacedCharacter;
                      })
                    );
                    e.currentTarget.style.display = "block";
                  }}
                  onError={(e) => {
                    console.error(
                      "이미지 로드 실패:",
                      character.character.image
                    );
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallbackText = document.createElement("div");
                      fallbackText.className = styles.fallbackText;
                      fallbackText.textContent = character.character.name;
                      parent.appendChild(fallbackText);
                    }
                  }}
                />

                {/* 선택된 캐릭터에만 삭제 버튼과 레이어 순서 조정 버튼 표시 */}
                {character.isSelected && (
                  <>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeCharacter(character.id)}
                      title="삭제"
                    >
                      ×
                    </button>

                    {/* 레이어 순서 조정 버튼들 */}
                    <div className={styles.layerControls}>
                      <button
                        className={styles.layerButton}
                        onClick={() => bringToFront(character.id)}
                        title="맨 앞으로"
                      >
                        ⬆️
                      </button>
                      <button
                        className={styles.layerButton}
                        onClick={() => bringForward(character.id)}
                        title="앞으로"
                      >
                        ⬆
                      </button>
                      <button
                        className={styles.layerButton}
                        onClick={() => sendBackward(character.id)}
                        title="뒤로"
                      >
                        ⬇
                      </button>
                      <button
                        className={styles.layerButton}
                        onClick={() => sendToBack(character.id)}
                        title="맨 뒤로"
                      >
                        ⬇️
                      </button>
                    </div>
                  </>
                )}

                {/* 리사이즈 핸들들 */}
                {character.isSelected && (
                  <>
                    {/* 모서리 핸들들 */}
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleNw}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "nw")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleNe}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "ne")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleSw}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "sw")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleSe}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "se")
                      }
                    />
                    {/* 가운데 핸들들 */}
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleN}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "n")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleS}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "s")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleE}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "e")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleW}`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, character.id, "w")
                      }
                    />
                  </>
                )}
              </div>
            ))}

            {placedTexts.map((text) => (
              <div
                key={text.id}
                className={`${styles.placedText} ${
                  text.isSelected ? styles.selected : ""
                }`}
                style={{
                  left: text.x,
                  top: text.y,
                  width: text.width,
                  height: text.height,
                }}
                onMouseDown={(e) => handleTextMouseDown(e, text.id)}
              >
                <div
                  className={styles.textContent}
                  style={{
                    fontSize: text.fontSize,
                    color: text.color,
                  }}
                >
                  {text.text}
                </div>

                {/* 선택된 텍스트에만 삭제 버튼과 리사이징 핸들 표시 */}
                {text.isSelected && (
                  <>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeText(text.id)}
                      title="삭제"
                    >
                      ×
                    </button>

                    {/* 리사이징 핸들들 */}
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleNw}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "nw")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleNe}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "ne")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleSw}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "sw")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleSe}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "se")
                      }
                    />
                    {/* 가운데 핸들들 */}
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleN}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "n")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleS}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "s")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleE}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "e")
                      }
                    />
                    <div
                      className={`${styles.resizeHandle} ${styles.resizeHandleW}`}
                      onMouseDown={(e) =>
                        handleTextResizeStart(e, text.id, "w")
                      }
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterTool;
