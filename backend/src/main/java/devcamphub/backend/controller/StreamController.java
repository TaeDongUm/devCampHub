package devcamphub.backend.controller;

import devcamphub.backend.dto.StreamCreateRequest;
import devcamphub.backend.dto.StreamResponseDto;
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

    @DeleteMapping("/{streamId}")
    public ResponseEntity<Void> endStream(
            @PathVariable Long campId,
            @PathVariable Long streamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        streamService.endStream(streamId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
