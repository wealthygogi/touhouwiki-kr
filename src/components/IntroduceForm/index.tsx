import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import styles from "./styles.module.css";

interface FormData {
  name: string;
  ageGroup: string;
  fubFree: string;
  parting: string;
  otherGenres: string;
  solution: string;
  language: string; // 언어 선택 추가
  mainSeries: {
    oldWorks: string[];
    newWorks: string[];
    others: string;
  };
  accountType: {
    writing: boolean;
    drawing: boolean;
    gaming: boolean;
    story: boolean;
    consumption: boolean;
    subscription: boolean;
    cosplay: boolean;
    retweet: boolean;
    likes: boolean;
    daily: boolean;
    timeline: boolean;
    fangirling: boolean;
    other: string;
  };
  dislikedContent: string;
  dislikedContentDetail: string;
  favoriteCharacter: string;
  pairing: string;
  freeDescription: string;
  profileImage: string | null;
  backgroundImage: string | null;
  textAreaHeights: {
    favoriteCharacter: number;
    pairing: number;
    freeDescription: number;
    dislikedContentDetail: number;
  };
}

const IntroduceForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    ageGroup: "",
    fubFree: "",
    parting: "",
    otherGenres: "",
    solution: "",
    language: "한국어", // 기본값 설정
    mainSeries: {
      oldWorks: [],
      newWorks: [],
      others: "",
    },
    accountType: {
      writing: false,
      drawing: false,
      gaming: false,
      story: false,
      consumption: false,
      subscription: false,
      cosplay: false,
      retweet: false,
      likes: false,
      daily: false,
      timeline: false,
      fangirling: false,
      other: "",
    },
    dislikedContent: "",
    dislikedContentDetail: "",
    favoriteCharacter: "",
    pairing: "",
    freeDescription: "",
    profileImage: null,
    backgroundImage: null,
    textAreaHeights: {
      favoriteCharacter: 120,
      pairing: 120,
      freeDescription: 150,
      dislikedContentDetail: 100,
    },
  });

  // 이미지 리사이징 관련 상태
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  // 배경 이미지 리사이징 관련 상태
  const [showBackgroundResizeModal, setShowBackgroundResizeModal] =
    useState(false);
  const [tempBackgroundImage, setTempBackgroundImage] = useState<string | null>(
    null
  );
  const [backgroundCrop, setBackgroundCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [backgroundImageRef, setBackgroundImageRef] =
    useState<HTMLImageElement | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.1);

  const imageFormRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // 언어별 작품명 매핑
  const seriesNames = {
    한국어: {
      oldWorks: ["영이전", "봉마록", "몽시공", "환상향", "괴기담"],
      newWorks: [
        "홍마향",
        "요요몽",
        "영야초",
        "화영총",
        "풍신록",
        "지령전",
        "성련선",
        "신령묘",
        "휘침성",
        "감주전",
        "천공장",
        "귀형수",
        "홍룡동",
        "수왕원",
        "금상경",
      ],
    },
    일본어: {
      oldWorks: ["靈異伝", "封魔録", "夢時空", "幻想郷", "怪綺談"],
      newWorks: [
        "紅魔郷",
        "妖々夢",
        "永夜抄",
        "花映塚",
        "風神録",
        "地霊殿",
        "星蓮船",
        "神霊廟",
        "輝針城",
        "紺珠伝",
        "天空璋",
        "鬼形獣",
        "虹龍洞",
        "獣王園",
        "錦上京",
      ],
    },
    영어: {
      oldWorks: ["01 HRtP", "02 SoEW", "03 PoDD", "04 LLS", "05 MS"],
      newWorks: [
        "06 EoSD",
        "07 PCB",
        "08 IN",
        "09 PoFV",
        "10 MoF",
        "11 SA",
        "12 UFO",
        "13 TD",
        "14 DDC",
        "15 LoLK",
        "16 HSiFS",
        "17 WBaWC",
        "18 UM",
        "19 WBaWC",
        "20 FW",
      ],
    },
  };

  // 언어별 UI 텍스트 매핑
  const uiTexts = {
    한국어: {
      title: "☯️ 동방프로젝트 자기소개표",
      name: "👤 닉네임",
      ageGroup: "🎂 연령대",
      fubFree: "🆓 FUB FREE",
      parting: "👋 이별은",
      otherGenres: "🎭 타장르 언급",
      mainSeries: "📚 주력 시리즈",
      oldWorks: "📖 구작",
      newWorks: "🆕 신작",
      others: "📝 그 외",
      accountType: "💻 계정 유형",
      writing: "글",
      drawing: "그림",
      gaming: "게임",
      story: "썰",
      consumption: "소비",
      subscription: "구독",
      cosplay: "코스",
      retweet: "RT",
      likes: "마음",
      daily: "일상",
      timeline: "탐라대화",
      fangirling: "앓이",
      other: "기타",
      dislikedContent: "⚠️ 불호소재 / 지뢰",
      dislikedContentDetail: "📝 상세 내용",
      solution: "🛠️ 해결방법",
      favoriteCharacter: "💖 애정 캐릭터",
      pairing: "💕 커플링 / 조합",
      freeDescription: "✍️ 자유서술란",
      backgroundImage: "배경 이미지 업로드",
      language: "🌐 Language",
      download: "자기소개서 다운로드",
      ageOptions: ["미성년자", "성인", "비공개"],
      fubOptions: ["Y", "N"],
      partingOptions: ["언팔", "블언블", "블락"],
      genreOptions: ["많음", "중간", "적음/없음"],
      solutionOptions: ["뮤트", "블락", "직멘 아니면 OK"],
      none: "없음",
      exists: "있음",
      notExists: "없음",
      dislikedContentOptions: ["없음", "있음"],
      dislikedContentDetailPlaceholder:
        "불호하는 소재나 지뢰를 자세히 적어주세요",
    },
    일본어: {
      title: "☯️ 東方プロジェクト自己紹介表",
      name: "👤 ニックネーム",
      ageGroup: "🎂 年齢層",
      fubFree: "🆓 FUB FREE",
      parting: "👋 別れは",
      otherGenres: "🎭 他ジャンル言及",
      mainSeries: "📚 主力シリーズ",
      oldWorks: "📖 旧作",
      newWorks: "🆕 新作",
      others: "📝 その他",
      accountType: "💻 アカウントタイプ",
      writing: "字書き",
      drawing: "絵",
      gaming: "ゲーム",
      story: "エピソード",
      consumption: "消費",
      subscription: "購読",
      cosplay: "コスプレ",
      retweet: "RT",
      likes: "いいね",
      daily: "日常",
      timeline: "TL会話",
      fangirling: "推し活",
      other: "その他",
      dislikedContent: "⚠️ 苦手な題材 / 地雷",
      dislikedContentDetail: "📝 詳細内容",
      solution: "🛠️ 解決方法",
      favoriteCharacter: "💖 推しキャラ",
      pairing: "💕 カップリング / 組み合わせ",
      freeDescription: "✍️ 自由記述欄",
      backgroundImage: "背景画像アップロード",
      language: "🌐 Language",
      download: "自己紹介表ダウンロード",
      ageOptions: ["未成年", "成人", "非公開"],
      fubOptions: ["Y", "N"],
      partingOptions: ["アンフォロー", "B解", "ブロック"],
      genreOptions: ["多い", "普通", "少ない/なし"],
      solutionOptions: ["ミュート", "ブロック", "DMでなければOK"],
      none: "なし",
      exists: "あり",
      notExists: "なし",
      dislikedContentOptions: ["なし", "あり"],
      dislikedContentDetailPlaceholder:
        "苦手な題材や地雷を詳しく書いてください",
    },
    영어: {
      title: "☯️ Touhou Project Self-Introduction Form",
      name: "👤 Nickname",
      ageGroup: "🎂 Age Group",
      fubFree: "🆓 FUB FREE",
      parting: "👋 Parting",
      otherGenres: "🎭 Other Genres Mention",
      mainSeries: "📚 Main Series",
      oldWorks: "📖 Old Works",
      newWorks: "🆕 New Works",
      others: "📝 Others",
      accountType: "💻 Account Type",
      writing: "Writing",
      drawing: "Drawing",
      gaming: "Gaming",
      story: "Story",
      consumption: "Consumption",
      subscription: "Subscription",
      cosplay: "Cosplay",
      retweet: "RT",
      likes: "Likes",
      daily: "Daily",
      timeline: "Timeline Chat",
      fangirling: "Fangirling",
      other: "Other",
      dislikedContent: "⚠️ Disliked Content / Triggers",
      dislikedContentDetail: "📝 Details",
      solution: "🛠️ Solution",
      favoriteCharacter: "💖 Favorite Character",
      pairing: "💕 Coupling / Combination",
      freeDescription: "✍️ Free Description",
      backgroundImage: "Background Image Upload",
      language: "🌐 Language",
      download: "Download Self-Introduction",
      ageOptions: ["Minor", "Adult", "Private"],
      fubOptions: ["Y", "N"],
      partingOptions: ["Unfollow", "Block/Unfollow", "Block"],
      genreOptions: ["Many", "Some", "Few/None"],
      solutionOptions: ["Mute", "Block", "No DMs, OK."],
      none: "None",
      exists: "Yes",
      notExists: "No",
      dislikedContentOptions: ["No", "Yes"],
      dislikedContentDetailPlaceholder:
        "Please describe your disliked content or triggers in detail",
    },
  };

  const currentTexts =
    uiTexts[formData.language as keyof typeof uiTexts] || uiTexts.한국어;

  const oldWorksOptions =
    seriesNames[formData.language as keyof typeof seriesNames]?.oldWorks ||
    seriesNames.한국어.oldWorks;
  const newWorksOptions =
    seriesNames[formData.language as keyof typeof seriesNames]?.newWorks ||
    seriesNames.한국어.newWorks;

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMainSeriesChange = (
    type: "oldWorks" | "newWorks",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      mainSeries: {
        ...prev.mainSeries,
        [type]: prev.mainSeries[type].includes(value)
          ? prev.mainSeries[type].filter((item) => item !== value)
          : [...prev.mainSeries[type], value],
      },
    }));
  };

  // 구작/신작 전체 선택/해제
  const handleToggleAllSeries = (type: "oldWorks" | "newWorks") => {
    const options = type === "oldWorks" ? oldWorksOptions : newWorksOptions;
    const currentSelected = formData.mainSeries[type];

    setFormData((prev) => ({
      ...prev,
      mainSeries: {
        ...prev.mainSeries,
        [type]: currentSelected.length === options.length ? [] : options,
      },
    }));
  };

  // 계정 유형 전체 선택/해제
  const handleToggleAllAccountTypes = () => {
    const accountTypeKeys = [
      "writing",
      "drawing",
      "gaming",
      "story",
      "consumption",
      "subscription",
      "cosplay",
      "retweet",
      "likes",
      "daily",
      "timeline",
      "fangirling",
    ] as const;

    const currentSelected = accountTypeKeys.filter(
      (key) => formData.accountType[key]
    );

    const allSelected = currentSelected.length === accountTypeKeys.length;

    setFormData((prev) => ({
      ...prev,
      accountType: {
        ...prev.accountType,
        ...Object.fromEntries(
          accountTypeKeys.map((key) => [key, !allSelected])
        ),
      },
    }));
  };

  const handleAccountTypeChange = (
    field: keyof FormData["accountType"],
    value: boolean | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      accountType: {
        ...prev.accountType,
        [field]: value,
      },
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target?.result as string);
        setShowResizeModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: Crop
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    // 투명 배경 유지
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }
        },
        "image/png",
        1.0
      );
    });
  };

  const handleCropComplete = async () => {
    if (imageRef && crop.width && crop.height) {
      try {
        const croppedImageUrl = await getCroppedImg(imageRef, crop);
        setFormData((prev) => ({
          ...prev,
          profileImage: croppedImageUrl,
        }));
        setShowResizeModal(false);
        setTempImage(null);
      } catch (error) {
        console.error("이미지 크롭 중 오류:", error);
        alert("이미지 크롭 중 오류가 발생했습니다.");
      }
    }
  };

  const handleCancelCrop = () => {
    setShowResizeModal(false);
    setTempImage(null);
  };

  const getBackgroundCroppedImg = (
    image: HTMLImageElement,
    crop: Crop,
    opacity: number
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    // 투명 배경 유지
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 투명도 설정
    ctx.globalAlpha = opacity;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }
        },
        "image/png",
        1.0
      );
    });
  };

  const handleBackgroundCropComplete = async () => {
    if (backgroundImageRef && backgroundCrop.width && backgroundCrop.height) {
      try {
        const croppedImageUrl = await getBackgroundCroppedImg(
          backgroundImageRef,
          backgroundCrop,
          backgroundOpacity
        );
        setFormData((prev) => ({
          ...prev,
          backgroundImage: croppedImageUrl,
        }));
        setShowBackgroundResizeModal(false);
        setTempBackgroundImage(null);
      } catch (error) {
        console.error("배경 이미지 크롭 중 오류:", error);
        alert("배경 이미지 크롭 중 오류가 발생했습니다.");
      }
    }
  };

  const handleCancelBackgroundCrop = () => {
    setShowBackgroundResizeModal(false);
    setTempBackgroundImage(null);
  };

  const handleBackgroundImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempBackgroundImage(e.target?.result as string);
        setShowBackgroundResizeModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextAreaResize = (
    field: keyof FormData["textAreaHeights"],
    height: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      textAreaHeights: {
        ...prev.textAreaHeights,
        [field]: height,
      },
    }));
  };

  const exportToJson = () => {
    const data = JSON.stringify(formData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "touhou-introduce.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as FormData;
        setFormData(data);
      } catch {
        alert("올바른 JSON 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const generateImage = async () => {
    if (!imageFormRef.current) return;

    try {
      // 폼의 실제 스크롤 가능한 높이를 계산
      const scrollHeight = imageFormRef.current.scrollHeight;
      const dynamicHeight = Math.max(600, scrollHeight); // 여백 제거

      // 배경 이미지가 있는 경우 투명도 처리를 위해 별도 처리
      if (formData.backgroundImage) {
        // 임시로 배경 이미지를 제거하고 캡처
        const originalStyle = imageFormRef.current.style.backgroundImage;
        imageFormRef.current.style.backgroundImage = "none";

        const canvas = await html2canvas(imageFormRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#f5f5f5",
          width: 800,
          height: dynamicHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 800,
          windowHeight: dynamicHeight,
        });

        // 배경 이미지 복원
        imageFormRef.current.style.backgroundImage = originalStyle;

        // 배경 이미지를 별도로 로드하고 투명도 적용
        const bgImage = new Image();
        bgImage.crossOrigin = "anonymous";

        bgImage.onload = () => {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // 배경 이미지를 폼 크기에 맞게 리사이징해서 그리기
            const canvasAspectRatio = canvas.width / canvas.height;
            const imageAspectRatio = bgImage.width / bgImage.height;

            let drawWidth,
              drawHeight,
              offsetX = 0,
              offsetY = 0;

            if (imageAspectRatio > canvasAspectRatio) {
              // 이미지가 더 넓은 경우
              drawHeight = canvas.height;
              drawWidth = canvas.height * imageAspectRatio;
              offsetX = (canvas.width - drawWidth) / 2;
            } else {
              // 이미지가 더 높은 경우
              drawWidth = canvas.width;
              drawHeight = canvas.width / imageAspectRatio;
              offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

            // 이미지 다운로드
            const link = document.createElement("a");
            link.download = "introduce_me.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
          }
        };

        bgImage.onerror = () => {
          // 배경 이미지 로드 실패 시 원본 캡처
          const link = document.createElement("a");
          link.download = "introduce_me.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
        };

        bgImage.src = formData.backgroundImage;
      } else {
        // 배경 이미지가 없는 경우 일반 캡처
        const canvas = await html2canvas(imageFormRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#f5f5f5",
          width: 800,
          height: dynamicHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 800,
          windowHeight: dynamicHeight,
        });

        // 이미지 다운로드
        const link = document.createElement("a");
        link.download = "introduce_me.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (error) {
      console.error("이미지 생성 중 오류:", error);
      alert("이미지 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2>{currentTexts.title}</h2>

        <div className={styles.languageSection}>
          <label>{currentTexts.language}</label>
          <select
            value={formData.language}
            onChange={(e) => handleInputChange("language", e.target.value)}
            className={styles.languageSelect}
          >
            <option value="한국어">한국어</option>
            <option value="일본어">日本語</option>
            <option value="영어">English</option>
          </select>
        </div>

        <div className={styles.formGrid}>
          {/* 왼쪽 컬럼 */}
          <div className={styles.leftColumn}>
            {/* 프로필 이미지 */}
            <div className={styles.profileImageSection}>
              <div className={styles.profileImageBox}>
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="프로필 이미지"
                    className={styles.profileImage}
                  />
                ) : (
                  <div className={styles.placeholder}>프로필 이미지</div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
            </div>

            {/* 이름 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.name}</h3>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={styles.textInput}
              />
            </div>

            {/* 연령대 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.ageGroup}</h3>
              <div className={styles.checkboxGroup}>
                {currentTexts.ageOptions.map((option) => (
                  <label key={option} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="ageGroup"
                      value={option}
                      checked={formData.ageGroup === option}
                      onChange={(e) =>
                        handleInputChange("ageGroup", e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* FUB FREE */}
            <div className={styles.formSection}>
              <h3>{currentTexts.fubFree}</h3>
              <div className={styles.checkboxGroup}>
                {currentTexts.fubOptions.map((option) => (
                  <label key={option} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="fubFree"
                      value={option}
                      checked={formData.fubFree === option}
                      onChange={(e) =>
                        handleInputChange("fubFree", e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* 이별은 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.parting}</h3>
              <div className={styles.checkboxGroup}>
                {currentTexts.partingOptions.map((option) => (
                  <label key={option} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="parting"
                      value={option}
                      checked={formData.parting === option}
                      onChange={(e) =>
                        handleInputChange("parting", e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* 타장르 언급 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.otherGenres}</h3>
              <div className={styles.checkboxGroup}>
                {currentTexts.genreOptions.map((option) => (
                  <label key={option} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="otherGenres"
                      value={option}
                      checked={formData.otherGenres === option}
                      onChange={(e) =>
                        handleInputChange("otherGenres", e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 중앙 컬럼 */}
          <div className={styles.middleColumn}>
            {/* 주력 시리즈 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.mainSeries}</h3>

              <div className={styles.seriesSection}>
                <h4
                  className={styles.clickableTitle}
                  onClick={() => handleToggleAllSeries("oldWorks")}
                  title="클릭하여 전체 선택/해제"
                >
                  {currentTexts.oldWorks}
                </h4>
                <div className={styles.checkboxGrid}>
                  {oldWorksOptions.map((option) => (
                    <label key={option} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.mainSeries.oldWorks.includes(option)}
                        onChange={() =>
                          handleMainSeriesChange("oldWorks", option)
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.seriesSection}>
                <h4
                  className={styles.clickableTitle}
                  onClick={() => handleToggleAllSeries("newWorks")}
                  title="클릭하여 전체 선택/해제"
                >
                  {currentTexts.newWorks}
                </h4>
                <div className={styles.checkboxGrid}>
                  {newWorksOptions.map((option) => (
                    <label key={option} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.mainSeries.newWorks.includes(option)}
                        onChange={() =>
                          handleMainSeriesChange("newWorks", option)
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.seriesSection}>
                <h4>{currentTexts.others}</h4>
                <input
                  type="text"
                  value={formData.mainSeries.others}
                  onChange={(e) =>
                    handleInputChange("mainSeries", {
                      ...formData.mainSeries,
                      others: e.target.value,
                    })
                  }
                  className={styles.textInput}
                />
              </div>
            </div>

            {/* 계정 유형 */}
            <div className={styles.formSection}>
              <h3
                className={styles.clickableTitle}
                onClick={handleToggleAllAccountTypes}
                title="클릭하여 전체 선택/해제"
              >
                {currentTexts.accountType}
              </h3>
              <div className={styles.accountTypeGrid}>
                {[
                  { key: "writing", label: currentTexts.writing },
                  { key: "drawing", label: currentTexts.drawing },
                  { key: "gaming", label: currentTexts.gaming },
                  { key: "story", label: currentTexts.story },
                  { key: "consumption", label: currentTexts.consumption },
                  { key: "subscription", label: currentTexts.subscription },
                  { key: "cosplay", label: currentTexts.cosplay },
                  { key: "retweet", label: currentTexts.retweet },
                  { key: "likes", label: currentTexts.likes },
                  { key: "daily", label: currentTexts.daily },
                  { key: "timeline", label: currentTexts.timeline },
                  { key: "fangirling", label: currentTexts.fangirling },
                ].map((item) => (
                  <label key={item.key} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={
                        formData.accountType[
                          item.key as keyof FormData["accountType"]
                        ] as boolean
                      }
                      onChange={(e) =>
                        handleAccountTypeChange(
                          item.key as keyof FormData["accountType"],
                          e.target.checked
                        )
                      }
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <div className={styles.accountTypeExtra}>
                <input
                  type="text"
                  placeholder={currentTexts.other}
                  value={formData.accountType.other}
                  onChange={(e) =>
                    handleAccountTypeChange("other", e.target.value)
                  }
                  className={styles.textInput}
                />
              </div>
            </div>

            {/* 불호소재 / 지뢰 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.dislikedContent}</h3>
              <div className={styles.checkboxGroup}>
                {currentTexts.dislikedContentOptions.map((option) => (
                  <label key={option} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="dislikedContent"
                      value={option}
                      checked={formData.dislikedContent === option}
                      onChange={(e) =>
                        handleInputChange("dislikedContent", e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
              {formData.dislikedContent === currentTexts.exists && (
                <div
                  className={styles.formSection}
                  style={{ marginTop: "15px" }}
                >
                  <h4>{currentTexts.dislikedContentDetail}</h4>
                  <textarea
                    value={formData.dislikedContentDetail}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        handleInputChange(
                          "dislikedContentDetail",
                          e.target.value
                        );
                      }
                    }}
                    className={styles.textarea}
                    rows={3}
                    maxLength={100}
                    style={{
                      height: Math.min(
                        formData.textAreaHeights.dislikedContentDetail,
                        200
                      ),
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                    onMouseUp={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      const newHeight = Math.min(target.scrollHeight, 200);
                      handleTextAreaResize("dislikedContentDetail", newHeight);
                    }}
                    placeholder={currentTexts.dislikedContentDetailPlaceholder}
                  />
                  <div className={styles.charCount}>
                    {formData.dislikedContentDetail.length}/100
                  </div>
                </div>
              )}
            </div>

            {/* 해결방법 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.solution}</h3>
              <div className={styles.checkboxGroup}>
                {currentTexts.solutionOptions.map((option) => (
                  <label key={option} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="solution"
                      value={option}
                      checked={formData.solution === option}
                      onChange={(e) =>
                        handleInputChange("solution", e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className={styles.rightColumn}>
            {/* 애정 캐릭터 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.favoriteCharacter}</h3>
              <textarea
                value={formData.favoriteCharacter}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    handleInputChange("favoriteCharacter", e.target.value);
                  }
                }}
                className={styles.textarea}
                rows={3}
                maxLength={100}
                style={{
                  height: Math.min(
                    formData.textAreaHeights.favoriteCharacter,
                    200
                  ),
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
                onMouseUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  const newHeight = Math.min(target.scrollHeight, 200);
                  handleTextAreaResize("favoriteCharacter", newHeight);
                }}
                placeholder={`${currentTexts.favoriteCharacter} (최대 100자)`}
              />
              <div className={styles.charCount}>
                {formData.favoriteCharacter.length}/100
              </div>
            </div>

            {/* 커플링 / 조합 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.pairing}</h3>
              <textarea
                value={formData.pairing}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    handleInputChange("pairing", e.target.value);
                  }
                }}
                className={styles.textarea}
                rows={3}
                maxLength={100}
                style={{
                  height: Math.min(formData.textAreaHeights.pairing, 200),
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
                onMouseUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  const newHeight = Math.min(target.scrollHeight, 200);
                  handleTextAreaResize("pairing", newHeight);
                }}
                placeholder={`${currentTexts.pairing} (최대 100자)`}
              />
              <div className={styles.charCount}>
                {formData.pairing.length}/100
              </div>
            </div>

            {/* 자유서술란 */}
            <div className={styles.formSection}>
              <h3>{currentTexts.freeDescription}</h3>
              <textarea
                value={formData.freeDescription}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    handleInputChange("freeDescription", e.target.value);
                  }
                }}
                className={styles.textarea}
                rows={10}
                maxLength={300}
                style={{
                  height: Math.min(
                    formData.textAreaHeights.freeDescription,
                    300
                  ),
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
                onMouseUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  const newHeight = Math.min(target.scrollHeight, 300);
                  handleTextAreaResize("freeDescription", newHeight);
                }}
                placeholder={`${currentTexts.freeDescription} (최대 300자)`}
              />
              <div className={styles.charCount}>
                {formData.freeDescription.length}/300
              </div>
            </div>
          </div>
        </div>

        <div className={styles.backgroundImageSection}>
          <label>{currentTexts.backgroundImage}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundImageUpload}
            className={styles.fileInput}
          />
        </div>

        <div className={styles.buttonContainer}>
          <button onClick={generateImage} className={styles.generateButton}>
            {currentTexts.download}
          </button>
        </div>
        <div className={styles.dataButtonContainer}>
          <button onClick={exportToJson} className={styles.dataButton}>
            📤 JSON 저장
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className={styles.dataButton}
          >
            📥 JSON 불러오기
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            onChange={importFromJson}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* 이미지 생성용 숨겨진 폼 */}
      <div ref={imageFormRef} className={styles.hiddenForm}>
        <div
          className={styles.imageForm}
          style={{
            backgroundImage: formData.backgroundImage
              ? `url(${formData.backgroundImage})`
              : "none",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <h1>{currentTexts.title}</h1>

          <div className={styles.imageGrid}>
            {/* 왼쪽 컬럼 */}
            <div className={styles.imageLeftColumn}>
              {/* 프로필 이미지 */}
              <div
                className={styles.imageProfileImage}
                style={{ alignSelf: "center" }}
              >
                {formData.profileImage && (
                  <img
                    src={formData.profileImage}
                    alt="프로필 이미지"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      backgroundColor: "#f0f0f0",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  />
                )}
              </div>

              {/* 이름 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.name}:</h3>
                <div className={styles.imageTextValue}>{formData.name}</div>
              </div>

              {/* 연령대 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.ageGroup}:</h3>
                <div className={styles.imageRadioGroup}>
                  {currentTexts.ageOptions.map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.ageGroup === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>

              {/* FUB FREE */}
              <div className={styles.imageField}>
                <h3>{currentTexts.fubFree}:</h3>
                <div className={styles.imageRadioGroup}>
                  {currentTexts.fubOptions.map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.fubFree === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>

              {/* 이별은 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.parting}:</h3>
                <div className={styles.imageRadioGroup}>
                  {currentTexts.partingOptions.map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.parting === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>

              {/* 타장르 언급 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.otherGenres}:</h3>
                <div className={styles.imageRadioGroup}>
                  {currentTexts.genreOptions.map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.otherGenres === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 중앙 컬럼 */}
            <div className={styles.imageMiddleColumn}>
              {/* 주력 시리즈 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.mainSeries}</h3>
                <div>
                  <h4>{currentTexts.oldWorks}:</h4>
                  <div className={styles.imageCheckboxGrid}>
                    {oldWorksOptions.map((option) => (
                      <span key={option} className={styles.imageCheckbox}>
                        {formData.mainSeries.oldWorks.includes(option)
                          ? "■"
                          : "□"}{" "}
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4>{currentTexts.newWorks}:</h4>
                  <div className={styles.imageCheckboxGrid}>
                    {newWorksOptions.map((option) => (
                      <span key={option} className={styles.imageCheckbox}>
                        {formData.mainSeries.newWorks.includes(option)
                          ? "■"
                          : "□"}{" "}
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4>{currentTexts.others}:</h4>
                  <div className={styles.imageTextValue}>
                    {formData.mainSeries.others || currentTexts.none}
                  </div>
                </div>
              </div>

              {/* 계정 유형 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.accountType}:</h3>
                <div className={styles.imageCheckboxGrid}>
                  {[
                    { key: "writing", label: currentTexts.writing },
                    { key: "drawing", label: currentTexts.drawing },
                    { key: "gaming", label: currentTexts.gaming },
                    { key: "story", label: currentTexts.story },
                    { key: "consumption", label: currentTexts.consumption },
                    { key: "subscription", label: currentTexts.subscription },
                    { key: "cosplay", label: currentTexts.cosplay },
                    { key: "retweet", label: currentTexts.retweet },
                    { key: "likes", label: currentTexts.likes },
                    { key: "daily", label: currentTexts.daily },
                    { key: "timeline", label: currentTexts.timeline },
                    { key: "fangirling", label: currentTexts.fangirling },
                  ].map((item) => (
                    <span key={item.key} className={styles.imageCheckbox}>
                      {(formData.accountType[
                        item.key as keyof FormData["accountType"]
                      ] as boolean)
                        ? "■"
                        : "□"}{" "}
                      {item.label}
                    </span>
                  ))}
                </div>
                {formData.accountType.other && (
                  <div>
                    <h4>{currentTexts.other}:</h4>
                    <div className={styles.imageTextValue}>
                      {formData.accountType.other}
                    </div>
                  </div>
                )}
              </div>

              {/* 불호소재 / 지뢰 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.dislikedContent}:</h3>
                <div className={styles.imageRadioGroup}>
                  {currentTexts.dislikedContentOptions.map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.dislikedContent === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
                {formData.dislikedContent === currentTexts.exists &&
                  formData.dislikedContentDetail && (
                    <div>
                      <h4>{currentTexts.dislikedContentDetail}:</h4>
                      <div className={styles.imageTextValue}>
                        {formData.dislikedContentDetail
                          .split("\n")
                          .map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* 해결방법 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.solution}:</h3>
                <div className={styles.imageRadioGroup}>
                  {currentTexts.solutionOptions.map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.solution === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼 */}
            <div className={styles.imageRightColumn}>
              {/* 애정 캐릭터 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.favoriteCharacter}:</h3>
                <div className={styles.imageTextValue}>
                  {formData.favoriteCharacter.split("\n").map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>

              {/* 커플링 / 조합 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.pairing}:</h3>
                <div className={styles.imageTextValue}>
                  {formData.pairing.split("\n").map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>

              {/* 자유서술란 */}
              <div className={styles.imageField}>
                <h3>{currentTexts.freeDescription}:</h3>
                <div
                  className={styles.imageTextarea}
                  style={{
                    minHeight: formData.textAreaHeights.freeDescription,
                  }}
                >
                  {formData.freeDescription}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 리사이징 모달 */}
      {showResizeModal && tempImage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>프로필 이미지 리사이징</h3>
            <p>이미지를 원하는 크기로 조정하세요</p>

            <div className={styles.cropContainer}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCrop(c)}
                aspect={1}
                circularCrop={false}
              >
                <img
                  src={tempImage}
                  alt="리사이징할 이미지"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImageRef(img);

                    // 이미지 로드 후 자동으로 1:1 정사각형 영역 설정
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const size = Math.min(imgWidth, imgHeight);
                    const x = (imgWidth - size) / 2;
                    const y = (imgHeight - size) / 2;

                    setCrop({
                      unit: "px",
                      width: size,
                      height: size,
                      x: x,
                      y: y,
                    });
                  }}
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                />
              </ReactCrop>
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={handleCancelCrop}
                className={styles.cancelButton}
              >
                취소
              </button>
              <button
                onClick={handleCropComplete}
                className={styles.saveButton}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 배경 이미지 리사이징 모달 */}
      {showBackgroundResizeModal && tempBackgroundImage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>배경 이미지 리사이징</h3>
            <p>이미지를 자기소개표 크기에 맞게 조정하고 투명도를 설정하세요</p>

            <div className={styles.cropContainer}>
              <ReactCrop
                crop={backgroundCrop}
                onChange={(c) => setBackgroundCrop(c)}
                onComplete={(c) => setBackgroundCrop(c)}
                aspect={4 / 3}
                circularCrop={false}
              >
                <img
                  src={tempBackgroundImage}
                  alt="배경 이미지 리사이징"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setBackgroundImageRef(img);

                    // 이미지 로드 후 자동으로 4:3 비율 영역 설정
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const targetRatio = 4 / 3;

                    let cropWidth, cropHeight, x, y;

                    if (imgWidth / imgHeight > targetRatio) {
                      // 이미지가 더 넓은 경우
                      cropHeight = imgHeight;
                      cropWidth = imgHeight * targetRatio;
                      x = (imgWidth - cropWidth) / 2;
                      y = 0;
                    } else {
                      // 이미지가 더 높은 경우
                      cropWidth = imgWidth;
                      cropHeight = imgWidth / targetRatio;
                      x = 0;
                      y = (imgHeight - cropHeight) / 2;
                    }

                    setBackgroundCrop({
                      unit: "px",
                      width: cropWidth,
                      height: cropHeight,
                      x: x,
                      y: y,
                    });
                  }}
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                />
              </ReactCrop>
            </div>

            <div className={styles.opacityControl}>
              <label htmlFor="opacity-slider">
                투명도: {Math.round(backgroundOpacity * 100)}%
              </label>
              <input
                id="opacity-slider"
                type="range"
                min="0.05"
                max="0.3"
                step="0.05"
                value={backgroundOpacity}
                onChange={(e) =>
                  setBackgroundOpacity(parseFloat(e.target.value))
                }
                className={styles.opacitySlider}
              />
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={handleCancelBackgroundCrop}
                className={styles.cancelButton}
              >
                취소
              </button>
              <button
                onClick={handleBackgroundCropComplete}
                className={styles.saveButton}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroduceForm;
