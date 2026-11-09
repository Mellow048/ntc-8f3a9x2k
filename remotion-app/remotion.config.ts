import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Headless WebGL in CI needs ANGLE/SwiftShader (no GPU on runners).
Config.setChromiumOpenGlRenderer("angle");
Config.setChromiumMultiProcessOnLinux(true);
