# node-ffmpeg

### Installation

```
yarn add node-ffmpeg
```

### Usage

```
import {
    Codec,
    CodecContext,
    FormatContext,
    constants,
    Packet,
    Frame,
    getBytesPerSample,
    CodecParameters,
    Rational
} from 'node-ffmpeg';

const enc = Codec.findEncoder(constants.AV_CODEC_ID_OPUS);
console.log(enc);

const encCtx = new CodecContext(enc);
encCtx.parametersToContext(new CodecParameters({
    codecId: constants.AV_CODEC_ID_OPUS,
    channels: 1,
    channelLayout: constants.AV_CH_LAYOUT_MONO,
    sampleRate: 48000,
    bitRate: 20000,
    codecType: constants.AVMEDIA_TYPE_AUDIO,
    format: sampleFormat
}));
encCtx.open(enc);

console.log(encCtx.frameSize() === 960)
```
