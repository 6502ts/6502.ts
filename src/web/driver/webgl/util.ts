export interface Program {
    program: WebGLProgram;
    vsh: WebGLShader;
    fsh: WebGLShader;
}

function compileShader(gl: WebGLRenderingContext, type: GLenum, source: string): WebGLShader {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`failed to compile shader:\n\n${gl.getShaderInfoLog(shader)}\n\n${source}`);
    }

    return shader;
}

export function compileProgram(gl: WebGLRenderingContext, vshSource: string, fshSource: string): Program {
    const vsh = compileShader(gl, gl.VERTEX_SHADER, vshSource);
    const fsh = compileShader(gl, gl.FRAGMENT_SHADER, fshSource);
    const program = gl.createProgram();

    gl.attachShader(program, vsh);
    gl.attachShader(program, fsh);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`failed to link program:\n\n${gl.getProgramInfoLog(program)}`);
    }

    return {
        program,
        vsh,
        fsh
    };
}

export function getAttributeLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): number {
    const location = gl.getAttribLocation(program, name);

    if (location < 0) {
        throw new Error(`unable to locate attribute ${name}`);
    }

    return location;
}

export function getUniformLocation(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    name: string
): WebGLUniformLocation {
    const location = gl.getUniformLocation(program, name);

    if (location === null) {
        throw new Error(`unable to locate uniform ${name}`);
    }

    return location;
}
