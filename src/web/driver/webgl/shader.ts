export const vertexShader = `
    attribute vec2 a_VertexPosition;
    attribute vec2 a_TextureCoordinate;

    varying vec2 v_TextureCoordinate;

    void main() {
        v_TextureCoordinate = a_TextureCoordinate;
        gl_Position = vec4(a_VertexPosition, 0, 1);
    }
`;

export const fragmentShaderPlain = `
    precision mediump float;

    varying vec2 v_TextureCoordinate;

    uniform sampler2D u_Sampler0;
    uniform float u_Gamma;

    void main() {
        vec4 texel = texture2D(u_Sampler0, v_TextureCoordinate);

        gl_FragColor = vec4(pow(texel.rgb, vec3(u_Gamma)), 1.);
    }
`;

export const fragmentShaderPov = `
    precision mediump float;

    varying vec2 v_TextureCoordinate;

    uniform sampler2D u_Sampler0, u_Sampler1, u_Sampler2;
    uniform float u_Gamma;

    void main() {
        vec4 compositedTexel =
            0.4 * texture2D(u_Sampler0, v_TextureCoordinate) +
            0.4 * texture2D(u_Sampler1, v_TextureCoordinate) +
            0.2 * texture2D(u_Sampler2, v_TextureCoordinate);

        gl_FragColor = vec4(pow(compositedTexel.rgb, vec3(u_Gamma)), 1.);
    }
`;
