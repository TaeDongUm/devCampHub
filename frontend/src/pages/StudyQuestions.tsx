import React from "react";
import { useParams } from "react-router-dom";
import ChatPage, { type Msg, type ExtraValues } from "./ChatPage";

export default function StudyQuestions() {
  const { campId } = useParams();

  const renderExtra = (
    extraValues: ExtraValues,
    setExtraValues: React.Dispatch<React.SetStateAction<ExtraValues>>
  ) => (
    <div className="study-extra" style={{ display: "grid", gap: 6 }}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : "";
            setExtraValues((prev) => ({ ...prev, image: dataUrl }));
          };
          reader.readAsDataURL(file);
          e.currentTarget.value = "";
        }}
      />
      <textarea
        className="ipt ta"
        placeholder="코드블럭을 붙여넣거나 작성하세요"
        value={(extraValues.code as string) || ""}
        onChange={(e) => setExtraValues((prev) => ({ ...prev, code: e.target.value }))}
      />
    </div>
  );

  const onSend = (msg: Msg, extra: ExtraValues): Msg => {
    const image = typeof extra.image === "string" ? extra.image : undefined;
    const code = typeof extra.code === "string" ? extra.code : undefined;
    return {
      ...msg,
      extra: {
        ...(msg.extra || {}),
        ...(image ? { image } : {}),
        ...(code ? { code } : {}),
      },
    };
  };

  return (
    <ChatPage
      channel={`chat:study:${campId}`}
      placeholder="질문을 입력하세요"
      renderExtra={renderExtra}
      onSend={onSend}
    />
  );
}
