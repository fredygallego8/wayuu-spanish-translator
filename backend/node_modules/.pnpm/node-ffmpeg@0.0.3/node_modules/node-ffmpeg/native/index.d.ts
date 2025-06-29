export class Stream {
    id(): number;
    codecParameters: CodecParameters;
    timeBase(newValue: Rational): void;
}

export class CodecParameters {
    constructor(options: {
        /**
         * Audio only. Audio frame size, if known. Required by some formats to be static.
         */
        frameSize?: number;    
        /**
         * General type of the encoded data.
         */
        codecType: number;
        /**
         * Specific type of the encoded data (the codec used).
         */
        codecId: number;
        /**
         * - video: the pixel format, the value corresponds to enum AVPixelFormat.
         * - audio: the sample format, the value corresponds to enum AVSampleFormat.
         */
        format: number;
        /**
         * Video only. The dimensions of the video frame in pixels.
         */
        width?: number;
        height?: number;
        /**
         * Audio only. The number of audio samples per second.
         */
        sampleRate?: number;        
        /**
         * The average bitrate of the encoded data (in bits per second).
         */
        bitRate?: number;
        /**
         * Audio only. The number of audio channels.
         */
        channels?: number;
        /**
         * Audio only. The channel layout bitmask. May be 0 if the channel layout is
         * unknown or unspecified, otherwise the number of bits set must be equal to
         * the channels field.
         */
        channelLayout?: number;
    }): void;
    codecId(): number;
    frameSize(): number;
    sampleRate(): number;
    fromContext(src: CodecContext): void;
    copy(src: CodecParameters): void;
}

export class FormatContext {
    openInput(file: string): void;
    findStreamInfo(): void;
    findBestStream(type: AVMediaType): number;
    readFrame(packet: Packet): number;
    newStream(): Stream;
    writeFrame(packet: Packet): number;
    allocOutputContext(filename: string): void;
    streams(): Stream[];
    dumpFormat(index: number,url: string, isOutput: boolean): void;
    open(): void;
    close(): void;
    writeTrailer(): void;
    writeHeader(): void;
}

export class Codec {
    /**
     * Codec capabilities.
     * see AV_CODEC_CAP_*
     */
    capabilities: number;
    name: string;
    supportedSampleRates: number[];
    /**
     * array of supported framerates
     */
    supportedFrameRates: number[];
    /**
     * array of supported sample formats
     */
    supportedSampleFormats: number[];
    /**
     * array of support channel layouts
     */
    supportedChannelLayouts: number[];
    /**
     * array of supported pixel formats
     */
    supportedPixelFormats: number[];
    private constructor();
    static findDecoder(id: AVCodecID): Codec;
    static findEncoder(id: AVCodecID): Codec;
}

export interface IFrameParams {
    /**
     * Presentation timestamp in time_base units (time when frame should be shown to user).
     */
    pts: number;
    /**
     * @name Video dimensions
     * Video frames only. The coded dimensions (in pixels) of the video frame,
     * i.e. the size of the rectangle that contains some well-defined values.
     *
     * @note The part of the frame intended for display/presentation is further
     * restricted by the @ref cropping "Cropping rectangle".
     * @{
     */
    width: number;
    height: number;
    /**
     * number of audio samples (per channel) described by this frame
     */
    samples: number;
    /**
     * format of the frame, -1 if unknown or unset
     * Values correspond to enum AVPixelFormat for video frames,
     * enum AVSampleFormat for audio)
     */
    format: number;
    /**
     * Sample rate of the audio data.
     */
    sampleRate: number;
    /**
     * Channel layout of the audio data.
     */
    channelLayout: number;
}

export class Frame {
    constructor(options?: Partial<IFrameParams>);
    sampleRate(): number;
    /**
     * number of audio samples (per channel) described by this frame
     */
    samples(): number;
    update(params: Partial<IFrameParams>): void;
    makeWritable(): void;
    data(i: number,size: number): ArrayBuffer;
    getBuffer(align?: number): void;
}

export class Rational {
    constructor(num: number, den: number);
}

export class CodecContext {
    constructor(codec: Codec);
    open(codec: Codec): void;
    flushBuffers(): void;
    sendPacket(packet: Packet): number;
    receivePacket(packet: Packet): number;
    receiveFrame(frame: Frame): number;
    sendFrame(frame: Frame): number;
    timeBase(value: Rational): void;
    frameSize(): number;
    sampleFormat(): number;
    parametersToContext(params: CodecParameters): void;
}

/**
 * Return number of bytes per sample.
 * @param fmt the sample format
 * @returns number of bytes per sample or zero if unknown for the given sample format
 */
export function getBytesPerSample(fmt: number): number;

export const constants: {
    AV_CODEC_CAP_DRAW_HORIZ_BAND: number;
    AV_CODEC_CAP_DR1: number;
    AV_CODEC_CAP_TRUNCATED: number;
    AV_CODEC_CAP_DELAY: number;
    AV_CODEC_CAP_SMALL_LAST_FRAME: number;
    AV_CODEC_CAP_SUBFRAMES: number;
    AV_CODEC_CAP_EXPERIMENTAL: number;
    AV_CODEC_CAP_CHANNEL_CONF: number;
    AV_CODEC_CAP_FRAME_THREADS: number;
    AV_CODEC_CAP_SLICE_THREADS: number;
    AV_CODEC_CAP_PARAM_CHANGE: number;
    AV_CODEC_CAP_OTHER_THREADS: number;
    AV_CODEC_CAP_AUTO_THREADS: number;
    AV_CODEC_CAP_OTHER_THREADS: number;
    AV_CODEC_CAP_VARIABLE_FRAME_SIZE: number;
    AV_CODEC_CAP_AVOID_PROBING: number;
    AV_CODEC_CAP_INTRA_ONLY: number;
    AV_CODEC_CAP_LOSSLESS: number;
    AV_CODEC_CAP_HARDWARE: number;
    AV_CODEC_CAP_HARDWARE: number;
    AV_CODEC_CAP_HYBRID: number;
    AV_CODEC_CAP_ENCODER_REORDERED_OPAQUE: number;
    AV_CODEC_CAP_ENCODER_FLUSH    : number;

    AV_CH_FRONT_LEFT: number;
    AV_CH_FRONT_RIGHT: number;
    AV_CH_FRONT_CENTER: number;
    AV_CH_LOW_FREQUENCY: number;
    AV_CH_BACK_LEFT: number;
    AV_CH_BACK_RIGHT: number;
    AV_CH_FRONT_LEFT_OF_CENTER: number;
    AV_CH_FRONT_RIGHT_OF_CENTER: number;
    AV_CH_BACK_CENTER: number;
    AV_CH_SIDE_LEFT: number;
    AV_CH_SIDE_RIGHT: number;
    AV_CH_TOP_CENTER: number;
    AV_CH_TOP_FRONT_LEFT: number;
    AV_CH_TOP_FRONT_CENTER: number;
    AV_CH_TOP_FRONT_RIGHT: number;
    AV_CH_TOP_BACK_LEFT: number;
    AV_CH_TOP_BACK_CENTER: number;
    AV_CH_TOP_BACK_RIGHT: number;
    AV_CH_STEREO_LEFT: number;
    AV_CH_STEREO_RIGHT: number;
    AV_CH_WIDE_LEFT: number;
    AV_CH_WIDE_RIGHT: number;
    AV_CH_SURROUND_DIRECT_LEFT: number;
    AV_CH_SURROUND_DIRECT_RIGHT: number;
    AV_CH_LOW_FREQUENCY_2: number;
    AV_CH_TOP_SIDE_LEFT: number;
    AV_CH_TOP_SIDE_RIGHT: number;
    AV_CH_LAYOUT_NATIVE: number;
    AV_CH_BOTTOM_FRONT_CENTER
    AV_CH_BOTTOM_FRONT_LEFT
    AV_CH_BOTTOM_FRONT_RIGHT
    AV_CH_LAYOUT_MONO: number;
    AV_CH_LAYOUT_STEREO: number;
    AV_CH_LAYOUT_2POINT1: number;
    AV_CH_LAYOUT_2_1: number;
    AV_CH_LAYOUT_SURROUND: number;
    AV_CH_LAYOUT_3POINT1: number;
    AV_CH_LAYOUT_4POINT0: number;
    AV_CH_LAYOUT_4POINT1: number;
    AV_CH_LAYOUT_2_2: number;
    AV_CH_LAYOUT_QUAD: number;
    AV_CH_LAYOUT_5POINT0: number;
    AV_CH_LAYOUT_5POINT1: number;
    AV_CH_LAYOUT_5POINT0_BACK: number;
    AV_CH_LAYOUT_5POINT1_BACK: number;
    AV_CH_LAYOUT_6POINT0: number;
    AV_CH_LAYOUT_6POINT0_FRONT: number;
    AV_CH_LAYOUT_HEXAGONAL: number;
    AV_CH_LAYOUT_6POINT1: number;
    AV_CH_LAYOUT_6POINT1_BACK: number;
    AV_CH_LAYOUT_6POINT1_FRONT: number;
    AV_CH_LAYOUT_7POINT0: number;
    AV_CH_LAYOUT_7POINT0_FRONT: number;
    AV_CH_LAYOUT_7POINT1: number;
    AV_CH_LAYOUT_7POINT1_WIDE: number;
    AV_CH_LAYOUT_7POINT1_WIDE_BACK: number;
    AV_CH_LAYOUT_OCTAGONAL: number;
    AV_CH_LAYOUT_HEXADECAGONAL: number;
    AV_CH_LAYOUT_STEREO_DOWNMIX: number;
    AV_CH_LAYOUT_22POINT2: number;

    /**
     * errors
     */
    EPERM: number;
    ENOENT: number;
    ESRCH: number;
    EINTR: number;
    EIO: number;
    ENXIO: number;
    E2BIG: number;
    ENOEXEC: number;
    EBADF: number;
    ECHILD: number;
    EAGAIN: number;
    ENOMEM: number;
    EACCES: number;
    EFAULT: number;
    ENOTBLK: number;
    EBUSY: number;
    EEXIST: number;
    EXDEV: number;
    ENODEV: number;
    ENOTDIR: number;
    EISDIR: number;
    EINVAL: number;
    ENFILE: number;
    EMFILE: number;
    ENOTTY: number;
    ETXTBSY: number;
    EFBIG: number;
    ENOSPC: number;
    ESPIPE: number;
    EROFS: number;
    EMLINK: number;
    EPIPE: number;
    EDOM: number;
    ERANGE: number;
    AVERROR: (err: number) => number;
    AVERROR_BSF_NOT_FOUND: number;
    AVERROR_BUG: number;
    AVERROR_BUFFER_TOO_SMALL: number;
    AVERROR_DECODER_NOT_FOUND: number;
    AVERROR_DEMUXER_NOT_FOUND: number;
    AVERROR_ENCODER_NOT_FOUND: number;
    AVERROR_EOF: number;
    AVERROR_EXIT: number;
    AVERROR_EXTERNAL: number;
    AVERROR_FILTER_NOT_FOUND: number;
    AVERROR_INVALIDDATA: number;
    AVERROR_MUXER_NOT_FOUND: number;
    AVERROR_OPTION_NOT_FOUND: number;
    AVERROR_PATCHWELCOME: number;
    AVERROR_PROTOCOL_NOT_FOUND: number;

    /**
     * sample formats
     */
    AV_SAMPLE_FMT_NONE: number;
    AV_SAMPLE_FMT_U8: number;
    AV_SAMPLE_FMT_S16: number;
    AV_SAMPLE_FMT_S32: number;
    AV_SAMPLE_FMT_FLT: number;
    AV_SAMPLE_FMT_DBL: number;
    AV_SAMPLE_FMT_U8P: number;
    AV_SAMPLE_FMT_S16P: number;
    AV_SAMPLE_FMT_S32P: number;
    AV_SAMPLE_FMT_FLTP: number;
    AV_SAMPLE_FMT_DBLP: number;
    AV_SAMPLE_FMT_S64: number;
    AV_SAMPLE_FMT_S64P: number;
    AV_SAMPLE_FMT_NB: number;

    /**
     * media types
     */
    AVMEDIA_TYPE_UNKNOWN: number;
    AVMEDIA_TYPE_VIDEO: number;
    AVMEDIA_TYPE_AUDIO: number;
    AVMEDIA_TYPE_DATA: number;
    AVMEDIA_TYPE_SUBTITLE: number;
    AVMEDIA_TYPE_ATTACHMENT: number;
    AVMEDIA_TYPE_NB: number;

    /**
     * codec ids
     */
    AV_CODEC_ID_NONE: number;
    AV_CODEC_ID_MPEG1VIDEO: number;
    AV_CODEC_ID_MPEG2VIDEO: number;
    AV_CODEC_ID_H261: number;
    AV_CODEC_ID_H263: number;
    AV_CODEC_ID_RV10: number;
    AV_CODEC_ID_RV20: number;
    AV_CODEC_ID_MJPEG: number;
    AV_CODEC_ID_MJPEGB: number;
    AV_CODEC_ID_LJPEG: number;
    AV_CODEC_ID_SP5X: number;
    AV_CODEC_ID_JPEGLS: number;
    AV_CODEC_ID_MPEG4: number;
    AV_CODEC_ID_RAWVIDEO: number;
    AV_CODEC_ID_MSMPEG4V1: number;
    AV_CODEC_ID_MSMPEG4V2: number;
    AV_CODEC_ID_MSMPEG4V3: number;
    AV_CODEC_ID_WMV1: number;
    AV_CODEC_ID_WMV2: number;
    AV_CODEC_ID_H263P: number;
    AV_CODEC_ID_H263I: number;
    AV_CODEC_ID_FLV1: number;
    AV_CODEC_ID_SVQ1: number;
    AV_CODEC_ID_SVQ3: number;
    AV_CODEC_ID_DVVIDEO: number;
    AV_CODEC_ID_HUFFYUV: number;
    AV_CODEC_ID_CYUV: number;
    AV_CODEC_ID_H264: number;
    AV_CODEC_ID_INDEO3: number;
    AV_CODEC_ID_VP3: number;
    AV_CODEC_ID_THEORA: number;
    AV_CODEC_ID_ASV1: number;
    AV_CODEC_ID_ASV2: number;
    AV_CODEC_ID_FFV1: number;
    AV_CODEC_ID_4XM: number;
    AV_CODEC_ID_VCR1: number;
    AV_CODEC_ID_CLJR: number;
    AV_CODEC_ID_MDEC: number;
    AV_CODEC_ID_ROQ: number;
    AV_CODEC_ID_INTERPLAY_VIDEO: number;
    AV_CODEC_ID_XAN_WC3: number;
    AV_CODEC_ID_XAN_WC4: number;
    AV_CODEC_ID_RPZA: number;
    AV_CODEC_ID_CINEPAK: number;
    AV_CODEC_ID_WS_VQA: number;
    AV_CODEC_ID_MSRLE: number;
    AV_CODEC_ID_MSVIDEO1: number;
    AV_CODEC_ID_IDCIN: number;
    AV_CODEC_ID_8BPS: number;
    AV_CODEC_ID_SMC: number;
    AV_CODEC_ID_FLIC: number;
    AV_CODEC_ID_TRUEMOTION1: number;
    AV_CODEC_ID_VMDVIDEO: number;
    AV_CODEC_ID_MSZH: number;
    AV_CODEC_ID_ZLIB: number;
    AV_CODEC_ID_QTRLE: number;
    AV_CODEC_ID_TSCC: number;
    AV_CODEC_ID_ULTI: number;
    AV_CODEC_ID_QDRAW: number;
    AV_CODEC_ID_VIXL: number;
    AV_CODEC_ID_QPEG: number;
    AV_CODEC_ID_PNG: number;
    AV_CODEC_ID_PPM: number;
    AV_CODEC_ID_PBM: number;
    AV_CODEC_ID_PGM: number;
    AV_CODEC_ID_PGMYUV: number;
    AV_CODEC_ID_PAM: number;
    AV_CODEC_ID_FFVHUFF: number;
    AV_CODEC_ID_RV30: number;
    AV_CODEC_ID_RV40: number;
    AV_CODEC_ID_VC1: number;
    AV_CODEC_ID_WMV3: number;
    AV_CODEC_ID_LOCO: number;
    AV_CODEC_ID_WNV1: number;
    AV_CODEC_ID_AASC: number;
    AV_CODEC_ID_INDEO2: number;
    AV_CODEC_ID_FRAPS: number;
    AV_CODEC_ID_TRUEMOTION2: number;
    AV_CODEC_ID_BMP: number;
    AV_CODEC_ID_CSCD: number;
    AV_CODEC_ID_MMVIDEO: number;
    AV_CODEC_ID_ZMBV: number;
    AV_CODEC_ID_AVS: number;
    AV_CODEC_ID_SMACKVIDEO: number;
    AV_CODEC_ID_NUV: number;
    AV_CODEC_ID_KMVC: number;
    AV_CODEC_ID_FLASHSV: number;
    AV_CODEC_ID_CAVS: number;
    AV_CODEC_ID_JPEG2000: number;
    AV_CODEC_ID_VMNC: number;
    AV_CODEC_ID_VP5: number;
    AV_CODEC_ID_VP6: number;
    AV_CODEC_ID_VP6F: number;
    AV_CODEC_ID_TARGA: number;
    AV_CODEC_ID_DSICINVIDEO: number;
    AV_CODEC_ID_TIERTEXSEQVIDEO: number;
    AV_CODEC_ID_TIFF: number;
    AV_CODEC_ID_GIF: number;
    AV_CODEC_ID_DXA: number;
    AV_CODEC_ID_DNXHD: number;
    AV_CODEC_ID_THP: number;
    AV_CODEC_ID_SGI: number;
    AV_CODEC_ID_C93: number;
    AV_CODEC_ID_BETHSOFTVID: number;
    AV_CODEC_ID_PTX: number;
    AV_CODEC_ID_TXD: number;
    AV_CODEC_ID_VP6A: number;
    AV_CODEC_ID_AMV: number;
    AV_CODEC_ID_VB: number;
    AV_CODEC_ID_PCX: number;
    AV_CODEC_ID_SUNRAST: number;
    AV_CODEC_ID_INDEO4: number;
    AV_CODEC_ID_INDEO5: number;
    AV_CODEC_ID_MIMIC: number;
    AV_CODEC_ID_RL2: number;
    AV_CODEC_ID_ESCAPE124: number;
    AV_CODEC_ID_DIRAC: number;
    AV_CODEC_ID_BFI: number;
    AV_CODEC_ID_CMV: number;
    AV_CODEC_ID_MOTIONPIXELS: number;
    AV_CODEC_ID_TGV: number;
    AV_CODEC_ID_TGQ: number;
    AV_CODEC_ID_TQI: number;
    AV_CODEC_ID_AURA: number;
    AV_CODEC_ID_AURA2: number;
    AV_CODEC_ID_V210X: number;
    AV_CODEC_ID_TMV: number;
    AV_CODEC_ID_V210: number;
    AV_CODEC_ID_DPX: number;
    AV_CODEC_ID_MAD: number;
    AV_CODEC_ID_FRWU: number;
    AV_CODEC_ID_FLASHSV2: number;
    AV_CODEC_ID_CDGRAPHICS: number;
    AV_CODEC_ID_R210: number;
    AV_CODEC_ID_ANM: number;
    AV_CODEC_ID_BINKVIDEO: number;
    AV_CODEC_ID_IFF_ILBM: number;
    AV_CODEC_ID_KGV1: number;
    AV_CODEC_ID_YOP: number;
    AV_CODEC_ID_VP8: number;
    AV_CODEC_ID_PICTOR: number;
    AV_CODEC_ID_ANSI: number;
    AV_CODEC_ID_A64_MULTI: number;
    AV_CODEC_ID_A64_MULTI5: number;
    AV_CODEC_ID_R10K: number;
    AV_CODEC_ID_MXPEG: number;
    AV_CODEC_ID_LAGARITH: number;
    AV_CODEC_ID_PRORES: number;
    AV_CODEC_ID_JV: number;
    AV_CODEC_ID_DFA: number;
    AV_CODEC_ID_WMV3IMAGE: number;
    AV_CODEC_ID_VC1IMAGE: number;
    AV_CODEC_ID_UTVIDEO: number;
    AV_CODEC_ID_BMV_VIDEO: number;
    AV_CODEC_ID_VBLE: number;
    AV_CODEC_ID_DXTORY: number;
    AV_CODEC_ID_V410: number;
    AV_CODEC_ID_XWD: number;
    AV_CODEC_ID_CDXL: number;
    AV_CODEC_ID_XBM: number;
    AV_CODEC_ID_ZEROCODEC: number;
    AV_CODEC_ID_MSS1: number;
    AV_CODEC_ID_MSA1: number;
    AV_CODEC_ID_TSCC2: number;
    AV_CODEC_ID_MTS2: number;
    AV_CODEC_ID_CLLC: number;
    AV_CODEC_ID_MSS2: number;
    AV_CODEC_ID_VP9: number;
    AV_CODEC_ID_AIC: number;
    AV_CODEC_ID_ESCAPE130: number;
    AV_CODEC_ID_G2M: number;
    AV_CODEC_ID_WEBP: number;
    AV_CODEC_ID_HNM4_VIDEO: number;
    AV_CODEC_ID_HEVC: number;
    AV_CODEC_ID_FIC: number;
    AV_CODEC_ID_ALIAS_PIX: number;
    AV_CODEC_ID_BRENDER_PIX: number;
    AV_CODEC_ID_PAF_VIDEO: number;
    AV_CODEC_ID_EXR: number;
    AV_CODEC_ID_VP7: number;
    AV_CODEC_ID_SANM: number;
    AV_CODEC_ID_SGIRLE: number;
    AV_CODEC_ID_MVC1: number;
    AV_CODEC_ID_MVC2: number;
    AV_CODEC_ID_HQX: number;
    AV_CODEC_ID_TDSC: number;
    AV_CODEC_ID_HQ_HQA: number;
    AV_CODEC_ID_HAP: number;
    AV_CODEC_ID_DDS: number;
    AV_CODEC_ID_DXV: number;
    AV_CODEC_ID_SCREENPRESSO: number;
    AV_CODEC_ID_RSCC: number;
    AV_CODEC_ID_AVS2: number;
    AV_CODEC_ID_PGX: number;
    AV_CODEC_ID_AVS3: number;
    AV_CODEC_ID_MSP2: number;
    AV_CODEC_ID_VVC: number;
    AV_CODEC_ID_Y41P: number;
    AV_CODEC_ID_AVRP: number;
    AV_CODEC_ID_012V: number;
    AV_CODEC_ID_AVUI: number;
    AV_CODEC_ID_AYUV: number;
    AV_CODEC_ID_TARGA_Y216: number;
    AV_CODEC_ID_V308: number;
    AV_CODEC_ID_V408: number;
    AV_CODEC_ID_YUV4: number;
    AV_CODEC_ID_AVRN: number;
    AV_CODEC_ID_CPIA: number;
    AV_CODEC_ID_XFACE: number;
    AV_CODEC_ID_SNOW: number;
    AV_CODEC_ID_SMVJPEG: number;
    AV_CODEC_ID_APNG: number;
    AV_CODEC_ID_DAALA: number;
    AV_CODEC_ID_CFHD: number;
    AV_CODEC_ID_TRUEMOTION2RT: number;
    AV_CODEC_ID_M101: number;
    AV_CODEC_ID_MAGICYUV: number;
    AV_CODEC_ID_SHEERVIDEO: number;
    AV_CODEC_ID_YLC: number;
    AV_CODEC_ID_PSD: number;
    AV_CODEC_ID_PIXLET: number;
    AV_CODEC_ID_SPEEDHQ: number;
    AV_CODEC_ID_FMVC: number;
    AV_CODEC_ID_SCPR: number;
    AV_CODEC_ID_CLEARVIDEO: number;
    AV_CODEC_ID_XPM: number;
    AV_CODEC_ID_AV1: number;
    AV_CODEC_ID_BITPACKED: number;
    AV_CODEC_ID_MSCC: number;
    AV_CODEC_ID_SRGC: number;
    AV_CODEC_ID_SVG: number;
    AV_CODEC_ID_GDV: number;
    AV_CODEC_ID_FITS: number;
    AV_CODEC_ID_IMM4: number;
    AV_CODEC_ID_PROSUMER: number;
    AV_CODEC_ID_MWSC: number;
    AV_CODEC_ID_WCMV: number;
    AV_CODEC_ID_RASC: number;
    AV_CODEC_ID_HYMT: number;
    AV_CODEC_ID_ARBC: number;
    AV_CODEC_ID_AGM: number;
    AV_CODEC_ID_LSCR: number;
    AV_CODEC_ID_VP4: number;
    AV_CODEC_ID_IMM5: number;
    AV_CODEC_ID_MVDV: number;
    AV_CODEC_ID_MVHA: number;
    AV_CODEC_ID_CDTOONS: number;
    AV_CODEC_ID_MV30: number;
    AV_CODEC_ID_NOTCHLC: number;
    AV_CODEC_ID_PFM: number;
    AV_CODEC_ID_MOBICLIP: number;
    AV_CODEC_ID_PHOTOCD: number;
    AV_CODEC_ID_IPU: number;
    AV_CODEC_ID_ARGO: number;
    AV_CODEC_ID_CRI: number;
    AV_CODEC_ID_SIMBIOSIS_IMX: number;
    AV_CODEC_ID_SGA_VIDEO: number;
    AV_CODEC_ID_FIRST_AUDIO: number;
    AV_CODEC_ID_PCM_S16LE: number;
    AV_CODEC_ID_PCM_S16BE: number;
    AV_CODEC_ID_PCM_U16LE: number;
    AV_CODEC_ID_PCM_U16BE: number;
    AV_CODEC_ID_PCM_S8: number;
    AV_CODEC_ID_PCM_U8: number;
    AV_CODEC_ID_PCM_MULAW: number;
    AV_CODEC_ID_PCM_ALAW: number;
    AV_CODEC_ID_PCM_S32LE: number;
    AV_CODEC_ID_PCM_S32BE: number;
    AV_CODEC_ID_PCM_U32LE: number;
    AV_CODEC_ID_PCM_U32BE: number;
    AV_CODEC_ID_PCM_S24LE: number;
    AV_CODEC_ID_PCM_S24BE: number;
    AV_CODEC_ID_PCM_U24LE: number;
    AV_CODEC_ID_PCM_U24BE: number;
    AV_CODEC_ID_PCM_S24DAUD: number;
    AV_CODEC_ID_PCM_ZORK: number;
    AV_CODEC_ID_PCM_S16LE_PLANAR: number;
    AV_CODEC_ID_PCM_DVD: number;
    AV_CODEC_ID_PCM_F32BE: number;
    AV_CODEC_ID_PCM_F32LE: number;
    AV_CODEC_ID_PCM_F64BE: number;
    AV_CODEC_ID_PCM_F64LE: number;
    AV_CODEC_ID_PCM_BLURAY: number;
    AV_CODEC_ID_PCM_LXF: number;
    AV_CODEC_ID_S302M: number;
    AV_CODEC_ID_PCM_S8_PLANAR: number;
    AV_CODEC_ID_PCM_S24LE_PLANAR: number;
    AV_CODEC_ID_PCM_S32LE_PLANAR: number;
    AV_CODEC_ID_PCM_S16BE_PLANAR: number;
    AV_CODEC_ID_PCM_S64LE: number;
    AV_CODEC_ID_PCM_S64BE: number;
    AV_CODEC_ID_PCM_F16LE: number;
    AV_CODEC_ID_PCM_F24LE: number;
    AV_CODEC_ID_PCM_VIDC: number;
    AV_CODEC_ID_PCM_SGA: number;
    AV_CODEC_ID_ADPCM_IMA_QT: number;
    AV_CODEC_ID_ADPCM_IMA_WAV: number;
    AV_CODEC_ID_ADPCM_IMA_DK3: number;
    AV_CODEC_ID_ADPCM_IMA_DK4: number;
    AV_CODEC_ID_ADPCM_IMA_WS: number;
    AV_CODEC_ID_ADPCM_IMA_SMJPEG: number;
    AV_CODEC_ID_ADPCM_MS: number;
    AV_CODEC_ID_ADPCM_4XM: number;
    AV_CODEC_ID_ADPCM_XA: number;
    AV_CODEC_ID_ADPCM_ADX: number;
    AV_CODEC_ID_ADPCM_EA: number;
    AV_CODEC_ID_ADPCM_G726: number;
    AV_CODEC_ID_ADPCM_CT: number;
    AV_CODEC_ID_ADPCM_SWF: number;
    AV_CODEC_ID_ADPCM_YAMAHA: number;
    AV_CODEC_ID_ADPCM_SBPRO_4: number;
    AV_CODEC_ID_ADPCM_SBPRO_3: number;
    AV_CODEC_ID_ADPCM_SBPRO_2: number;
    AV_CODEC_ID_ADPCM_THP: number;
    AV_CODEC_ID_ADPCM_IMA_AMV: number;
    AV_CODEC_ID_ADPCM_EA_R1: number;
    AV_CODEC_ID_ADPCM_EA_R3: number;
    AV_CODEC_ID_ADPCM_EA_R2: number;
    AV_CODEC_ID_ADPCM_IMA_EA_SEAD: number;
    AV_CODEC_ID_ADPCM_IMA_EA_EACS: number;
    AV_CODEC_ID_ADPCM_EA_XAS: number;
    AV_CODEC_ID_ADPCM_EA_MAXIS_XA: number;
    AV_CODEC_ID_ADPCM_IMA_ISS: number;
    AV_CODEC_ID_ADPCM_G722: number;
    AV_CODEC_ID_ADPCM_IMA_APC: number;
    AV_CODEC_ID_ADPCM_VIMA: number;
    AV_CODEC_ID_ADPCM_AFC: number;
    AV_CODEC_ID_ADPCM_IMA_OKI: number;
    AV_CODEC_ID_ADPCM_DTK: number;
    AV_CODEC_ID_ADPCM_IMA_RAD: number;
    AV_CODEC_ID_ADPCM_G726LE: number;
    AV_CODEC_ID_ADPCM_THP_LE: number;
    AV_CODEC_ID_ADPCM_PSX: number;
    AV_CODEC_ID_ADPCM_AICA: number;
    AV_CODEC_ID_ADPCM_IMA_DAT4: number;
    AV_CODEC_ID_ADPCM_MTAF: number;
    AV_CODEC_ID_ADPCM_AGM: number;
    AV_CODEC_ID_ADPCM_ARGO: number;
    AV_CODEC_ID_ADPCM_IMA_SSI: number;
    AV_CODEC_ID_ADPCM_ZORK: number;
    AV_CODEC_ID_ADPCM_IMA_APM: number;
    AV_CODEC_ID_ADPCM_IMA_ALP: number;
    AV_CODEC_ID_ADPCM_IMA_MTF: number;
    AV_CODEC_ID_ADPCM_IMA_CUNNING: number;
    AV_CODEC_ID_ADPCM_IMA_MOFLEX: number;
    AV_CODEC_ID_AMR_NB: number;
    AV_CODEC_ID_AMR_WB: number;
    AV_CODEC_ID_RA_144: number;
    AV_CODEC_ID_RA_288: number;
    AV_CODEC_ID_ROQ_DPCM: number;
    AV_CODEC_ID_INTERPLAY_DPCM: number;
    AV_CODEC_ID_XAN_DPCM: number;
    AV_CODEC_ID_SOL_DPCM: number;
    AV_CODEC_ID_SDX2_DPCM: number;
    AV_CODEC_ID_GREMLIN_DPCM: number;
    AV_CODEC_ID_DERF_DPCM: number;
    AV_CODEC_ID_MP2: number;
    AV_CODEC_ID_MP3: number;
    AV_CODEC_ID_AAC: number;
    AV_CODEC_ID_AC3: number;
    AV_CODEC_ID_DTS: number;
    AV_CODEC_ID_VORBIS: number;
    AV_CODEC_ID_DVAUDIO: number;
    AV_CODEC_ID_WMAV1: number;
    AV_CODEC_ID_WMAV2: number;
    AV_CODEC_ID_MACE3: number;
    AV_CODEC_ID_MACE6: number;
    AV_CODEC_ID_VMDAUDIO: number;
    AV_CODEC_ID_FLAC: number;
    AV_CODEC_ID_MP3ADU: number;
    AV_CODEC_ID_MP3ON4: number;
    AV_CODEC_ID_SHORTEN: number;
    AV_CODEC_ID_ALAC: number;
    AV_CODEC_ID_WESTWOOD_SND1: number;
    AV_CODEC_ID_GSM: number;
    AV_CODEC_ID_QDM2: number;
    AV_CODEC_ID_COOK: number;
    AV_CODEC_ID_TRUESPEECH: number;
    AV_CODEC_ID_TTA: number;
    AV_CODEC_ID_SMACKAUDIO: number;
    AV_CODEC_ID_QCELP: number;
    AV_CODEC_ID_WAVPACK: number;
    AV_CODEC_ID_DSICINAUDIO: number;
    AV_CODEC_ID_IMC: number;
    AV_CODEC_ID_MUSEPACK7: number;
    AV_CODEC_ID_MLP: number;
    AV_CODEC_ID_GSM_MS: number;
    AV_CODEC_ID_ATRAC3: number;
    AV_CODEC_ID_APE: number;
    AV_CODEC_ID_NELLYMOSER: number;
    AV_CODEC_ID_MUSEPACK8: number;
    AV_CODEC_ID_SPEEX: number;
    AV_CODEC_ID_WMAVOICE: number;
    AV_CODEC_ID_WMAPRO: number;
    AV_CODEC_ID_WMALOSSLESS: number;
    AV_CODEC_ID_ATRAC3P: number;
    AV_CODEC_ID_EAC3: number;
    AV_CODEC_ID_SIPR: number;
    AV_CODEC_ID_MP1: number;
    AV_CODEC_ID_TWINVQ: number;
    AV_CODEC_ID_TRUEHD: number;
    AV_CODEC_ID_MP4ALS: number;
    AV_CODEC_ID_ATRAC1: number;
    AV_CODEC_ID_BINKAUDIO_RDFT: number;
    AV_CODEC_ID_BINKAUDIO_DCT: number;
    AV_CODEC_ID_AAC_LATM: number;
    AV_CODEC_ID_QDMC: number;
    AV_CODEC_ID_CELT: number;
    AV_CODEC_ID_G723_1: number;
    AV_CODEC_ID_G729: number;
    AV_CODEC_ID_8SVX_EXP: number;
    AV_CODEC_ID_8SVX_FIB: number;
    AV_CODEC_ID_BMV_AUDIO: number;
    AV_CODEC_ID_RALF: number;
    AV_CODEC_ID_IAC: number;
    AV_CODEC_ID_ILBC: number;
    AV_CODEC_ID_OPUS: number;
    AV_CODEC_ID_COMFORT_NOISE: number;
    AV_CODEC_ID_TAK: number;
    AV_CODEC_ID_METASOUND: number;
    AV_CODEC_ID_PAF_AUDIO: number;
    AV_CODEC_ID_ON2AVC: number;
    AV_CODEC_ID_DSS_SP: number;
    AV_CODEC_ID_CODEC2: number;
    AV_CODEC_ID_FFWAVESYNTH: number;
    AV_CODEC_ID_SONIC: number;
    AV_CODEC_ID_SONIC_LS: number;
    AV_CODEC_ID_EVRC: number;
    AV_CODEC_ID_SMV: number;
    AV_CODEC_ID_DSD_LSBF: number;
    AV_CODEC_ID_DSD_MSBF: number;
    AV_CODEC_ID_DSD_LSBF_PLANAR: number;
    AV_CODEC_ID_DSD_MSBF_PLANAR: number;
    AV_CODEC_ID_4GV: number;
    AV_CODEC_ID_INTERPLAY_ACM: number;
    AV_CODEC_ID_XMA1: number;
    AV_CODEC_ID_XMA2: number;
    AV_CODEC_ID_DST: number;
    AV_CODEC_ID_ATRAC3AL: number;
    AV_CODEC_ID_ATRAC3PAL: number;
    AV_CODEC_ID_DOLBY_E: number;
    AV_CODEC_ID_APTX: number;
    AV_CODEC_ID_APTX_HD: number;
    AV_CODEC_ID_SBC: number;
    AV_CODEC_ID_ATRAC9: number;
    AV_CODEC_ID_HCOM: number;
    AV_CODEC_ID_ACELP_KELVIN: number;
    AV_CODEC_ID_MPEGH_3D_AUDIO: number;
    AV_CODEC_ID_SIREN: number;
    AV_CODEC_ID_HCA: number;
    AV_CODEC_ID_FASTAUDIO: number;
    AV_CODEC_ID_FIRST_SUBTITLE: number;
    AV_CODEC_ID_DVD_SUBTITLE: number;
    AV_CODEC_ID_DVB_SUBTITLE: number;
    AV_CODEC_ID_TEXT: number;
    AV_CODEC_ID_XSUB: number;
    AV_CODEC_ID_SSA: number;
    AV_CODEC_ID_MOV_TEXT: number;
    AV_CODEC_ID_HDMV_PGS_SUBTITLE: number;
    AV_CODEC_ID_DVB_TELETEXT: number;
    AV_CODEC_ID_SRT: number;
    AV_CODEC_ID_MICRODVD: number;
    AV_CODEC_ID_EIA_608: number;
    AV_CODEC_ID_JACOSUB: number;
    AV_CODEC_ID_SAMI: number;
    AV_CODEC_ID_REALTEXT: number;
    AV_CODEC_ID_STL: number;
    AV_CODEC_ID_SUBVIEWER1: number;
    AV_CODEC_ID_SUBVIEWER: number;
    AV_CODEC_ID_SUBRIP: number;
    AV_CODEC_ID_WEBVTT: number;
    AV_CODEC_ID_MPL2: number;
    AV_CODEC_ID_VPLAYER: number;
    AV_CODEC_ID_PJS: number;
    AV_CODEC_ID_ASS: number;
    AV_CODEC_ID_HDMV_TEXT_SUBTITLE: number;
    AV_CODEC_ID_TTML: number;
    AV_CODEC_ID_ARIB_CAPTION: number;
    AV_CODEC_ID_FIRST_UNKNOWN: number;
    AV_CODEC_ID_TTF: number;
    AV_CODEC_ID_SCTE_35: number;
    AV_CODEC_ID_EPG: number;
    AV_CODEC_ID_BINTEXT: number;
    AV_CODEC_ID_XBIN: number;
    AV_CODEC_ID_IDF: number;
    AV_CODEC_ID_OTF: number;
    AV_CODEC_ID_SMPTE_KLV: number;
    AV_CODEC_ID_DVD_NAV: number;
    AV_CODEC_ID_TIMED_ID3: number;
    AV_CODEC_ID_BIN_DATA: number;
    AV_CODEC_ID_PROBE: number;
    AV_CODEC_ID_MPEG2TS: number;
    AV_CODEC_ID_MPEG4SYSTEMS: number;
    AV_CODEC_ID_FFMETADATA: number;
    AV_CODEC_ID_WRAPPED_AVFRAME: number;
};

export class Packet {
    constructor();
    data(): ArrayBuffer;
    update(options: Partial<IPacketParams>): void;
}

export interface IPacketParams {
    pts: number;
}
