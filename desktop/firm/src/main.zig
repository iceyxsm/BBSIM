const std = @import("std");

/// BBSIM Firm — Desktop Shell
///
/// This native shell:
/// 1. Starts the API server (Node.js) as a child process
/// 2. Waits for it to be ready
/// 3. Opens the WebView with the firm dashboard
///
/// The API server binds to 0.0.0.0:3001 so traders on the
/// local network can connect.

pub fn main() !void {
    const allocator = std.heap.page_allocator;

    // Start the API server
    const api_argv = [_][]const u8{
        "node",
        "--loader",
        "tsx",
        "../../packages/api/src/index.ts",
    };

    var api_process = std.process.Child.init(&api_argv, allocator);
    api_process.spawn() catch |err| {
        std.debug.print("Failed to start API server: {}\n", .{err});
        std.debug.print("Make sure Node.js and tsx are installed.\n", .{});
        std.debug.print("Run: pnpm install && pnpm seed\n", .{});
        return err;
    };

    // Give the server a moment to start
    std.time.sleep(2 * std.time.ns_per_s);

    std.debug.print("[BBSIM Firm] API server started on http://0.0.0.0:3001\n", .{});
    std.debug.print("[BBSIM Firm] Traders can connect to this machine's IP on port 3001\n", .{});
    std.debug.print("[BBSIM Firm] Opening firm dashboard...\n", .{});

    // The zero-native runtime handles WebView creation via app.zon config
    // This process stays alive to keep the API server running
    _ = api_process.wait() catch |err| {
        std.debug.print("API server exited with error: {}\n", .{err});
        return err;
    };
}
