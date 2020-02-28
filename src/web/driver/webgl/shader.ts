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

    export namespace phosphor {
        export const source = `
            precision mediump float;

            varying vec2 v_TextureCoordinate;

            uniform float u_PhosphorLevel;
            uniform sampler2D u_Sampler_NewImage;
            uniform sampler2D u_Sampler_PreviousImage;

            float applyPhosphor(float new, float previous) {
                float decayed = previous * u_PhosphorLevel;

                return new > decayed ? new : decayed;
            }

            void main() {
                vec4 new = texture2D(u_Sampler_NewImage, v_TextureCoordinate);
                vec4 previous = texture2D(u_Sampler_PreviousImage, v_TextureCoordinate);

                gl_FragColor = vec4(
                    applyPhosphor(new.r, previous.r),
                    applyPhosphor(new.g, previous.g),
                    applyPhosphor(new.b, previous.b),
                    1.0
                );
            }
        `;

        export const enum uniform {
            level = 'u_PhosphorLevel',
            textureUnitNew = 'u_Sampler_NewImage',
            textureUnitPrevious = 'u_Sampler_PreviousImage'
        }
    }
}
