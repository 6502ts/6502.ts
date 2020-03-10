import Processor from './Processor';
import Program from './Program';
import { vsh, fsh } from './shader';
import { Capabilities } from './Capabilities';

class NtscProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext, private _capabilities: Capabilities) {}

    init(): void {
        if (this._initialized) return;

        const gl = this._gl;

        gl.getExtension('WEBGL_color_buffer_float');
        gl.getExtension('OES_texture_float');

        this._programPass1 = Program.compile(
            gl,
            vsh.plain.source(this._capabilities),
            fsh.ntscPass1.source(this._capabilities)
        );
        this._programPass2 = Program.compile(
            gl,
            vsh.plain.source(this._capabilities),
            fsh.ntscPass2.source(this._capabilities)
        );

        this._programPass1.use();
        this._programPass1.uniform1i(fsh.ntscPass1.uniform.textureUnit, 0);

        this._programPass2.use();
        this._programPass2.uniform1i(fsh.ntscPass2.uniform.textureUnit, 0);

        this._framebuffer = gl.createFramebuffer();

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

        this._programPass1.delete();
        this._programPass2.delete();

        gl.deleteFramebuffer(this._framebuffer);

        gl.deleteTexture(this._targetPass1);
        gl.deleteTexture(this._targetPass2);

        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);

        this._initialized = false;
    }

    render(texture: WebGLTexture): void {
        this._pass(texture, this._targetPass1, this._programPass1, 960);
        this._pass(this._targetPass1, this._targetPass2, this._programPass2, 480);
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

    resize(width: number, height: number): void {
        if (!this._initialized) return;

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
                texture === this._targetPass1 ? this._textureType() : gl.UNSIGNED_BYTE,
                null
            );

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
    }

    configure(mode: NtscProcessor.mode) {
        if (!this._initialized) return;

        this._programPass1.use();

        if (mode === NtscProcessor.mode.composite) {
            this._programPass1.uniform1f(fsh.ntscPass1.uniform.artifacting, 1);
            this._programPass1.uniform1f(fsh.ntscPass1.uniform.fringing, 1);
        } else {
            this._programPass1.uniform1f(fsh.ntscPass1.uniform.artifacting, 0);
            this._programPass1.uniform1f(fsh.ntscPass1.uniform.fringing, 0);
        }
    }

    private _pass(textureIn: WebGLTexture, textureOut: WebGLTexture, program: Program, width: number): void {
        const gl = this._gl;

        program.use();

        program.bindVertexAttribArray(
            vsh.plain.attribute.vertexPosition,
            this._vertexCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        program.bindVertexAttribArray(
            vsh.plain.attribute.textureCoordinate,
            this._textureCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureIn);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureOut, 0);

        gl.viewport(0, 0, width, this._height);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private _textureType(): number {
        const gl = this._gl;

        if (this._capabilities.floatTextures) {
            return gl.FLOAT;
        }

        if (this._capabilities.halfFloatTextures) {
            return gl.getExtension('OES_texture_half_float').HALF_FLOAT_OES;
        }

        return gl.UNSIGNED_BYTE;
    }

    private _height = 0;

    private _programPass1: Program = null;
    private _programPass2: Program = null;
    private _targetPass1: WebGLTexture = null;
    private _targetPass2: WebGLTexture = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;

    private _initialized = false;
}

namespace NtscProcessor {
    export const enum mode {
        composite = 'composite',
        svideo = 'svideo'
    }
}

export default NtscProcessor;
