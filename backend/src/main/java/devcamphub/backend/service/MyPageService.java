package devcamphub.backend.service;

import devcamphub.backend.domain.User;
import devcamphub.backend.dto.AttendanceResponse;
import devcamphub.backend.dto.CampResponse;
import devcamphub.backend.dto.MyProfileResponse;
import devcamphub.backend.dto.ProfileUpdateRequest;
import devcamphub.backend.repository.AttendanceRepository;
import devcamphub.backend.repository.CampMemberRepository;
import devcamphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MyPageService {

    private final UserRepository userRepository;
    private final CampMemberRepository campMemberRepository;
    private final AttendanceRepository attendanceRepository;

    public MyProfileResponse getMyProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));
        return MyProfileResponse.from(user);
    }

    @Transactional
    public MyProfileResponse updateMyProfile(String userEmail, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));
        
        // 닉네임 중복 확인 (자기 자신은 제외)
        if (request.nickname() != null && !request.nickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(request.nickname())) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
        }

        user.updateProfile(request);
        return MyProfileResponse.from(userRepository.save(user));
    }

    public List<CampResponse> getMyCamps(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));

        return campMemberRepository.findByUser(user).stream()
                .map(campMember -> CampResponse.from(campMember.getCamp()))
                .collect(Collectors.toList());
    }

    public List<AttendanceResponse> getMyAttendanceForCamp(String userEmail, Long campId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));

        return attendanceRepository.findByCampIdAndUserId(campId, user.getId()).stream()
                .map(AttendanceResponse::from)
                .collect(Collectors.toList());
    }
}
