import Processor from './Processor';
import { Program, compileProgram, getAttributeLocation, getUniformLocation } from './util';
import { fsh, vsh } from './shader';

class IntegerScalingProcessor implements Processor {
    constructor(private _gl: WebGLRenderingContext) {}

    init(): void {
        const gl = this._gl;

        this._framebuffer = gl.createFramebuffer();
        this._program = compileProgram(gl, vsh.plain.source, fsh.blit.source);

        this._vertexCoordinateBuffer = gl.createBuffer();
        this._textureCoordinateBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
    }

    destroy(): void {
        const gl = this._gl;

        gl.deleteProgram(this._program.program);
        gl.deleteShader(this._program.fsh);
        gl.deleteShader(this._program.vsh);
        gl.deleteFramebuffer(this._framebuffer);
        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);

        if (this._texture) gl.deleteTexture(this._texture);
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.vertexAttribPointer(vertexCoordinateLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexCoordinateLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.vertexAttribPointer(textureCoordinateLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textureCoordinateLocation);

        gl.uniform1i(getUniformLocation(gl, this._program.program, fsh.blit.uniform.textureUnit), 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.activeTexture(gl.TEXTURE1);
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

    configure(widthFrom: number, heightFrom: number, widthTo: number, heightTo: number): void {
        this._width = widthTo > widthFrom ? Math.floor(widthTo / widthFrom) * widthFrom : widthFrom;
        this._height = heightTo > heightFrom ? Math.floor(heightTo / heightFrom) * heightFrom : heightFrom;

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

    private _texture: WebGLTexture = null;
    private _program: Program = null;
    private _framebuffer: WebGLFramebuffer = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;
}

export default IntegerScalingProcessor;
