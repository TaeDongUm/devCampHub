package devcamphub.backend.service;

import devcamphub.backend.domain.Role;
import devcamphub.backend.domain.Stream;
import devcamphub.backend.domain.StreamType;
import devcamphub.backend.domain.User;
import devcamphub.backend.dto.StreamEventRequest;
import devcamphub.backend.repository.CampRepository;
import devcamphub.backend.repository.StreamRepository;
import devcamphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreamSessionService {

    private final RedisTemplate<String, String> redisTemplate;
    private final StreamRepository streamRepository;
    private final UserRepository userRepository;
    private final CampRepository campRepository;

    private static final String SESSION_PREFIX = "stream:session:";
    private static final long HEARTBEAT_TTL_SECONDS = 45; // 30초마다 하트비트, 15초의 여유시간

    private String getSessionKey(String streamSessionId) {
        return SESSION_PREFIX + streamSessionId;
    }

    @Transactional
    public void handleStreamEvent(StreamEventRequest request, String userEmail) {
        String sessionKey = getSessionKey(request.streamSessionId());

        switch (request.eventType()) {
            case START:
                startStream(sessionKey, request, userEmail);
                break;

            case HEARTBEAT:
                heartbeatStream(sessionKey);
                break;

            case STOP:
                stopStream(sessionKey);
                break;
        }
    }

    private void startStream(String sessionKey, StreamEventRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail));

        // 스트림 타입 결정 (관리자는 LIVE, 학생은 MOGAKCO)
        StreamType streamType = (user.getRole() == Role.ADMIN) ? StreamType.LIVE : StreamType.MOGAKCO;

        // DB에 스트림 정보 저장
        Stream newStream = Stream.builder()
                .camp(campRepository.findById(request.campId()).orElse(null)) // campId가 없을 경우 null
                .owner(user)
                .title(request.streamTitle())
                .type(streamType)
                .build();
        streamRepository.save(newStream);

        // Redis에 세션 정보 저장
        redisTemplate.opsForHash().put(sessionKey, "streamId", newStream.getId().toString());
        redisTemplate.opsForHash().put(sessionKey, "userId", user.getId().toString());
        redisTemplate.expire(sessionKey, HEARTBEAT_TTL_SECONDS, TimeUnit.SECONDS);

        log.info("Stream START: sessionId={}, streamId={}, userId={}", request.streamSessionId(), newStream.getId(), user.getId());
    }

    private void heartbeatStream(String sessionKey) {
        // 세션의 TTL(Time-To-Live)만 갱신
        if (Boolean.TRUE.equals(redisTemplate.hasKey(sessionKey))) {
            redisTemplate.expire(sessionKey, HEARTBEAT_TTL_SECONDS, TimeUnit.SECONDS);
            log.debug("Stream HEARTBEAT: sessionId={}", sessionKey);
        } else {
            log.warn("HEARTBEAT for non-existent session: {}", sessionKey);
        }
    }

    private void stopStream(String sessionKey) {
        // Redis에서 streamId 조회
        String streamIdStr = (String) redisTemplate.opsForHash().get(sessionKey, "streamId");
        
        if (streamIdStr != null) {
            // DB에서 스트림 상태를 ENDED로 변경
            long streamId = Long.parseLong(streamIdStr);
            streamRepository.findById(streamId).ifPresent(stream -> {
                stream.endStream();
                streamRepository.save(stream);
                log.info("Stream STOPPED in DB: streamId={}", streamId);
            });
        } else {
            log.warn("STOP request for a session without streamId: {}", sessionKey);
        }

        // Redis에서 세션 정보 삭제
        redisTemplate.delete(sessionKey);
        log.info("Stream session deleted from Redis: {}", sessionKey);
    }
}
