# Arc iOS — HealthKit Foundation

Arc's native iOS layer exists to remove manual logging while keeping the Supabase account and Body Intelligence engine as the system of record.

## First HealthKit read set

Arc should request only data that directly improves the experience:

- Step count
- Walking/running distance
- Active energy burned
- Workouts
- Heart rate
- Resting heart rate
- Sleep analysis
- Body mass / weight
- Body fat percentage

Future candidates after the pilot: respiratory rate, walking heart rate average, VO2 max, mindful minutes, menstrual/reproductive data, nutrition data written by other apps, and workout route/zone data where the product experience clearly needs it.

## Privacy rule

Never request all HealthKit permissions simply because they exist. Ask for a narrow set, explain why Arc uses each category, and let the person expand access later.

Arc should preserve provenance for every imported sample:

- provider = apple_health
- source app/bundle identifier when available
- HealthKit sample UUID as source_record_id
- recorded start/end timestamps
- original unit
- device/source metadata where appropriate

## Supabase contract

The 0.7 backend includes:

- `data_sources`
- `health_samples`
- `sync_cursors`
- `device_sync_runs`

Existing domain tables also include source/source_id/external_id fields where relevant.

HealthKit import should first land in `health_samples` as source-aware evidence. Arc can then derive daily summaries or materialize data into weight/activity/sleep/workout tables as product logic matures.

## Native sync loop

1. Sign into the same Supabase Arc account used by web.
2. Confirm `HKHealthStore.isHealthDataAvailable()`.
3. Ask for the minimum read permissions.
4. Create/update the user's `apple_health` row in `data_sources`.
5. Query recent history for initial import.
6. Use HealthKit sample UUIDs to make imports idempotent.
7. Persist incremental anchors/cursors locally and in `sync_cursors` where useful.
8. Record each run in `device_sync_runs`.
9. Refresh Body Intelligence / Weekly Arc after sync.

## Pilot objective

The first native beta should make this morning flow possible:

> Good morning. Arc already has your night.
>
> Sleep, resting HR, activity and scale data are already here.
>
> How do you feel today?

Only subjective context should remain manual unless a device can reliably observe it.
