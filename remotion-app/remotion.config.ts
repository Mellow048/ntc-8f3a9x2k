import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Headless WebGL in CI needs SwiftShader (no GPU on runners).
try {
  Config.setChromiumArgs(["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox", "--disable-dev-shm-usage"] as never);
} catch {
  // Older Remotion versions use a different name; CI still tries SwiftShader by default.
}
