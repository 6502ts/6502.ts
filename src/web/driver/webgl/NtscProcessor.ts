import Processor from './Processor';
import { Program, compileProgram, getAttributeLocation, getUniformLocation } from './util';
import { vsh, fsh } from './shader';

class NtscProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext) {}

    init(): void {
        const gl = this._gl;

        gl.getExtension('OES_texture_float');

        this._programPass1 = compileProgram(gl, vsh.plain.source, fsh.ntscPass1.source);
        this._programPass2 = compileProgram(gl, vsh.plain.source, fsh.ntscPass2.source);

        this._framebuffer = gl.createFramebuffer();

        this._vertexCoordinateBuffer = gl.createBuffer();
        this._textureCoordinateBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
    }

    destroy(): void {
        const gl = this._gl;

        gl.deleteProgram(this._programPass1.program);
        gl.deleteProgram(this._programPass2.program);

        gl.deleteFramebuffer(this._framebuffer);

        for (const shader of [
            this._programPass1.fsh,
            this._programPass1.vsh,
            this._programPass2.fsh,
            this._programPass2.vsh
        ]) {
            gl.deleteShader(shader);
        }

        gl.deleteTexture(this._targetPass1);
        gl.deleteTexture(this._targetPass2);

        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);
    }

    render(texture: WebGLTexture): void {
        this._pass(texture, this._targetPass1, this._programPass1.program, 960, (gl, program) => {
            gl.uniform1i(getUniformLocation(gl, program, fsh.ntscPass1.uniform.textureUnit), 0);
        });

        this._pass(this._targetPass1, this._targetPass2, this._programPass2.program, 480, (gl, program) => {
            gl.uniform1i(getUniformLocation(gl, program, fsh.ntscPass2.uniform.textureUnit), 0);
        });

        this._frameCount = (this._frameCount + 1) % 2;
    }

    getWidth(): number {
        return 480;
    }

    getHeight(): number {
        return this._height;
    }

    getTexture(): WebGLTexture {
        return this._targetPass2;
    }

    configure(width: number, height: number): void {
        if (width !== 160) {
            throw new Error('NTSC postprocessor supports only for width = 160');
        }

        this._height = height;

        const gl = this._gl;

        if (this._targetPass1) gl.deleteTexture(this._targetPass1);
        if (this._targetPass2) gl.deleteTexture(this._targetPass2);

        this._targetPass1 = gl.createTexture();
        this._targetPass2 = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);

        for (const texture of [this._targetPass1, this._targetPass2]) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                texture === this._targetPass1 ? 960 : 480,
                height,
                0,
                gl.RGBA,
                texture === this._targetPass1 ? gl.FLOAT : gl.UNSIGNED_BYTE,
                null
            );

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
    }

    private _pass(
        textureIn: WebGLTexture,
        textureOut: WebGLTexture,
        program: WebGLProgram,
        width: number,
        setupUniforms: (gl: WebGLRenderingContext, program: WebGLProgram) => void
    ): void {
        const gl = this._gl;

        const vertexCoordinateLocation = getAttributeLocation(gl, program, vsh.plain.attribute.vertexPosition);
        const textureCoordinateLocation = getAttributeLocation(gl, program, vsh.plain.attribute.textureCoordinate);

        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureIn);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.vertexAttribPointer(vertexCoordinateLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexCoordinateLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.vertexAttribPointer(textureCoordinateLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textureCoordinateLocation);

        setupUniforms(gl, program);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.activeTexture(gl.TEXTURE1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureOut, 0);

        gl.viewport(0, 0, width, this._height);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private _height = 0;
    private _frameCount = 0;

    private _programPass1: Program = null;
    private _programPass2: Program = null;
    private _targetPass1: WebGLTexture = null;
    private _targetPass2: WebGLTexture = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;
}

export default NtscProcessor;
