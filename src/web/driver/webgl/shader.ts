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

            const mat3 yiq2rgb_mat = mat3(
                1.0, 0.956, 0.6210,
                1.0, -0.2720, -0.6474,
                1.0, -1.1060, 1.7046
            );

            vec3 yiq2rgb(vec3 yiq) {
                return yiq * yiq2rgb_mat;
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
            frameCount = 'u_FrameCount',
            height = 'u_Height',
            textureUnit = 'u_Sampler0'
        }
    }

    export namespace ntscPass2 {
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

            const mat3 yiq_mat = mat3(
                0.2989, 0.5870, 0.1140,
                0.5959, -0.2744, -0.3216,
                0.2115, -0.5229, 0.3114
            );

            vec3 rgb2yiq(vec3 col) {
                return col * yiq_mat;
            }

            float luma_filter1 = -0.000012020;
            float luma_filter2 = -0.000022146;
            float luma_filter3 = -0.000013155;
            float luma_filter4 = -0.000012020;
            float luma_filter5 = -0.000049979;
            float luma_filter6 = -0.000113940;
            float luma_filter7 = -0.000122150;
            float luma_filter8 = -0.000005612;
            float luma_filter9 = 0.000170516;
            float luma_filter10 = 0.000237199;
            float luma_filter11 = 0.000169640;
            float luma_filter12 = 0.000285688;
            float luma_filter13 = 0.000984574;
            float luma_filter14 = 0.002018683;
            float luma_filter15 = 0.002002275;
            float luma_filter16 = -0.000909882;
            float luma_filter17 = -0.007049081;
            float luma_filter18 = -0.013222860;
            float luma_filter19 = -0.012606931;
            float luma_filter20 = 0.002460860;
            float luma_filter21 = 0.035868225;
            float luma_filter22 = 0.084016453;
            float luma_filter23 = 0.135563500;
            float luma_filter24 = 0.175261268;
            float luma_filter25 = 0.190176552;

            float chroma_filter1 = -0.000118847;
            float chroma_filter2 = -0.000271306;
            float chroma_filter3 = -0.000502642;
            float chroma_filter4 = -0.000930833;
            float chroma_filter5 = -0.001451013;
            float chroma_filter6 = -0.002064744;
            float chroma_filter7 = -0.002700432;
            float chroma_filter8 = -0.003241276;
            float chroma_filter9 = -0.003524948;
            float chroma_filter10 = -0.003350284;
            float chroma_filter11 = -0.002491729;
            float chroma_filter12 = -0.000721149;
            float chroma_filter13 = 0.002164659;
            float chroma_filter14 = 0.006313635;
            float chroma_filter15 = 0.011789103;
            float chroma_filter16 = 0.018545660;
            float chroma_filter17 = 0.026414396;
            float chroma_filter18 = 0.035100710;
            float chroma_filter19 = 0.044196567;
            float chroma_filter20 = 0.053207202;
            float chroma_filter21 = 0.061590275;
            float chroma_filter22 = 0.068803602;
            float chroma_filter23 = 0.074356193;
            float chroma_filter24 = 0.077856564;
            float chroma_filter25 = 0.079052396;

            #define fetch_offset(offset, one_x) texture2D(u_Sampler0, v_TextureCoordinate + vec2((offset) * (one_x), 0.0)).rgb

            void main() {
                float one_x = 1.0 / 960.0;
                vec3 signal = vec3(0.0);
                float offset;
                vec3 sums;

                ${new Array(24)
                    .fill(0)
                    .map(
                        (_, i) => `
                offset = float(${i});
                sums = fetch_offset(offset - 24., one_x) + fetch_offset(24. - offset, one_x);
                signal += sums * vec3(luma_filter${i + 1}, chroma_filter${i + 1}, chroma_filter${i + 1});
                `
                    )
                    .join('\n')}

                signal += texture2D(u_Sampler0, v_TextureCoordinate).rgb *
                    vec3(luma_filter25, chroma_filter25, chroma_filter25);

                vec3 rgb = yiq2rgb(signal);
                gl_FragColor = vec4(rgb, 1.0);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0'
        }
    }
}
