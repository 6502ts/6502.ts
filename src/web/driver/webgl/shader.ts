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

    export namespace ntscPass1 {
        export const source = `
            precision mediump float;

            #define PI 3.14159265

            #define CHROMA_MOD_FREQ (PI / 3.0)

            #define SATURATION 1.0
            #define BRIGHTNESS 1.0
            #define ARTIFACTING 1.0
            #define FRINGING 1.0

            uniform sampler2D u_Sampler0;

            varying vec2 v_TextureCoordinate;

            mat3 mix_mat = mat3(
                BRIGHTNESS, FRINGING, FRINGING,
                ARTIFACTING, 2.0 * SATURATION, 0.0,
                ARTIFACTING, 0.0, 2.0 * SATURATION
            );

            const mat3 yiq_mat = mat3(
                0.2989, 0.5870, 0.1140,
                0.5959, -0.2744, -0.3216,
                0.2115, -0.5229, 0.3114
            );

            vec3 rgb2yiq(vec3 col) {
                return col * yiq_mat;
            }

            void main() {
                vec3 col = texture2D(u_Sampler0, v_TextureCoordinate).rgb;
                vec3 yiq = rgb2yiq(col);

                float mod_phase = v_TextureCoordinate.x * 960.0 * CHROMA_MOD_FREQ;

                float i_mod = cos(mod_phase);
                float q_mod = sin(mod_phase);

                yiq.yz *= vec2(i_mod, q_mod); // Modulate.
                yiq *= mix_mat; // Cross-talk.
                yiq.yz *= vec2(i_mod, q_mod); // Demodulate.

                gl_FragColor = vec4(yiq, 1.0);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0'
        }
    }

    export namespace ntscPass2 {
        const lumaFilter = [
            0.00001202,
            0.000022146,
            0.000013155,
            0.00001202,
            0.000049979,
            0.00011394,
            0.00012215,
            0.000005612,
            0.000170516,
            0.000237199,
            0.00016964,
            0.000285688,
            0.000984574,
            0.002018683,
            0.002002275,
            -0.000909882,
            -0.007049081,
            -0.01322286,
            -0.012606931,
            0.00246086,
            0.035868225,
            0.084016453,
            0.1355635,
            0.175261268,
            0.190176552
        ];

        const chromaFilter = [
            0.000118847,
            0.000271306,
            0.000502642,
            0.000930833,
            0.001451013,
            0.002064744,
            0.002700432,
            0.003241276,
            0.003524948,
            -0.003350284,
            -0.002491729,
            -0.000721149,
            0.002164659,
            0.006313635,
            0.011789103,
            0.01854566,
            0.026414396,
            0.03510071,
            0.044196567,
            0.053207202,
            0.061590275,
            0.068803602,
            0.074356193,
            0.077856564,
            0.079052396
        ];

        export const source = `
            precision mediump float;

            uniform sampler2D u_Sampler0;
            varying vec2 v_TextureCoordinate;

            const mat3 yiq2rgb_mat = mat3(
                1.0, 0.956, 0.6210,
                1.0, -0.2720, -0.6474,
                1.0, -1.1060, 1.7046
            );

            vec3 yiq2rgb(vec3 yiq) {
                return yiq * yiq2rgb_mat;
            }

            #define fetch_offset(offset) texture2D(u_Sampler0, v_TextureCoordinate + vec2(float(offset) / 960.0, 0.0)).rgb

            void main() {
                float one_x = 1.0 / 960.0;
                vec3 signal = vec3(0.0);

                ${new Array(24)
                    .fill(0)
                    .map(
                        (_, i) => `
                signal +=
                    (fetch_offset(${i - 24}) + fetch_offset(${24 - i})) *
                        vec3(${lumaFilter[i]}, ${chromaFilter[i]}, ${chromaFilter[i]});
                `
                    )
                    .join('\n')}

                signal += texture2D(u_Sampler0, v_TextureCoordinate).rgb *
                    vec3(${lumaFilter[24]}, ${chromaFilter[24]}, ${chromaFilter[24]});

                vec3 rgb = yiq2rgb(signal);
                gl_FragColor = vec4(rgb, 1.0);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0'
        }
    }
}
