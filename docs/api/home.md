# Home API contract

This document defines the initial mobile/backend boundary for Porter's Home screen. It is a design contract only; the endpoint is not implemented yet.

## Endpoint

`GET /api/v1/home`

Returns the authenticated user's Home summary. Authentication details will be defined with the backend foundation.

## Response

```json
{
  "generatedAt": "2026-07-31T12:00:00Z",
  "user": {
    "firstName": "Dominic"
  },
  "netWorth": {
    "amount": "128406.00",
    "currency": "USD",
    "change": {
      "amount": "3182.00",
      "period": "MONTH_TO_DATE"
    },
    "history": [
      {
        "date": "2026-02-01",
        "amount": "115840.00"
      },
      {
        "date": "2026-07-31",
        "amount": "128406.00"
      }
    ]
  },
  "attentionItems": [
    {
      "id": "attention_uber_cash_2026_07",
      "type": "BENEFIT_EXPIRING",
      "title": "Use your remaining Uber Cash",
      "description": "Uber Cash remains available and is approaching expiration.",
      "amount": "9.00",
      "currency": "USD",
      "dueAt": "2026-08-03T03:59:59Z"
    }
  ],
  "suggestions": [
    {
      "id": "suggestion_dining_card_2026_07",
      "type": "CARD_OPTIMIZATION",
      "category": "OPTIMIZATION",
      "title": "Switch dining spend to the better card",
      "description": "Recent meals were posted to a lower-earning card.",
      "pointsOpportunity": 782
    }
  ],
  "recentActivity": [
    {
      "id": "transaction_delta_2026_07_27",
      "merchantName": "Delta Air Lines",
      "category": "TRAVEL",
      "accountName": "Amex Platinum",
      "postedAt": "2026-07-27T14:30:00Z",
      "amount": "241.30",
      "currency": "USD",
      "direction": "DEBIT",
      "status": "POSTED",
      "insight": {
        "type": "REWARD_MULTIPLIER",
        "multiplier": 5
      }
    }
  ]
}
```

## Data rules

- Monetary values are decimal strings, never JSON floating-point numbers.
- Currency values use ISO 4217 codes such as `USD`.
- Timestamps use ISO 8601 UTC values. Calendar-only history points use `YYYY-MM-DD`.
- IDs are stable, opaque strings. Mobile must not derive business meaning from an ID.
- Enum values use uppercase snake case and must be documented when expanded.
- The backend returns semantic data. Mobile owns locale-aware currency, date, status-label, and greeting formatting.
- The response describes a server-generated snapshot at `generatedAt`; related values should be internally consistent for that snapshot.

## Mobile mapping

The initial mobile fixture uses presentation-ready strings. When this endpoint is implemented, a mobile mapper will convert the API response into the existing Home view model. UI components will continue receiving display-ready props and will not depend directly on transport types.

## Errors

The backend will use a consistent error envelope. Exact authentication and error contracts will be defined with the Spring Boot foundation before this endpoint is implemented.
