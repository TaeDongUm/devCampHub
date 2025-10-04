import React from "react";
import { useParams } from "react-router-dom";
import ChatPage, { type Msg, type ExtraValues } from "./ChatPage";

export default function Lounge() {
  const { campId } = useParams();

  const renderExtra = (
    extraValues: ExtraValues,
    setExtraValues: React.Dispatch<React.SetStateAction<ExtraValues>>
  ) => (
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
        // 같은 파일 재선택 가능케 input value 초기화
        e.currentTarget.value = "";
      }}
    />
  );

  const onSend = (msg: Msg, extra: ExtraValues): Msg => {
    const image = typeof extra.image === "string" ? extra.image : undefined;
    return {
      ...msg,
      extra: {
        ...(msg.extra || {}),
        ...(image ? { image } : {}),
      },
    };
  };

  return (
    <ChatPage
      channel={`chat:lounge:${campId}`}
      placeholder="일상 메시지를 입력하세요"
      renderExtra={renderExtra}
      onSend={onSend}
    />
  );
}
