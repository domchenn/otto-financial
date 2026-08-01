package com.porter.home;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(HomeController.class)
@Import(HomeService.class)
class HomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsHomeSnapshot() throws Exception {
        mockMvc.perform(get("/api/v1/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.generatedAt").value("2026-07-31T12:00:00Z"))
                .andExpect(jsonPath("$.user.firstName").value("Dominic"))
                .andExpect(jsonPath("$.netWorth.amount").value("128406.00"))
                .andExpect(jsonPath("$.netWorth.currency").value("USD"))
                .andExpect(jsonPath("$.netWorth.change.period").value("MONTH_TO_DATE"))
                .andExpect(jsonPath("$.attentionItems[0].type").value("BENEFIT_EXPIRING"))
                .andExpect(jsonPath("$.suggestions[0].pointsOpportunity").value(782))
                .andExpect(jsonPath("$.recentActivity[0].amount").value("241.30"))
                .andExpect(jsonPath("$.recentActivity[0].insight.multiplier").value(5));
    }
}
