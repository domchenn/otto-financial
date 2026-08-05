package com.porter.user;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class PorterUserRepository {

    private final JdbcClient jdbcClient;

    public PorterUserRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public PorterUser create(String firstName, String lastName) {
        UUID id = UUID.randomUUID();

        return jdbcClient.sql("""
                INSERT INTO porter_user (id, first_name, last_name)
                VALUES (:id, :firstName, :lastName)
                RETURNING id, first_name, last_name, created_at, updated_at
                """)
                .param("id", id)
                .param("firstName", firstName)
                .param("lastName", lastName)
                .query(this::mapUser)
                .single();
    }

    public Optional<PorterUser> findById(UUID id) {
        return jdbcClient.sql("""
                SELECT id, first_name, last_name, created_at, updated_at
                FROM porter_user
                WHERE id = :id
                """)
                .param("id", id)
                .query(this::mapUser)
                .optional();
    }

    private PorterUser mapUser(ResultSet resultSet, int rowNumber) throws SQLException {
        return new PorterUser(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("first_name"),
                resultSet.getString("last_name"),
                resultSet.getObject("created_at", OffsetDateTime.class),
                resultSet.getObject("updated_at", OffsetDateTime.class));
    }
}
