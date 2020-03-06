interface Processor {
    init(): void;

    destroy(): void;

    render(texture: WebGLTexture): void;

    getWidth(): number;

    getHeight(): number;

    getTexture(): WebGLTexture;

    resize(width: number, height: number): void;
}

export default Processor;
