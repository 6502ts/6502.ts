export const enum Type {
    passthrough,
    merge
}

export interface ProcessorConfig {
    type: Type;
}

export interface PassthroughProcessorConfig extends ProcessorConfig {
    type: Type.passthrough;
}

export interface FrameMergeProcessorConfig extends ProcessorConfig {
    type: Type.merge;
}
