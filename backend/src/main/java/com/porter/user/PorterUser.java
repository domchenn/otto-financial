package com.porter.user;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PorterUser(
        UUID id,
        String firstName,
        String lastName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
