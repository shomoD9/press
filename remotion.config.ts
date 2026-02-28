/*
This file configures Remotion at the repository level so rendering defaults are
stable and deterministic across local preview and production rendering commands.
It is separated from scene logic because these settings are infrastructure
concerns shared by every composition.
*/

import { Config } from 'remotion';

// We lock V1 defaults to 1080p30 as agreed in scope.
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
