import Foundation

/// Minimal transport layer for the native pilot.
/// It deliberately uses the signed-in Arc user's access token, so database RLS remains authoritative.
struct HealthSyncUploader: Sendable {
    static let projectURL = URL(string: "https://svxbzkjxihcwsbyheyxd.supabase.co")!
    static let publishableKey = "sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc"

    let accessTokenProvider: @Sendable () async throws -> String

    struct Response: Decodable, Sendable {
        let sync_run_id: UUID
        let source_id: UUID
        let samples_seen: Int
        let samples_upserted: Int
    }

    func upload(_ samples: [ArcHealthSampleDTO], deviceName: String?) async throws -> Response {
        guard !samples.isEmpty else {
            throw UploadError.emptyBatch
        }

        let token = try await accessTokenProvider()
        var request = URLRequest(url: Self.projectURL.appending(path: "rest/v1/rpc/ingest_healthkit_samples"))
        request.httpMethod = "POST"
        request.setValue(Self.publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = RequestBody(p_samples: samples, p_device_name: deviceName)
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw UploadError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            throw UploadError.server(status: http.statusCode, body: String(data: data, encoding: .utf8) ?? "")
        }
        return try JSONDecoder().decode(Response.self, from: data)
    }

    private struct RequestBody: Encodable {
        let p_samples: [ArcHealthSampleDTO]
        let p_device_name: String?
    }
}

enum UploadError: LocalizedError {
    case emptyBatch
    case invalidResponse
    case server(status: Int, body: String)

    var errorDescription: String? {
        switch self {
        case .emptyBatch: return "There were no HealthKit samples to upload."
        case .invalidResponse: return "Arc received an invalid sync response."
        case .server(let status, let body): return "Arc sync failed (\(status)): \(body)"
        }
    }
}
