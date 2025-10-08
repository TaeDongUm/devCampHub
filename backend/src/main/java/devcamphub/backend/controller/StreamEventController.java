package devcamphub.backend.controller;

import devcamphub.backend.dto.StreamEventRequest;
import devcamphub.backend.service.StreamSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/streams/events")
@RequiredArgsConstructor
public class StreamEventController {

    private final StreamSessionService streamSessionService;

    @PostMapping
    public ResponseEntity<Void> handleStreamEvent(
            @Valid @RequestBody StreamEventRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        streamSessionService.handleStreamEvent(request, userDetails.getUsername());

        return ResponseEntity.ok().build();
    }
}
