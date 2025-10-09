package devcamphub.backend.dto;

import devcamphub.backend.domain.Stream;
import devcamphub.backend.domain.StreamType;
import devcamphub.backend.domain.Track;

public record StreamResponseDto(
        Long streamId,
        String title,
        String ownerNickname,
        StreamType type,
        Track track,
        String thumbnailUrl
) {
    public static StreamResponseDto from(Stream stream) {
        String thumbnailUrl = null;
        if (stream.getThumbnailPath() != null && !stream.getThumbnailPath().isEmpty()) {
            thumbnailUrl = "/thumbnails/" + stream.getThumbnailPath();
        }
        return new StreamResponseDto(
                stream.getId(),
                stream.getTitle(),
                stream.getOwner().getNickname(),
                stream.getType(),
                stream.getTrack(),
                thumbnailUrl
        );
    }
}
