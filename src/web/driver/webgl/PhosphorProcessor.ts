import Processor from './Processor';
import { Program, compileProgram, getUniformLocation, getAttributeLocation } from './util';
import { vsh, fsh } from './shader';

class PhosphorProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext) {}

    init(): void {
        const gl = this._gl;

        this._framebuffer = gl.createFramebuffer();
        this._program = compileProgram(gl, vsh.plain.source, fsh.phosphor.source);

        this._vertexCoordinateBuffer = gl.createBuffer();
        this._textureCoordinateBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
    }

    destroy(): void {
        const gl = this._gl;

        gl.deleteFramebuffer(this._framebuffer);
        gl.deleteProgram(this._program.program);
        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);

        if (this._texture0) gl.deleteTexture(this._texture0);
        if (this._texture1) gl.deleteTexture(this._texture1);
    }

    render(texture: WebGLTexture): void {
        const gl = this._gl;

        const vertexCoordinateLocation = getAttributeLocation(
            gl,
            this._program.program,
            vsh.plain.attribute.vertexPosition
        );
        const textureCoordinateLocation = getAttributeLocation(
            gl,
            this._program.program,
            vsh.plain.attribute.textureCoordinate
        );

        gl.useProgram(this._program.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._texture0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.vertexAttribPointer(vertexCoordinateLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexCoordinateLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.vertexAttribPointer(textureCoordinateLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textureCoordinateLocation);

        gl.uniform1f(getUniformLocation(gl, this._program.program, fsh.phosphor.uniform.level), this._level);
        gl.uniform1i(getUniformLocation(gl, this._program.program, fsh.phosphor.uniform.textureUnitNew), 0);
        gl.uniform1i(getUniformLocation(gl, this._program.program, fsh.phosphor.uniform.textureUnitPrevious), 1);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.activeTexture(gl.TEXTURE2);
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

    configure(width: number, height: number, level: number) {
        this._width = width;
        this._height = height;
        this._level = level;

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

    private _width = 0;
    private _height = 0;
    private _level = 0;

    private _texture0: WebGLTexture = null;
    private _texture1: WebGLTexture = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _program: Program = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;
}

export default PhosphorProcessor;
