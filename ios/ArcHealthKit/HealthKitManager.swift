import Foundation
import HealthKit

/// Arc's native HealthKit access layer.
/// Keep permissions intentionally narrow and source-aware.
@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    private let store = HKHealthStore()
    private var observerQueries: [HKObserverQuery] = []

    @Published private(set) var isAvailable = HKHealthStore.isHealthDataAvailable()
    @Published private(set) var authorizationRequested = false
    @Published private(set) var lastError: String?

    private init() {}

    var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()

        let quantityIdentifiers: [HKQuantityTypeIdentifier] = [
            .stepCount,
            .distanceWalkingRunning,
            .activeEnergyBurned,
            .heartRate,
            .restingHeartRate,
            .bodyMass,
            .bodyFatPercentage
        ]

        for identifier in quantityIdentifiers {
            if let type = HKObjectType.quantityType(forIdentifier: identifier) {
                types.insert(type)
            }
        }

        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleep)
        }

        types.insert(HKObjectType.workoutType())
        return types
    }

    var sampleTypes: [HKSampleType] {
        readTypes.compactMap { $0 as? HKSampleType }
    }

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthKitError.unavailable
        }

        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            authorizationRequested = true
            lastError = nil
        } catch {
            lastError = error.localizedDescription
            throw error
        }
    }

    /// HealthKit intentionally does not reveal a simple "read permission granted"
    /// boolean for every type. Arc should attempt authorized queries and handle
    /// empty/limited results without treating them as user failure.
    func earliestAuthorizedDates() async throws -> [HKObjectType: Date] {
        try await store.earliestAuthorizedSampleDate(for: readTypes)
    }

    /// Returns only changes since the supplied HealthKit anchor.
    /// The caller must persist the returned anchor *after* the cloud upload succeeds.
    func changedSamples(
        for type: HKSampleType,
        anchor: HKQueryAnchor?,
        limit: Int = HKObjectQueryNoLimit
    ) async throws -> (samples: [HKSample], deleted: [HKDeletedObject], anchor: HKQueryAnchor?) {
        try await withCheckedThrowingContinuation { continuation in
            let query = HKAnchoredObjectQuery(
                type: type,
                predicate: nil,
                anchor: anchor,
                limit: limit
            ) { _, samples, deleted, newAnchor, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: (samples ?? [], deleted ?? [], newAnchor))
                }
            }
            store.execute(query)
        }
    }

    /// Enables HealthKit to wake Arc when authorized sample types change.
    /// Requires the HealthKit Background Delivery capability in the target.
    func enableBackgroundDelivery(frequency: HKUpdateFrequency = .hourly) async throws {
        for type in sampleTypes {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                store.enableBackgroundDelivery(for: type, frequency: frequency) { success, error in
                    if let error {
                        continuation.resume(throwing: error)
                    } else if success {
                        continuation.resume(returning: ())
                    } else {
                        continuation.resume(throwing: HealthKitError.backgroundDeliveryFailed)
                    }
                }
            }
        }
    }

    /// Register these observer queries as early as possible at app launch.
    /// HealthKit can relaunch the app in the background and call the update handler.
    func startObservers(onChange: @escaping @Sendable (HKSampleType) async -> Void) {
        guard observerQueries.isEmpty else { return }

        for type in sampleTypes {
            let query = HKObserverQuery(sampleType: type, predicate: nil) { _, completion, error in
                guard error == nil else {
                    completion()
                    return
                }
                Task {
                    await onChange(type)
                    completion()
                }
            }
            observerQueries.append(query)
            store.execute(query)
        }
    }
}

enum HealthKitError: LocalizedError {
    case unavailable
    case backgroundDeliveryFailed

    var errorDescription: String? {
        switch self {
        case .unavailable:
            return "Health data is not available on this device."
        case .backgroundDeliveryFailed:
            return "Arc could not enable HealthKit background delivery."
        }
    }
}
