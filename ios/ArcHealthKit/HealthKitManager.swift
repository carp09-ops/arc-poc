import Foundation
import HealthKit

/// Arc's native HealthKit access layer.
/// Keep permissions intentionally narrow and source-aware.
@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    private let store = HKHealthStore()

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
}

enum HealthKitError: LocalizedError {
    case unavailable

    var errorDescription: String? {
        switch self {
        case .unavailable:
            return "Health data is not available on this device."
        }
    }
}
