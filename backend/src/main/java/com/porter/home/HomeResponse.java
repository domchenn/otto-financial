package com.porter.home;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

public record HomeResponse(
        Instant generatedAt,
        User user,
        NetWorth netWorth,
        List<AttentionItem> attentionItems,
        List<Suggestion> suggestions,
        List<RecentActivity> recentActivity) {

    public record User(String firstName) {
    }

    public record NetWorth(
            @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
            String currency,
            NetWorthChange change,
            List<HistoryPoint> history) {
    }

    public record NetWorthChange(
            @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
            ChangePeriod period) {
    }

    public record HistoryPoint(
            LocalDate date,
            @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount) {
    }

    public record AttentionItem(
            String id,
            AttentionType type,
            String title,
            String description,
            @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
            String currency,
            Instant dueAt) {
    }

    public record Suggestion(
            String id,
            SuggestionType type,
            SuggestionCategory category,
            String title,
            String description,
            Integer pointsOpportunity) {
    }

    public record RecentActivity(
            String id,
            String merchantName,
            ActivityCategory category,
            String accountName,
            Instant postedAt,
            @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
            String currency,
            TransactionDirection direction,
            TransactionStatus status,
            ActivityInsight insight) {
    }

    public record ActivityInsight(InsightType type, int multiplier) {
    }

    public enum ChangePeriod {
        MONTH_TO_DATE
    }

    public enum AttentionType {
        BENEFIT_EXPIRING
    }

    public enum SuggestionType {
        CARD_OPTIMIZATION
    }

    public enum SuggestionCategory {
        OPTIMIZATION
    }

    public enum ActivityCategory {
        TRAVEL
    }

    public enum TransactionDirection {
        DEBIT
    }

    public enum TransactionStatus {
        POSTED
    }

    public enum InsightType {
        REWARD_MULTIPLIER
    }
}
