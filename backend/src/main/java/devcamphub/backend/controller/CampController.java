package devcamphub.backend.controller;

import devcamphub.backend.dto.CampCreateRequest;
import devcamphub.backend.dto.CampJoinRequest;
import devcamphub.backend.dto.CampResponse;
import devcamphub.backend.dto.CampUpdateRequest;
import devcamphub.backend.service.CampService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/camps")
@RequiredArgsConstructor
public class CampController {

    private final CampService campService;

    @PostMapping
    public ResponseEntity<CampResponse> createCamp(
            @Valid @RequestBody CampCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        CampResponse createdCamp = campService.createCamp(request, userDetails.getUsername());

        URI location = URI.create("/api/camps/" + createdCamp.id());
        return ResponseEntity.created(location).body(createdCamp);
    }

    @GetMapping
    public ResponseEntity<List<CampResponse>> getAllCamps() {
        List<CampResponse> camps = campService.findAllCamps();
        return ResponseEntity.ok(camps);
    }

    @GetMapping("/me") // This will map to /api/camps/me
    public ResponseEntity<List<CampResponse>> getMyCamps(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        List<CampResponse> myCamps = campService.findMyCamps(userDetails.getUsername());
        return ResponseEntity.ok(myCamps);
    }

    @GetMapping("/{campId}")
    public ResponseEntity<CampResponse> getCampById(@PathVariable Long campId) {
        CampResponse camp = campService.findCampById(campId);
        return ResponseEntity.ok(camp);
    }

    @PostMapping("/{campId}/join")
    public ResponseEntity<String> joinCamp(
            @PathVariable Long campId,
            @Valid @RequestBody CampJoinRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        campService.joinCamp(campId, request.inviteCode(), userDetails.getUsername());

        return ResponseEntity.ok("캠프에 성공적으로 참여했습니다.");
    }

    @PatchMapping("/{campId}")
    public ResponseEntity<CampResponse> updateCamp(
            @PathVariable Long campId,
            @Valid @RequestBody CampUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        CampResponse updatedCamp = campService.updateCamp(campId, request, userDetails.getUsername());
        return ResponseEntity.ok(updatedCamp);
    }

    @PatchMapping("/{campId}/regenerate-code")
    public ResponseEntity<CampResponse> regenerateInviteCode(
            @PathVariable Long campId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        CampResponse updatedCamp = campService.regenerateInviteCode(campId, userDetails.getUsername());
        return ResponseEntity.ok(updatedCamp);
    }

    @DeleteMapping("/{campId}")
    public ResponseEntity<Void> deleteCamp(
            @PathVariable Long campId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        campService.deleteCamp(campId, userDetails.getUsername());

        return ResponseEntity.noContent().build();
    }
}
