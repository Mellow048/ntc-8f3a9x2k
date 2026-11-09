import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// CI has no GPU: run headed Chrome under Xvfb with Mesa llvmpipe (EGL).
Config.setChromeMode("chrome-for-testing");
Config.setChromiumHeadlessMode(false);
Config.setChromiumOpenGlRenderer("egl");
Config.setChromiumMultiProcessOnLinux(true);
