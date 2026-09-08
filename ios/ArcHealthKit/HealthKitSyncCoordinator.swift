import Foundation
import HealthKit
import UIKit

/// Coordinates HealthKit -> Arc cloud sync.
/// Anchors are committed only after a successful upload, so transient network failures do not lose data.
@MainActor
final class HealthKitSyncCoordinator: ObservableObject {
    private let health: HealthKitManager
    private let uploader: HealthSyncUploader
    private let anchors = HealthKitAnchorStore()

    @Published private(set) var isSyncing = false
    @Published private(set) var lastSyncAt: Date?
    @Published private(set) var lastError: String?
    @Published private(set) var lastUploadedCount = 0

    init(
        health: HealthKitManager = .shared,
        accessTokenProvider: @escaping @Sendable () async throws -> String
    ) {
        self.health = health
        self.uploader = HealthSyncUploader(accessTokenProvider: accessTokenProvider)
    }

    func authorizeAndStart() async {
        do {
            try await health.requestAuthorization()
            try await health.enableBackgroundDelivery(frequency: .hourly)
            health.startObservers { [weak self] type in
                guard let self else { return }
                await self.sync(type: type)
            }
            await syncAll()
        } catch {
            lastError = error.localizedDescription
        }
    }

    func syncAll() async {
        guard !isSyncing else { return }
        isSyncing = true
        lastError = nil
        var uploaded = 0
        defer { isSyncing = false }

        for type in health.sampleTypes {
            do {
                uploaded += try await syncOne(type: type)
            } catch {
                lastError = error.localizedDescription
            }
        }

        lastUploadedCount = uploaded
        if lastError == nil { lastSyncAt = Date() }
    }

    func sync(type: HKSampleType) async {
        do {
            let uploaded = try await syncOne(type: type)
            lastUploadedCount = uploaded
            lastSyncAt = Date()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    private func syncOne(type: HKSampleType) async throws -> Int {
        let oldAnchor = anchors.load(for: type.identifier)
        let result = try await health.changedSamples(for: type, anchor: oldAnchor)
        let payload = result.samples.compactMap(ArcHealthSampleMapper.map)

        if payload.isEmpty {
            // It is safe to advance the anchor if HealthKit returned no new samples.
            if let newAnchor = result.anchor { anchors.save(newAnchor, for: type.identifier) }
            return 0
        }

        let response = try await uploader.upload(payload, deviceName: UIDevice.current.name)
        if let newAnchor = result.anchor { anchors.save(newAnchor, for: type.identifier) }
        return response.samples_upserted
    }
}

/// HKQueryAnchor conforms to NSSecureCoding, so the native pilot can persist it locally.
/// Supabase also has a sync_cursors table for later cross-device diagnostics, but the HealthKit anchor itself belongs on-device.
final class HealthKitAnchorStore: @unchecked Sendable {
    private let defaults = UserDefaults.standard
    private let prefix = "arc.healthkit.anchor."

    func load(for identifier: String) -> HKQueryAnchor? {
        guard let data = defaults.data(forKey: prefix + identifier) else { return nil }
        return try? NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: data)
    }

    func save(_ anchor: HKQueryAnchor, for identifier: String) {
        if let data = try? NSKeyedArchiver.archivedData(withRootObject: anchor, requiringSecureCoding: true) {
            defaults.set(data, forKey: prefix + identifier)
        }
    }

    func resetAll() {
        defaults.dictionaryRepresentation().keys
            .filter { $0.hasPrefix(prefix) }
            .forEach { defaults.removeObject(forKey: $0) }
    }
}
