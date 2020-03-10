import Processor from './Processor';
import Program from './Program';
import { vsh, fsh } from './shader';
import { Capabilities } from './Capabilities';

class PhosphorProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext, private _capabilities: Capabilities) {}

    init(): void {
        if (this._initialized) return;

        const gl = this._gl;

        this._framebuffer = gl.createFramebuffer();
        this._program = Program.compile(
            gl,
            vsh.plain.source(this._capabilities),
            fsh.phosphor.source(this._capabilities)
        );

        this._program.use();
        this._program.uniform1i(fsh.phosphor.uniform.textureUnitNew, 0);
        this._program.uniform1i(fsh.phosphor.uniform.textureUnitPrevious, 1);

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

        if (this._texture0) gl.deleteTexture(this._texture0);
        if (this._texture1) gl.deleteTexture(this._texture1);

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

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._texture0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture1, 0);

        gl.viewport(0, 0, this._width, this._height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        const t = this._texture1;
        this._texture1 = this._texture0;
        this._texture0 = t;
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return this._height;
    }

    getTexture(): WebGLTexture {
        return this._texture0;
    }

    resize(width: number, height: number): void {
        if (!this._initialized) return;

        this._width = width;
        this._height = height;

        const gl = this._gl;

        if (this._texture0) gl.deleteTexture(this._texture0);
        if (this._texture1) gl.deleteTexture(this._texture1);

        this._texture0 = gl.createTexture();
        this._texture1 = gl.createTexture();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 1);
        gl.activeTexture(gl.TEXTURE0);

        for (const texture of [this._texture0, this._texture1]) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }

    configure(level: number) {
        if (!this._initialized) return;

        this._program.use();
        this._program.uniform1f(fsh.phosphor.uniform.level, level);
    }

    private _width = 0;
    private _height = 0;

    private _texture0: WebGLTexture = null;
    private _texture1: WebGLTexture = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _program: Program = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;

    private _initialized = false;
}

export default PhosphorProcessor;
