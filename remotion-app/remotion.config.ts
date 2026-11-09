import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Headless WebGL in CI needs ANGLE/SwiftShader (no GPU on runners).
// Full chrome-for-testing has working SwiftShader WebGL; the headless shell does not.
Config.setChromeMode("chrome-for-testing");
Config.setChromiumOpenGlRenderer("swiftshader");
Config.setChromiumMultiProcessOnLinux(true);
