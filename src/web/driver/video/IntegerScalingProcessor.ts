import Processor from './Processor';
import Program from './Program';
import { fsh, vsh } from './shader';
import { Capabilities } from './Capabilities';

class IntegerScalingProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext, private _capabilities: Capabilities) {}

    init(): void {
        if (this._initialized) return;

        const gl = this._gl;

        this._framebuffer = gl.createFramebuffer();
        this._program = Program.compile(gl, vsh.plain.source(this._capabilities), fsh.blit.source(this._capabilities));

        this._program.use();
        this._program.uniform1i(fsh.blit.uniform.textureUnit, 0);

        this._vertexCoordinateBuffer = gl.createBuffer();
        this._textureCoordinateBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);

        this._initialized = true;
    }

    destroy(): void {
        if (!this._initialized) return;

        const gl = this._gl;

        this._program.delete();
        gl.deleteFramebuffer(this._framebuffer);
        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);

        if (this._texture) gl.deleteTexture(this._texture);

        this._initialized = false;
    }

    render(texture: WebGLTexture): void {
        const gl = this._gl;

        this._program.use();

        this._program.bindVertexAttribArray(
            vsh.plain.attribute.vertexPosition,
            this._vertexCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        this._program.bindVertexAttribArray(
            vsh.plain.attribute.textureCoordinate,
            this._textureCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);

        gl.viewport(0, 0, this._width, this._height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return this._height;
    }

    getTexture(): WebGLTexture {
        return this._texture;
    }

    resize(width: number, height: number): void {
        this._widthFrom = width;
        this._heightFrom = height;

        this._reconfigure();
    }

    configure(widthTo: number, heightTo: number): void {
        this._widthTo = widthTo;
        this._heightTo = heightTo;

        this._reconfigure();
    }

    private _reconfigure(): void {
        if (
            this._widthFrom <= 0 ||
            this._heightFrom <= 0 ||
            this._widthTo <= 0 ||
            this._heightTo <= 0 ||
            !this._initialized
        )
            return;

        this._width =
            this._widthTo > this._widthFrom
                ? Math.floor(this._widthTo / this._widthFrom) * this._widthFrom
                : this._widthFrom;
        this._height =
            this._heightTo > this._heightFrom
                ? Math.floor(this._heightTo / this._heightFrom) * this._heightFrom
                : this._heightFrom;

        const gl = this._gl;

        if (this._texture) gl.deleteTexture(this._texture);
        this._texture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._width, this._height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    private _width = 0;
    private _height = 0;

    private _widthFrom = 0;
    private _heightFrom = 0;
    private _widthTo = 0;
    private _heightTo = 0;

    private _texture: WebGLTexture = null;
    private _program: Program = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;

    private _initialized = false;
}

export default IntegerScalingProcessor;
