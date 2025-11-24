package devcamphub.backend.service;

import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketSessionRegistry {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String ROOM_PREFIX = "ws:room:";
    private static final String SESSION_NICKNAME_MAP = "ws:session-nickname";
    private static final String NICKNAME_ROOM_MAP = "ws:nickname-room";

    private String getRoomKey(String roomId) {
        return ROOM_PREFIX + roomId;
    }

    public void registerSession(String sessionId, String nickname) {
        redisTemplate.opsForHash().put(SESSION_NICKNAME_MAP, sessionId, nickname);
        log.info("Session registered in Redis: {} for nickname {}", sessionId, nickname);
    }

    public String unregisterSession(String sessionId) {
        String nickname = (String) redisTemplate.opsForHash().get(SESSION_NICKNAME_MAP, sessionId);
        if (nickname != null) {
            redisTemplate.opsForHash().delete(SESSION_NICKNAME_MAP, sessionId);
            log.info("Session unregistered from Redis: {} for nickname {}", sessionId, nickname);
        }
        return nickname;
    }

    public void joinRoom(String roomId, String nickname) {
        String roomKey = getRoomKey(roomId);
        redisTemplate.opsForSet().add(roomKey, nickname);
        redisTemplate.opsForHash().put(NICKNAME_ROOM_MAP, nickname, roomId);
        Long size = redisTemplate.opsForSet().size(roomKey);
        log.info("Nickname {} joined room {}. Total participants in Redis: {}", nickname, roomId, size);
    }

    public void leaveRoom(String nickname) {
        String roomId = (String) redisTemplate.opsForHash().get(NICKNAME_ROOM_MAP, nickname);
        if (roomId != null) {
            String roomKey = getRoomKey(roomId);
            if (Boolean.TRUE.equals(redisTemplate.opsForSet().remove(roomKey, nickname))) {
                Long size = redisTemplate.opsForSet().size(roomKey);
                log.info("Nickname {} left room {}. Remaining participants in Redis: {}", nickname, roomId, size);
            }
            redisTemplate.opsForHash().delete(NICKNAME_ROOM_MAP, nickname);
        }
    }

    public Set<String> getUsersInRoom(String roomId) {
        String roomKey = getRoomKey(roomId);
        return redisTemplate.opsForSet().members(roomKey);
    }

    public String getRoomIdForUser(String nickname) {
        return (String) redisTemplate.opsForHash().get(NICKNAME_ROOM_MAP, nickname);
    }

    public String getNicknameBySessionId(String sessionId) {
        return (String) redisTemplate.opsForHash().get(SESSION_NICKNAME_MAP, sessionId);
    }
}
