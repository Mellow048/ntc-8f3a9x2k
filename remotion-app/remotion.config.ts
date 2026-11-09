import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// CI: Playwright's bundled Chromium has working SwiftShader WebGL
// (same browser that bakes ShortSmith's plates). Set via --browser-executable.
Config.setChromiumOpenGlRenderer("swiftshader");
