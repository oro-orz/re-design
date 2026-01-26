type Props = {
  ratio: string;
  className?: string;
};

export function AspectRatioIcon({ ratio, className = "" }: Props) {
  const baseStyle = "border-2 border-current";
  
  if (ratio === "9:16") {
    // 縦長
    return (
      <div className={`${baseStyle} ${className}`} style={{ width: "18px", height: "32px" }} />
    );
  }
  if (ratio === "16:9") {
    // 横長
    return (
      <div className={`${baseStyle} ${className}`} style={{ width: "32px", height: "18px" }} />
    );
  }
  if (ratio === "4:5") {
    // やや縦長
    return (
      <div className={`${baseStyle} ${className}`} style={{ width: "20px", height: "25px" }} />
    );
  }
  if (ratio === "4:3") {
    // やや横長
    return (
      <div className={`${baseStyle} ${className}`} style={{ width: "24px", height: "18px" }} />
    );
  }
  if (ratio === "1:1") {
    // スクエア
    return (
      <div className={`${baseStyle} ${className}`} style={{ width: "24px", height: "24px" }} />
    );
  }
  // custom その他
  return (
    <div className={`${baseStyle} rounded ${className}`} style={{ width: "24px", height: "24px", position: "relative" }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-medium">?</span>
      </div>
    </div>
  );
}
