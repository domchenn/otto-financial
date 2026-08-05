package com.porter.user;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class PorterUserRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18-alpine");

    @Autowired
    private PorterUserRepository repository;

    @Test
    void createsAndFindsUser() {
        PorterUser created = repository.create("Test", "User");

        assertThat(created.id()).isNotNull();
        assertThat(created.firstName()).isEqualTo("Test");
        assertThat(created.lastName()).isEqualTo("User");
        assertThat(created.createdAt()).isNotNull();
        assertThat(created.updatedAt()).isNotNull();

        assertThat(repository.findById(created.id())).contains(created);
    }
}
