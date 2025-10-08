package devcamphub.backend.dto;

import devcamphub.backend.domain.Attendance;
import devcamphub.backend.domain.AttendanceStatus;

import java.time.LocalDate;

public record AttendanceResponse(
        LocalDate date,
        Integer totalMinutes,
        AttendanceStatus status
) {
    public static AttendanceResponse from(Attendance attendance) {
        return new AttendanceResponse(
                attendance.getDate(),
                attendance.getTotalMinutes(),
                attendance.getStatus()
        );
    }
}
