package devcamphub.backend.controller;

import devcamphub.backend.dto.StreamResponseDto;
import devcamphub.backend.service.StreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/camps/{campId}/streams")
@RequiredArgsConstructor
public class StreamController {

    private final StreamService streamService;

    @GetMapping
    public ResponseEntity<List<StreamResponseDto>> getActiveStreams(@PathVariable Long campId) {
        List<StreamResponseDto> activeStreams = streamService.getActiveStreams(campId);
        return ResponseEntity.ok(activeStreams);
    }
}
