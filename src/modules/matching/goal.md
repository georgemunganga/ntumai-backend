Exactly ✅ — the source of data is the mobile app:

Driver/Rider app → sends live GPS updates (lat, lng, speed, status, timestamp) every few seconds.

User/Customer app → mostly reads the data (e.g., sees nearby riders on a map) and optionally triggers delivery requests.

So the full pipeline looks like this:

Rider/Driver mobile app → sends location updates.

NestJS API → receives the updates, validates them, and pushes to Kafka.

Redis cache server/Kafka topics → stream the location events:

locations topic → current positions for map display

match.requests topic → delivery matching/race requests

Go Matching Service → consumes relevant topics, computes who wins the race or finds nearby riders.

Redis (optional but recommended) → stores latest positions for super-fast geo-queries.

Frontend (Customer App / Dashboard) → subscribes via WebSocket or REST to see live positions on the map.