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
  favoriteCharacter: string;
  pairing: string;
  freeDescription: string;
  profileImage: string | null;
  backgroundImage: string | null;
  textAreaHeights: {
    favoriteCharacter: number;
    pairing: number;
    freeDescription: number;
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
    favoriteCharacter: "",
    pairing: "",
    freeDescription: "",
    profileImage: null,
    backgroundImage: null,
    textAreaHeights: {
      favoriteCharacter: 120,
      pairing: 120,
      freeDescription: 150,
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
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);

  const imageFormRef = useRef<HTMLDivElement>(null);

  const oldWorksOptions = ["영이전", "봉마록", "몽시공", "환상향", "괴기담"];

  const newWorksOptions = [
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
  ];

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

  const generateImage = async () => {
    if (!imageFormRef.current) return;

    try {
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
          height: 600,
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
            link.download = "동방프로젝트_자기소개서.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
          }
        };

        bgImage.onerror = () => {
          // 배경 이미지 로드 실패 시 원본 캡처
          const link = document.createElement("a");
          link.download = "동방프로젝트_자기소개서.png";
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
          height: 600,
        });

        // 이미지 다운로드
        const link = document.createElement("a");
        link.download = "동방프로젝트_자기소개서.png";
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
        <h2>동방프로젝트 자기소개표</h2>

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
              <label>이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={styles.textInput}
              />
            </div>

            {/* 연령대 */}
            <div className={styles.formSection}>
              <label>연령대</label>
              <div className={styles.checkboxGroup}>
                {["미성년자", "성인", "비공개"].map((option) => (
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
              <label>FUB FREE</label>
              <div className={styles.checkboxGroup}>
                {["Y", "N"].map((option) => (
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
              <label>이별은</label>
              <div className={styles.checkboxGroup}>
                {["언팔", "블언블", "블락"].map((option) => (
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
              <label>타장르 언급</label>
              <div className={styles.checkboxGroup}>
                {["많음", "중간", "적음/없음"].map((option) => (
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
              <label>주력 시리즈</label>

              <div className={styles.seriesSection}>
                <h4>구작</h4>
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
                <h4>신작</h4>
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
                <h4>그 외</h4>
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
              <label>계정 유형</label>
              <div className={styles.checkboxGrid}>
                {[
                  { key: "writing", label: "글" },
                  { key: "drawing", label: "그림" },
                  { key: "gaming", label: "게임" },
                  { key: "story", label: "썰" },
                  { key: "consumption", label: "소비" },
                  { key: "subscription", label: "구독" },
                  { key: "cosplay", label: "코스" },
                  { key: "retweet", label: "RT" },
                  { key: "likes", label: "마음" },
                  { key: "daily", label: "일상" },
                  { key: "timeline", label: "탐라대화" },
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

              <div className={styles.formSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.accountType.fangirling}
                    onChange={(e) =>
                      handleAccountTypeChange("fangirling", e.target.checked)
                    }
                  />
                  앓이
                </label>
                <input
                  type="text"
                  placeholder="기타 :"
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
              <label>불호소재 / 지뢰</label>
              <div className={styles.checkboxGroup}>
                {["없음", "있음"].map((option) => (
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
            </div>

            {/* 해결방법 */}
            <div className={styles.formSection}>
              <label>해결방법</label>
              <div className={styles.checkboxGroup}>
                {["뮤트", "블락", "직멘 아니면 OK"].map((option) => (
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
              <label>애정 캐릭터</label>
              <textarea
                value={formData.favoriteCharacter}
                onChange={(e) =>
                  handleInputChange("favoriteCharacter", e.target.value)
                }
                className={styles.textarea}
                rows={3}
                style={{ height: formData.textAreaHeights.favoriteCharacter }}
                onMouseUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  handleTextAreaResize(
                    "favoriteCharacter",
                    target.scrollHeight
                  );
                }}
              />
            </div>

            {/* 커플링 / 조합 */}
            <div className={styles.formSection}>
              <label>커플링 / 조합</label>
              <textarea
                value={formData.pairing}
                onChange={(e) => handleInputChange("pairing", e.target.value)}
                className={styles.textarea}
                rows={3}
                style={{ height: formData.textAreaHeights.pairing }}
                onMouseUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  handleTextAreaResize("pairing", target.scrollHeight);
                }}
              />
            </div>

            {/* 자유서술란 */}
            <div className={styles.formSection}>
              <label>자유서술란</label>
              <textarea
                value={formData.freeDescription}
                onChange={(e) =>
                  handleInputChange("freeDescription", e.target.value)
                }
                className={styles.textarea}
                rows={10}
                style={{ height: formData.textAreaHeights.freeDescription }}
                onMouseUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  handleTextAreaResize("freeDescription", target.scrollHeight);
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.backgroundImageSection}>
          <label>배경 이미지 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundImageUpload}
            className={styles.fileInput}
          />
        </div>

        <div className={styles.buttonContainer}>
          <button onClick={generateImage} className={styles.generateButton}>
            자기소개서 다운로드
          </button>
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
          <h1>동방프로젝트 자기소개표</h1>

          <div className={styles.imageGrid}>
            {/* 왼쪽 컬럼 */}
            <div className={styles.imageLeftColumn}>
              {/* 프로필 이미지 */}
              <div className={styles.imageProfileImage}>
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
                <strong>이름:</strong>
                <div className={styles.imageTextValue}>{formData.name}</div>
              </div>

              {/* 연령대 */}
              <div className={styles.imageField}>
                <strong>연령대:</strong>
                <div className={styles.imageRadioGroup}>
                  {["미성년자", "성인", "비공개"].map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.ageGroup === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>

              {/* FUB FREE */}
              <div className={styles.imageField}>
                <strong>FUB FREE:</strong>
                <div className={styles.imageRadioGroup}>
                  {["Y", "N"].map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.fubFree === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>

              {/* 이별은 */}
              <div className={styles.imageField}>
                <strong>이별은:</strong>
                <div className={styles.imageRadioGroup}>
                  {["언팔", "블언블", "블락"].map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.parting === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>

              {/* 타장르 언급 */}
              <div className={styles.imageField}>
                <strong>타장르 언급:</strong>
                <div className={styles.imageRadioGroup}>
                  {["많음", "중간", "적음/없음"].map((option) => (
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
                <strong>주력 시리즈</strong>
                <div>
                  <strong>구작:</strong>
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
                  <strong>신작:</strong>
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
                  <strong>그 외:</strong>
                  <div className={styles.imageTextValue}>
                    {formData.mainSeries.others || "없음"}
                  </div>
                </div>
              </div>

              {/* 계정 유형 */}
              <div className={styles.imageField}>
                <strong>계정 유형:</strong>
                <div className={styles.imageCheckboxGrid}>
                  {[
                    { key: "writing", label: "글" },
                    { key: "drawing", label: "그림" },
                    { key: "gaming", label: "게임" },
                    { key: "story", label: "썰" },
                    { key: "consumption", label: "소비" },
                    { key: "subscription", label: "구독" },
                    { key: "cosplay", label: "코스" },
                    { key: "retweet", label: "RT" },
                    { key: "likes", label: "마음" },
                    { key: "daily", label: "일상" },
                    { key: "timeline", label: "탐라대화" },
                    { key: "fangirling", label: "앓이" },
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
                    <strong>기타:</strong>
                    <div className={styles.imageTextValue}>
                      {formData.accountType.other}
                    </div>
                  </div>
                )}
              </div>

              {/* 불호소재 / 지뢰 */}
              <div className={styles.imageField}>
                <strong>불호소재 / 지뢰:</strong>
                <div className={styles.imageRadioGroup}>
                  {["없음", "있음"].map((option) => (
                    <span key={option} className={styles.imageRadio}>
                      {formData.dislikedContent === option ? "●" : "○"} {option}
                    </span>
                  ))}
                </div>
              </div>

              {/* 해결방법 */}
              <div className={styles.imageField}>
                <strong>해결방법:</strong>
                <div className={styles.imageRadioGroup}>
                  {["뮤트", "블락", "직멘 아니면 OK"].map((option) => (
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
                <strong>애정 캐릭터:</strong>
                <div className={styles.imageTextValue}>
                  {formData.favoriteCharacter}
                </div>
              </div>

              {/* 커플링 / 조합 */}
              <div className={styles.imageField}>
                <strong>커플링 / 조합:</strong>
                <div className={styles.imageTextValue}>{formData.pairing}</div>
              </div>

              {/* 자유서술란 */}
              <div className={styles.imageField}>
                <strong>자유서술란:</strong>
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
                min="0.1"
                max="1.0"
                step="0.1"
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
