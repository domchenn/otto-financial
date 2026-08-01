package com.porter.home;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.porter.home.HomeResponse.ActivityCategory;
import com.porter.home.HomeResponse.ActivityInsight;
import com.porter.home.HomeResponse.AttentionItem;
import com.porter.home.HomeResponse.AttentionType;
import com.porter.home.HomeResponse.ChangePeriod;
import com.porter.home.HomeResponse.HistoryPoint;
import com.porter.home.HomeResponse.InsightType;
import com.porter.home.HomeResponse.NetWorth;
import com.porter.home.HomeResponse.NetWorthChange;
import com.porter.home.HomeResponse.RecentActivity;
import com.porter.home.HomeResponse.Suggestion;
import com.porter.home.HomeResponse.SuggestionCategory;
import com.porter.home.HomeResponse.SuggestionType;
import com.porter.home.HomeResponse.TransactionDirection;
import com.porter.home.HomeResponse.TransactionStatus;
import com.porter.home.HomeResponse.User;

@Service
public class HomeService {

        public HomeResponse getHome() {
                return new HomeResponse(
                                Instant.parse("2026-07-31T12:00:00Z"),
                                new User("Dominic"),
                                new NetWorth(
                                                new BigDecimal("128406.00"),
                                                "USD",
                                                new NetWorthChange(new BigDecimal("3182.00"),
                                                                ChangePeriod.MONTH_TO_DATE),
                                List.of(new HistoryPoint(LocalDate.parse("2026-02-01"),
                                                new BigDecimal("115840.00")),
                                                new HistoryPoint(LocalDate.parse("2026-07-31"),
                                                new BigDecimal("128406.00")))),
                                List.of(new AttentionItem(
                                                "attention_uber_cash_2026_07",
                                                AttentionType.BENEFIT_EXPIRING,
                                                "Use your remaining Uber Cash",
                                                "Uber Cash remains available and is approaching expiration.",
                                                new BigDecimal("9.00"),
                                                "USD",
                                                Instant.parse("2026-08-03T03:59:59Z"))),
                                List.of(new Suggestion(
                                                "suggestion_dining_card_2026_07",
                                                SuggestionType.CARD_OPTIMIZATION,
                                                SuggestionCategory.OPTIMIZATION,
                                                "Switch dining spend to the better card",
                                                "Recent meals were posted to a lower-earning card.",
                                                782)),
                                List.of(new RecentActivity(
                                                "transaction_delta_2026_07_27",
                                                "Delta Air Lines",
                                                ActivityCategory.TRAVEL,
                                                "Amex Platinum",
                                                Instant.parse("2026-07-27T14:30:00Z"),
                                                new BigDecimal("241.30"),
                                                "USD",
                                                TransactionDirection.DEBIT,
                                                TransactionStatus.POSTED,
                                                new ActivityInsight(InsightType.REWARD_MULTIPLIER, 5))));
        }
}
