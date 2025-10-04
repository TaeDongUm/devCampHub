import React from "react";
import { useParams } from "react-router-dom";
import ChatPage, { type Msg, type ExtraValues } from "./ChatPage";

export default function Resources() {
  const { campId } = useParams();

  const renderExtra = (
    extraValues: ExtraValues,
    setExtraValues: React.Dispatch<React.SetStateAction<ExtraValues>>
  ) => (
    <input
      className="ipt"
      placeholder="자료 링크 (https://...)"
      value={(extraValues.link as string) || ""}
      onChange={(e) => setExtraValues((prev) => ({ ...prev, link: e.target.value }))}
    />
  );

  const onSend = (msg: Msg, extra: ExtraValues): Msg => {
    const link = typeof extra.link === "string" ? extra.link.trim() : "";
    return {
      ...msg,
      extra: {
        ...(msg.extra || {}),
        ...(link ? { link } : {}),
      },
    };
  };

  return (
    <ChatPage
      channel={`chat:resources:${campId}`}
      placeholder="자료 설명을 입력하세요"
      renderExtra={renderExtra}
      onSend={onSend}
    />
  );
}
