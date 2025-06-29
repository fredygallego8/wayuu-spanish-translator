"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.assign(exports,
    process.env['NODE_ENV'] === 'development' ?
        require('../build/Debug/Debug/node_ffmpeg') :
        require('../build/Release/Release/node_ffmpeg')
);
