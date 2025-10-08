package devcamphub.backend.service;

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
    private static final String SESSION_USER_MAP = "ws:session-user";
    private static final String USER_ROOM_MAP = "ws:user-room";

    private String getRoomKey(String roomId) {
        return ROOM_PREFIX + roomId;
    }

    public void registerSession(String sessionId, String username) {
        redisTemplate.opsForHash().put(SESSION_USER_MAP, sessionId, username);
        log.info("Session registered in Redis: {} for user {}", sessionId, username);
    }

    public String unregisterSession(String sessionId) {
        String username = (String) redisTemplate.opsForHash().get(SESSION_USER_MAP, sessionId);
        if (username != null) {
            redisTemplate.opsForHash().delete(SESSION_USER_MAP, sessionId);
            log.info("Session unregistered from Redis: {} for user {}", sessionId, username);
        }
        return username;
    }

    public void joinRoom(String roomId, String username) {
        String roomKey = getRoomKey(roomId);
        redisTemplate.opsForSet().add(roomKey, username);
        redisTemplate.opsForHash().put(USER_ROOM_MAP, username, roomId);
        Long size = redisTemplate.opsForSet().size(roomKey);
        log.info("User {} joined room {}. Total participants in Redis: {}", username, roomId, size);
    }

    public void leaveRoom(String username) {
        String roomId = (String) redisTemplate.opsForHash().get(USER_ROOM_MAP, username);
        if (roomId != null) {
            String roomKey = getRoomKey(roomId);
            if (Boolean.TRUE.equals(redisTemplate.opsForSet().remove(roomKey, username))) {
                Long size = redisTemplate.opsForSet().size(roomKey);
                log.info("User {} left room {}. Remaining participants in Redis: {}", username, roomId, size);
            }
            redisTemplate.opsForHash().delete(USER_ROOM_MAP, username);
        }
    }

    public String getRoomIdForUser(String username) {
        return (String) redisTemplate.opsForHash().get(USER_ROOM_MAP, username);
    }

    public String getUserBySessionId(String sessionId) {
        return (String) redisTemplate.opsForHash().get(SESSION_USER_MAP, sessionId);
    }
}
