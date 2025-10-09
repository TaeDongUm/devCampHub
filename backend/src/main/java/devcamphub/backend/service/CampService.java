package devcamphub.backend.service;

import devcamphub.backend.domain.*;
import devcamphub.backend.dto.CampCreateRequest;
import devcamphub.backend.dto.CampResponse;
import devcamphub.backend.dto.CampUpdateRequest;
import devcamphub.backend.repository.CampMemberRepository;
import devcamphub.backend.repository.CampRepository;
import devcamphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class CampService {

    private final CampRepository campRepository;
    private final UserRepository userRepository;
    private final CampMemberRepository campMemberRepository;

    @Transactional
    public CampResponse createCamp(CampCreateRequest request, String creatorEmail) {
        // 1. 요청을 보낸 사용자를 조회합니다.
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + creatorEmail));

        // 2. 시작 날짜에 따라 캠프 상태를 결정합니다.
        CampStatus status = request.startDate().isAfter(LocalDate.now()) ? CampStatus.UPCOMING : CampStatus.ONGOING;

        // 3. 고유한 초대 코드를 생성합니다.
        String inviteCode = generateUniqueInviteCode();

        // 4. DTO와 추가 정보를 바탕으로 Camp 엔티티를 생성합니다.
        Camp newCamp = Camp.builder()
                .creator(creator)
                .name(request.name())
                .description(request.description())
                .capacity(request.capacity())
                .homepageUrl(request.homepageUrl())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(status)
                .inviteCode(inviteCode)
                .build();

        // 5. 데이터베이스에 저장합니다.
        Camp savedCamp = campRepository.save(newCamp);

        // 6. 응답 DTO로 변환하여 반환합니다.
        return CampResponse.from(savedCamp);
    }

    public List<CampResponse> findAllCamps() {
        return campRepository.findAll().stream()
                .map(CampResponse::from)
                .collect(Collectors.toList());
    }

    public CampResponse findCampById(Long campId) {
        return campRepository.findById(campId)
                .map(CampResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("캠프를 찾을 수 없습니다: " + campId));
    }

    public List<CampResponse> findMyCamps(String userEmail) {
        log.debug("Attempting to find camps for user: {}", userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));
        log.debug("Found user: {} with ID: {}", user.getEmail(), user.getId());

        // Find camps where the user is the creator
        List<Camp> createdCamps = campRepository.findByCreator(user);
        log.debug("Found {} created camps for user: {}", createdCamps.size(), userEmail);

        // Find camps where the user is a member (excluding those they created, to avoid
        // duplicates)
        // duplicates)
        List<Camp> joinedCamps = campMemberRepository.findByUser(user).stream()
                .map(CampMember::getCamp)
                .filter(camp -> !createdCamps.contains(camp)) // Avoid adding already created camps
                .collect(Collectors.toList());
        log.debug("Found {} joined camps for user: {}", joinedCamps.size(), userEmail);

        // Combine and convert to DTOs
        return Stream.concat(createdCamps.stream(), joinedCamps.stream())
                .map(CampResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void joinCamp(Long campId, String inviteCode, String userEmail) {
        // 1. 사용자 조회 및 역할 확인
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));
        if (user.getRole() != Role.STUDENT) {
            throw new IllegalStateException("학생(STUDENT) 역할의 사용자만 캠프에 참여할 수 있습니다.");
        }

        // 2. 캠프 조회 및 상태 확인
        Camp camp = campRepository.findById(campId)
                .orElseThrow(() -> new IllegalArgumentException("캠프를 찾을 수 없습니다: " + campId));
        if (camp.getStatus() == CampStatus.ENDED) {
            throw new IllegalStateException("이미 종료된 캠프에는 참여할 수 없습니다.");
        }

        // 3. 초대 코드 확인
        if (!camp.getInviteCode().equals(inviteCode)) {
            throw new IllegalArgumentException("초대 코드가 일치하지 않습니다.");
        }

        // 4. 중복 참여 확인
        campMemberRepository.findByCampAndUser(camp, user).ifPresent(member -> {
            throw new IllegalStateException("이미 참여한 캠프입니다.");
        });

        // 5. 캠프 멤버로 등록
        CampMember newMember = CampMember.builder()
                .camp(camp)
                .user(user)
                .build();
        campMemberRepository.save(newMember);
    }

    @Transactional
    public CampResponse updateCamp(Long campId, CampUpdateRequest request, String userEmail) {
        // 1. 캠프와 사용자 조회
        Camp camp = campRepository.findById(campId)
                .orElseThrow(() -> new IllegalArgumentException("캠프를 찾을 수 없습니다: " + campId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));

        // 2. 권한 확인 (캠프 생성자인지)
        if (!camp.getCreator().getId().equals(user.getId())) {
            throw new IllegalStateException("캠프 정보를 수정할 권한이 없습니다.");
        }

        // 3. 엔티티의 업데이트 메소드를 호출하여 변경
        camp.updateDetails(request);

        // 4. 변경된 정보를 DTO로 변환하여 반환 (변경 감지로 인해 자동 저장)
        return CampResponse.from(camp);
    }

    @Transactional
    public void deleteCamp(Long campId, String userEmail) {
        // 1. 캠프와 사용자 조회
        Camp camp = campRepository.findById(campId)
                .orElseThrow(() -> new IllegalArgumentException("캠프를 찾을 수 없습니다: " + campId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));

        // 2. 권한 확인 (캠프 생성자인지)
        if (!camp.getCreator().getId().equals(user.getId())) {
            throw new IllegalStateException("캠프를 삭제할 권한이 없습니다.");
        }

        // 3. 연관된 데이터 삭제 (캠프 멤버)
        campMemberRepository.deleteAllByCamp(camp);

        // 4. 캠프 삭제
        campRepository.delete(camp);
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (campRepository.existsByInviteCode(code)); // 코드가 유일한지 확인
        return code;
    }
}
