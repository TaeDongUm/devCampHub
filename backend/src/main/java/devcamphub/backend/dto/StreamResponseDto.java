package devcamphub.backend.dto;

import devcamphub.backend.domain.Stream;
import devcamphub.backend.domain.StreamType;

public record StreamResponseDto(
        Long streamId,
        String title,
        String ownerNickname,
        StreamType type
) {
    public static StreamResponseDto from(Stream stream) {
        return new StreamResponseDto(
                stream.getId(),
                stream.getTitle(),
                stream.getOwner().getNickname(),
                stream.getType()
        );
    }
}
