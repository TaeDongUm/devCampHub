package devcamphub.backend.controller;

import devcamphub.backend.dto.StreamCreateRequest;
import devcamphub.backend.dto.StreamResponseDto;
import devcamphub.backend.dto.ThumbnailUploadRequest;
import devcamphub.backend.service.StreamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/camps/{campId}/streams")
@RequiredArgsConstructor
public class StreamController {

    private final StreamService streamService;

    @PostMapping
    public ResponseEntity<StreamResponseDto> createStream(
            @PathVariable Long campId,
            @Valid @RequestBody StreamCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        StreamResponseDto createdStream = streamService.createStream(campId, request, userDetails.getUsername());
        URI location = URI.create(String.format("/api/camps/%d/streams/%d", campId, createdStream.streamId()));
        return ResponseEntity.created(location).body(createdStream);
    }

    @GetMapping
    public ResponseEntity<List<StreamResponseDto>> getActiveStreams(@PathVariable Long campId) {
        List<StreamResponseDto> activeStreams = streamService.getActiveStreams(campId);
        return ResponseEntity.ok(activeStreams);
    }

    @PostMapping("/{streamId}/thumbnail")
    public ResponseEntity<Void> uploadThumbnail(
            @PathVariable Long streamId,
            @RequestBody ThumbnailUploadRequest request) {
        // TODO: 요청을 보낸 사용자가 해당 스트림의 소유자인지 확인하는 권한 검사 로직 추가 필요
        streamService.updateThumbnail(streamId, request.getThumbnail());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{streamId}")
    public ResponseEntity<Void> endStream(
            @PathVariable Long campId,
            @PathVariable Long streamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        streamService.endStream(streamId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
