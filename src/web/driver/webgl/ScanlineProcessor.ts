import Processor from './Processor';
import Program from './Program';
import { fsh, vsh } from './shader';

class ScanlineProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext) {}

    init(): void {
        if (this._initialized) return;

        const gl = this._gl;

        this._framebuffer = gl.createFramebuffer();
        this._program = Program.compile(gl, vsh.plain.source, fsh.scanlines.source);

        this._program.use();
        this._program.uniform1i(fsh.scanlines.uniform.textureUnit, 0);

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

        gl.viewport(0, 0, this._width, 2 * this._height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return 2 * this._height;
    }

    getTexture(): WebGLTexture {
        return this._texture;
    }

    resize(width: number, height: number): void {
        if (!this._initialized) return;

        this._width = width;
        this._height = height;

        const gl = this._gl;

        if (this._texture) gl.deleteTexture(this._texture);
        this._texture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, 2 * height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        this._program.use();
        this._program.uniform1f(fsh.scanlines.uniform.height, 2 * this._height);
    }

    configure(level: number): void {
        if (!this._initialized) return;

        this._program.use();
        this._program.uniform1f(fsh.scanlines.uniform.level, 1 - level);
    }

    private _width = 0;
    private _height = 0;

    private _texture: WebGLTexture = null;
    private _program: Program = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;

    private _initialized = false;
}

export default ScanlineProcessor;
