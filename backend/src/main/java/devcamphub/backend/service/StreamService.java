package devcamphub.backend.service;

import devcamphub.backend.domain.*;
import devcamphub.backend.dto.StreamCreateRequest;
import devcamphub.backend.dto.StreamResponseDto;
import devcamphub.backend.repository.CampRepository;
import devcamphub.backend.repository.StreamRepository;
import devcamphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StreamService {

    private final StreamRepository streamRepository;
    private final UserRepository userRepository;
    private final CampRepository campRepository;

    private final String uploadDir = "uploads/thumbnails";

    @Transactional
    public StreamResponseDto createStream(Long campId, StreamCreateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Camp camp = campRepository.findById(campId)
                .orElseThrow(() -> new IllegalArgumentException("캠프를 찾을 수 없습니다."));

        // TODO: 사용자가 해당 캠프의 멤버인지, 강의 개설 권한이 있는지(관리자) 확인하는 로직 추가 필요

        Stream newStream = Stream.builder()
                .camp(camp)
                .owner(user)
                .title(request.title())
                .type(request.type())
                .track(request.track())
                .build();

        Stream savedStream = streamRepository.save(newStream);
        return StreamResponseDto.from(savedStream);
    }

    public List<StreamResponseDto> getActiveStreams(Long campId) {
        return streamRepository.findByCampIdAndStatus(campId, StreamStatus.ACTIVE)
                .stream()
                .map(StreamResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void endStream(Long streamId, String userEmail) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new IllegalArgumentException("스트림을 찾을 수 없습니다."));

        // 스트림 소유자만 종료할 수 있도록 권한 확인
        if (!stream.getOwner().getEmail().equals(userEmail)) {
            throw new IllegalStateException("스트림을 종료할 권한이 없습니다.");
        }

        stream.endStream(); // 상태를 INACTIVE로 변경
        streamRepository.save(stream);
    }

    @Transactional
    public void updateThumbnail(Long streamId, String base64ImageData) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new IllegalArgumentException("스트림을 찾을 수 없습니다."));

        // 데이터 URL 접두사 제거 (e.g., "data:image/jpeg;base64,")
        String imageDataBytes = base64ImageData.substring(base64ImageData.indexOf(",") + 1);

        // Base64 디코딩
        byte[] decodedBytes = Base64.getDecoder().decode(imageDataBytes);

        // 파일 경로 및 디렉토리 설정
        File uploadPath = new File(uploadDir);
        if (!uploadPath.exists()) {
            uploadPath.mkdirs();
        }

        // 파일 저장
        String fileName = streamId + ".jpg";
        File file = new File(uploadPath, fileName);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(decodedBytes);
        } catch (IOException e) {
            // TODO: 예외 처리 고도화
            throw new RuntimeException("썸네일 파일 저장에 실패했습니다.", e);
        }

        // 엔티티에 파일 경로 저장
        stream.setThumbnailPath(fileName);
        streamRepository.save(stream);
    }
}
