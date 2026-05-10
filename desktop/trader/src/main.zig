const std = @import("std");

/// BBSIM Trader — Desktop Client
///
/// Lightweight native shell that opens the trader UI.
/// The user enters the firm server's IP address to connect.
/// No local server needed — just the WebView.

pub fn main() !void {
    std.debug.print("[BBSIM Trader] Starting...\n", .{});
    std.debug.print("[BBSIM Trader] Enter the firm server address when prompted.\n", .{});

    // The zero-native runtime handles WebView creation via app.zon config
    // The frontend handles server connection UI
}
