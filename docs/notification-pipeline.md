# Delivery notification pipeline

Parcel lifecycle changes are published through an in-process event bus. A
notification subscriber turns supported status changes into channel-specific
messages using synthetic preferences.

The pipeline demonstrates several review relationships:

- service changes emit immutable domain events;
- the event bus isolates subscribers and aggregates handler failures;
- templates create stable deduplication keys;
- transports reject duplicate deliveries;
- retry policy handles only explicitly retryable errors;
- metrics capture sent, failed, and unsupported outcomes.

Every adapter is in-memory. Email addresses use the reserved `.test` domain and
no messages leave the process.
