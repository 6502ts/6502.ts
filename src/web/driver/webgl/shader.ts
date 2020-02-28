export namespace vsh {
    export namespace plain {
        export const source = `
            attribute vec2 a_VertexPosition;
            attribute vec2 a_TextureCoordinate;

            varying vec2 v_TextureCoordinate;

            void main() {
                v_TextureCoordinate = a_TextureCoordinate;
                gl_Position = vec4(a_VertexPosition, 0, 1);
            }
        `;

        export const enum attribute {
            vertexPosition = 'a_VertexPosition',
            textureCoordinate = 'a_TextureCoordinate'
        }
    }
}

export namespace fsh {
    export namespace blitWithGamma {
        export const source = `
            precision mediump float;

            varying vec2 v_TextureCoordinate;

            uniform sampler2D u_Sampler0;
            uniform float u_Gamma;

            void main() {
                vec4 texel = texture2D(u_Sampler0, v_TextureCoordinate);

                gl_FragColor = vec4(pow(texel.rgb, vec3(u_Gamma)), 1.);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0',
            gamma = 'u_Gamma'
        }
    }
}
