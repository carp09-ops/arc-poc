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

The backend includes:

- `data_sources`
- `health_samples`
- `sync_cursors`
- `device_sync_runs`
- authenticated RPC `ingest_healthkit_samples(p_samples, p_device_name)`

The RPC derives the user from `auth.uid()`, creates/updates the Apple Health source, makes HealthKit UUID imports idempotent, records every sync run, and leaves RLS as the authorization boundary.

Existing domain tables also include source/source_id/external_id fields where relevant.

HealthKit import first lands in `health_samples` as source-aware evidence. Arc can then derive daily summaries or materialize data into weight/activity/sleep/workout tables as product logic matures.

## Native files now in the repo

- `HealthKitManager.swift` — permissions, anchored queries, observer queries and background delivery
- `HealthSampleDTO.swift` — canonical source-aware mapping into Arc evidence names
- `HealthSyncUploader.swift` — authenticated upload to the Supabase ingestion RPC
- `HealthKitSyncCoordinator.swift` — anchor-safe incremental syncing and background refresh handling
- `ArcHealthKit.entitlements` — HealthKit + background-delivery entitlement template

## Native sync loop

1. Sign into the same Supabase Arc account used by web.
2. Confirm `HKHealthStore.isHealthDataAvailable()`.
3. Ask for the minimum read permissions.
4. Create/update the user's `apple_health` source through the ingestion RPC.
5. Run an anchored query for each authorized sample type.
6. Map samples to Arc's canonical payload, keeping HealthKit UUID + source bundle ID.
7. Upload to `ingest_healthkit_samples`.
8. Persist the returned HealthKit anchor only after cloud upload succeeds.
9. Enable HealthKit Background Delivery and observer queries so the app can sync changes without a manual refresh.
10. Refresh Body Intelligence / Weekly Arc after sync.

## Xcode requirements for the pilot

In the iOS target:

- Add the **HealthKit** capability.
- Enable **Background Delivery** under the HealthKit capability.
- Use the entitlements represented in `ArcHealthKit.entitlements`.
- Add an `NSHealthShareUsageDescription` purpose string such as:
  - `Arc reads health and activity data you choose to share so it can reduce manual logging and connect your habits with changes over time.`
- Do not add write permissions until Arc has a clear feature that requires writing to Apple Health.

Apple's HealthKit background observer workflow must be tested on a physical device, not only the Simulator.

## Auth bridge

The native sync coordinator accepts an async access-token provider. Once the Supabase Swift client is added to the Xcode project, the app can supply the current signed-in Arc session token to the coordinator. That keeps the same Supabase account and RLS rules across web and native.

## Pilot objective

The first native beta should make this morning flow possible:

> Good morning. Arc already has your night.
>
> Sleep, resting HR, activity and scale data are already here.
>
> How do you feel today?

Only subjective context should remain manual unless a device can reliably observe it.
