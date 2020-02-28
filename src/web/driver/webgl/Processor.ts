interface Processor {
    init(): void;

    destroy(): void;

    render(texture: WebGLTexture): void;

    getWidth(): number;

    getHeight(): number;

    getTexture(): WebGLTexture;
}

export default Processor;
