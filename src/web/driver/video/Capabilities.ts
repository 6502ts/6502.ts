export interface Capabilities {
    floatTextures: boolean;
    halfFloatTextures: boolean;
    highpSupport: boolean;
}

function framebufferSupportTextureType(gl: WebGLRenderingContext, type: number): boolean {
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 64, 0, gl.RGBA, type, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);

    return fbStatus === gl.FRAMEBUFFER_COMPLETE;
}

function detectFloatTextureSupport(gl: WebGLRenderingContext): boolean {
    gl.getExtension('WEBGL_color_buffer_float');
    if (!gl.getExtension('OES_texture_float')) return false;

    return framebufferSupportTextureType(gl, gl.FLOAT);
}

function detectHalfFloatTextureSupport(gl: WebGLRenderingContext): boolean {
    gl.getExtension('EXT_color_buffer_half_float');

    const extHalfFLoat = gl.getExtension('OES_texture_half_float');
    if (!extHalfFLoat) {
        return false;
    }

    return framebufferSupportTextureType(gl, extHalfFLoat.HALF_FLOAT_OES);
}

function shaderSupportsPrecision(gl: WebGLRenderingContext, shaderType: number, precisionType: number): boolean {
    const format = gl.getShaderPrecisionFormat(shaderType, precisionType);

    return !!format && format.precision > 0;
}

export function detect(): Capabilities | null;
export function detect(gl: WebGLRenderingContext): Capabilities;
export function detect(gl: WebGLRenderingContext = null) {
    if (!gl) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;

        gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as any);
    }

    if (!gl) return null;

    return {
        floatTextures: detectFloatTextureSupport(gl),
        halfFloatTextures: detectHalfFloatTextureSupport(gl),
        highpSupport: shaderSupportsPrecision(gl, gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
    };
}
