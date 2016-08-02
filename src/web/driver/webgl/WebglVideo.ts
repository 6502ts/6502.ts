import * as fs from 'fs';

import ObjectPool from '../../../tools/pool/Pool';
import ObjectPoolMember from '../../../tools/pool/PoolMemberInterface';
import Surface from '../../../tools/surface/ImageDataSurface';
import VideoOutputInterface from '../../../machine/io/VideoOutputInterface';

const fragmentShaderSource = fs.readFileSync(__dirname + '/shader/render.fsh', 'utf-8');
const vertexShaderSource = fs.readFileSync(__dirname + '/shader/render.vsh', 'utf-8');

const FRAME_COMPOSITING_COUNT = 3;

export default class WebglVideoDriver {

    constructor(
        private _canvas: HTMLCanvasElement,
        private _gamma = 1
    ) {
        this._gl = this._canvas.getContext('webgl', {
            alpha: false
        }) as WebGLRenderingContext;
    }

    init(): void {
        this._createProgram();
        this._createBuffers();
        this._allocateTextures();
        this._setupAttribs();
    }

    bind(video: VideoOutputInterface): void {
        if (this._video) {
            return;
        }

        this._video = video;

        this._width = this._video.getWidth();
        this._height = this._video.getHeight();

        this._surfacePool = new ObjectPool<Surface>(
            () => new Surface(this._width, this._height)
        );

        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._gl.viewport(0, 0, this._width, this._height);

        this._video.setSurfaceFactory((): Surface => {
            const member  = this._surfacePool.get(),
                surface = member.get();

            this._poolMembers.set(surface, member);

            return surface;
        });

        this._video.newFrame.addHandler(WebglVideoDriver._frameHandler, this);
    }

    unbind(): void {
        if (!this._video) {
            return;
        }

        this._video.setSurfaceFactory(null);
        this._video.newFrame.removeHandler(WebglVideoDriver._frameHandler, this);

        this._surfacePool = null;
        this._video = null;
    }

    private static _frameHandler(surface: Surface, self: WebglVideoDriver): void {
        const gl = self._gl,
            oldSurface = self._surfaces[self._currentFrameIndex];

        self._surfaces[self._currentFrameIndex] = surface;

        gl.activeTexture((gl as any)[`TEXTURE${self._currentFrameIndex}`]);
        gl.bindTexture(gl.TEXTURE_2D, self._textures[self._currentFrameIndex]);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            surface.getImageData()
        );

        if (self._frameCount < FRAME_COMPOSITING_COUNT) {
            self._currentFrameIndex = (self._currentFrameIndex + 1) % FRAME_COMPOSITING_COUNT;
            self._frameCount++;
            return;
        }

        for (let i = 0; i < FRAME_COMPOSITING_COUNT; i++) {
            gl.uniform1i(
                self._getUniformLocation(`u_Sampler${i}`),
                (self._currentFrameIndex + FRAME_COMPOSITING_COUNT - i) % FRAME_COMPOSITING_COUNT
            );
        }

        gl.uniform1f(self._getUniformLocation('u_Gamma'), self._gamma);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        self._currentFrameIndex = (self._currentFrameIndex + 1) % FRAME_COMPOSITING_COUNT;

        const poolMember = self._poolMembers.get(oldSurface);

        if (poolMember) {
            poolMember.release();
        }
    }

    private _createProgram(): void {
        const gl = this._gl,
            vertexShader = gl.createShader(gl.VERTEX_SHADER),
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER),
            program = gl.createProgram();

        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(`failed to compile vertex shader: ${gl.getShaderInfoLog(vertexShader)}`);
        }

        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(`failed to compile fragment shader: ${gl.getShaderInfoLog(fragmentShader)}`);
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`failed to link program: ${gl.getProgramInfoLog(program)}`);
        }

        gl.useProgram(program);

        this._program = program;
    }

    private _allocateTextures(): void {
        for (let i = 0; i < FRAME_COMPOSITING_COUNT; i++) {
            this._allocateTexture(i);
        }
    }

    private _allocateTexture(index: number): void {
        const gl = this._gl,
            texture = gl.createTexture();

        gl.activeTexture((gl as any)[`TEXTURE${index}`]);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

        this._textures[index] = texture;
    }

    private _createBuffers(): void {
        const gl = this._gl,
            vertexBuffer = gl.createBuffer(),
            textureCoordinateBuffer = gl.createBuffer();

        const vertexData = [1, 1,   -1, 1,   1, -1,   -1, -1],
            textureCoordinateData = [1, 1,   0, 1,   1, 0,   0, 0];

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinateData), gl.STATIC_DRAW);

        this._vertexBuffer = vertexBuffer;
        this._textureCoordinateBuffer = textureCoordinateBuffer;
    }

    private _getAttribLocation(name: string): number {
        const gl = this._gl,
            location = gl.getAttribLocation(this._program, name);

        if (location < 0) {
            throw new Error(`unable to locate attribute ${name}`);
        }

        return location;
    }

    private _getUniformLocation(name: string): WebGLUniformLocation {
        const gl = this._gl,
            location = gl.getUniformLocation(this._program, name);

        if (location < 0) {
            throw new Error(`unable to locate uniform ${name}`);
        }

        return location;
    }

    private _setupAttribs(): void {
        const gl = this._gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.enableVertexAttribArray(this._getAttribLocation('a_VertexPosition'));
        gl.vertexAttribPointer(
            this._getAttribLocation('a_VertexPosition'),
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.enableVertexAttribArray(this._getAttribLocation('a_TextureCoordinate'));
        gl.vertexAttribPointer(
            this._getAttribLocation('a_TextureCoordinate'),
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
    }

    private _gl: WebGLRenderingContext = null;

    private _program: WebGLProgram = null;
    private _vertexBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;

    private _textures = new Array<WebGLTexture>(FRAME_COMPOSITING_COUNT);
    private _surfaces = new Array<Surface>(FRAME_COMPOSITING_COUNT);
    private _currentFrameIndex = 0;
    private _frameCount = 0;

    private _poolMembers  = new WeakMap<Surface, ObjectPoolMember<Surface>>();
    private _surfacePool: ObjectPool<Surface>;
    private _width = 0;
    private _height = 0;
    private _video: VideoOutputInterface = null;

}
