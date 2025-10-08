package devcamphub.backend.service;

import devcamphub.backend.domain.StreamStatus;
import devcamphub.backend.dto.StreamResponseDto;
import devcamphub.backend.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StreamService {

    private final StreamRepository streamRepository;

    public List<StreamResponseDto> getActiveStreams(Long campId) {
        return streamRepository.findByCampIdAndStatus(campId, StreamStatus.ACTIVE)
                .stream()
                .map(StreamResponseDto::from)
                .collect(Collectors.toList());
    }
}
