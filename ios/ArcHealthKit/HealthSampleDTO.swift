import Foundation
import HealthKit

/// Canonical payload sent from iOS into Arc's `ingest_healthkit_samples` RPC.
/// The strings intentionally match the web/Supabase evidence vocabulary.
struct ArcHealthSampleDTO: Codable, Sendable {
    let id: String
    let type: String
    let value: Double?
    let text: String?
    let unit: String?
    let startAt: String
    let endAt: String?
    let bundleId: String?
    let metadata: [String: String]
}

enum ArcHealthSampleMapper {
    private static let iso = ISO8601DateFormatter()

    static func map(_ sample: HKSample) -> ArcHealthSampleDTO? {
        if let quantity = sample as? HKQuantitySample {
            return mapQuantity(quantity)
        }
        if let category = sample as? HKCategorySample {
            return mapCategory(category)
        }
        if let workout = sample as? HKWorkout {
            return mapWorkout(workout)
        }
        return nil
    }

    private static func mapQuantity(_ sample: HKQuantitySample) -> ArcHealthSampleDTO? {
        let identifier = sample.quantityType.identifier
        let mapped: (String, Double, String)?

        switch identifier {
        case HKQuantityTypeIdentifier.stepCount.rawValue:
            mapped = ("step_count", sample.quantity.doubleValue(for: .count()), "count")
        case HKQuantityTypeIdentifier.distanceWalkingRunning.rawValue:
            mapped = ("distance_walking_running", sample.quantity.doubleValue(for: .mile()), "mi")
        case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue:
            mapped = ("active_energy_burned", sample.quantity.doubleValue(for: .kilocalorie()), "kcal")
        case HKQuantityTypeIdentifier.heartRate.rawValue:
            mapped = ("heart_rate", sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())), "bpm")
        case HKQuantityTypeIdentifier.restingHeartRate.rawValue:
            mapped = ("resting_heart_rate", sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())), "bpm")
        case HKQuantityTypeIdentifier.bodyMass.rawValue:
            mapped = ("body_mass", sample.quantity.doubleValue(for: .pound()), "lb")
        case HKQuantityTypeIdentifier.bodyFatPercentage.rawValue:
            mapped = ("body_fat_percentage", sample.quantity.doubleValue(for: .percent()) * 100, "%")
        default:
            mapped = nil
        }

        guard let mapped else { return nil }
        return make(sample, type: mapped.0, value: mapped.1, text: nil, unit: mapped.2)
    }

    private static func mapCategory(_ sample: HKCategorySample) -> ArcHealthSampleDTO? {
        guard sample.categoryType.identifier == HKCategoryTypeIdentifier.sleepAnalysis.rawValue else { return nil }
        let label: String
        if let value = HKCategoryValueSleepAnalysis(rawValue: sample.value) {
            switch value {
            case .inBed: label = "in_bed"
            case .awake: label = "awake"
            case .asleepUnspecified: label = "asleep"
            case .asleepCore: label = "asleep_core"
            case .asleepDeep: label = "asleep_deep"
            case .asleepREM: label = "asleep_rem"
            @unknown default: label = "sleep_other"
            }
        } else {
            label = "sleep_other"
        }
        return make(sample, type: "sleep_analysis", value: nil, text: label, unit: nil)
    }

    private static func mapWorkout(_ sample: HKWorkout) -> ArcHealthSampleDTO {
        var metadata = baseMetadata(sample)
        metadata["activity_type"] = String(sample.workoutActivityType.rawValue)
        if let energy = sample.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
            metadata["active_energy_kcal"] = String(energy)
        }
        if let distance = sample.totalDistance?.doubleValue(for: .mile()) {
            metadata["distance_mi"] = String(distance)
        }
        return ArcHealthSampleDTO(
            id: sample.uuid.uuidString,
            type: "workout",
            value: sample.duration / 60,
            text: String(sample.workoutActivityType.rawValue),
            unit: "min",
            startAt: iso.string(from: sample.startDate),
            endAt: iso.string(from: sample.endDate),
            bundleId: sample.sourceRevision.source.bundleIdentifier,
            metadata: metadata
        )
    }

    private static func make(_ sample: HKSample, type: String, value: Double?, text: String?, unit: String?) -> ArcHealthSampleDTO {
        ArcHealthSampleDTO(
            id: sample.uuid.uuidString,
            type: type,
            value: value,
            text: text,
            unit: unit,
            startAt: iso.string(from: sample.startDate),
            endAt: iso.string(from: sample.endDate),
            bundleId: sample.sourceRevision.source.bundleIdentifier,
            metadata: baseMetadata(sample)
        )
    }

    private static func baseMetadata(_ sample: HKSample) -> [String: String] {
        var meta: [String: String] = [
            "source_name": sample.sourceRevision.source.name,
            "source_bundle_id": sample.sourceRevision.source.bundleIdentifier
        ]
        if let device = sample.device {
            if let name = device.name { meta["device_name"] = name }
            if let manufacturer = device.manufacturer { meta["device_manufacturer"] = manufacturer }
            if let model = device.model { meta["device_model"] = model }
        }
        return meta
    }
}
