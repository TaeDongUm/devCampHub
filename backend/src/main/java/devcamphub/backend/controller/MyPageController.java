package devcamphub.backend.controller;

import devcamphub.backend.dto.AttendanceResponse;
import devcamphub.backend.dto.CampResponse;
import devcamphub.backend.dto.MyProfileResponse;
import devcamphub.backend.dto.ProfileUpdateRequest;
import devcamphub.backend.service.MyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

    @GetMapping
    public ResponseEntity<MyProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        MyProfileResponse myProfile = myPageService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(myProfile);
    }

    @PutMapping
    public ResponseEntity<MyProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ProfileUpdateRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        MyProfileResponse updatedProfile = myPageService.updateMyProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(updatedProfile);
    }

    @GetMapping("/camps")
    public ResponseEntity<List<CampResponse>> getMyCamps(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        List<CampResponse> myCamps = myPageService.getMyCamps(userDetails.getUsername());
        return ResponseEntity.ok(myCamps);
    }

    @GetMapping("/camps/{campId}/attendance")
    public ResponseEntity<List<AttendanceResponse>> getMyAttendanceForCamp(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long campId) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        List<AttendanceResponse> myAttendance = myPageService.getMyAttendanceForCamp(userDetails.getUsername(), campId);
        return ResponseEntity.ok(myAttendance);
    }
}
