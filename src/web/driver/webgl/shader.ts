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

            #define CHROMA_MOD_FREQ (4.0 * PI / 15.0)

            #define SATURATION 1.0
            #define BRIGHTNESS 1.0
            #define ARTIFACTING 1.0
            #define FRINGING 1.0

            uniform int u_FrameCount;
            uniform int u_Height;
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

                float chroma_phase = PI * (mod(v_TextureCoordinate.y * float(u_Height), 2.0) + float(u_FrameCount));
                float mod_phase = chroma_phase + v_TextureCoordinate.x * 1280.0 * CHROMA_MOD_FREQ;

                float i_mod = cos(mod_phase);
                float q_mod = sin(mod_phase);

                yiq.yz *= vec2(i_mod, q_mod); // Modulate.
                yiq *= mix_mat; // Cross-talk.
                yiq.yz *= vec2(i_mod, q_mod); // Demodulate.

                gl_FragColor = vec4(yiq2rgb(yiq), 1.0);
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

            float luma_filter1 = -0.000174844;
            float luma_filter2 = -0.000205844;
            float luma_filter3 = -0.000149453;
            float luma_filter4 = -0.000051693;
            float luma_filter5 = 0.000000000;
            float luma_filter6 = -0.000066171;
            float luma_filter7 = -0.000245058;
            float luma_filter8 = -0.000432928;
            float luma_filter9 = -0.000472644;
            float luma_filter10 = -0.000252236;
            float luma_filter11 = 0.000198929;
            float luma_filter12 = 0.000687058;
            float luma_filter13 = 0.000944112;
            float luma_filter14 = 0.000803467;
            float luma_filter15 = 0.000363199;
            float luma_filter16 = 0.000013422;
            float luma_filter17 = 0.000253402;
            float luma_filter18 = 0.001339461;
            float luma_filter19 = 0.002932972;
            float luma_filter20 = 0.003983485;
            float luma_filter21 = 0.00302668;
            float luma_filter22 = -0.001102056;
            float luma_filter23 = -0.008373026;
            float luma_filter24 = -0.016897700;
            float luma_filter25 = -0.022914480;
            float luma_filter26 = -0.021642347;
            float luma_filter27 = -0.008863273;
            float luma_filter28 = 0.017271957;
            float luma_filter29 = 0.054921920;
            float luma_filter30 = 0.098342579;
            float luma_filter31 = 0.139044281;
            float luma_filter32 = 0.168055832;
            float luma_filter33 = 0.178571429;

            float chroma_filter1 = 0.001384762;
            float chroma_filter2 = 0.001678312;
            float chroma_filter3 = 0.002021715;
            float chroma_filter4 = 0.002420562;
            float chroma_filter5 = 0.002880460;
            float chroma_filter6 = 0.003406879;
            float chroma_filter7 = 0.004004985;
            float chroma_filter8 = 0.004679445;
            float chroma_filter9 = 0.005434218;
            float chroma_filter10 = 0.006272332;
            float chroma_filter11 = 0.007195654;
            float chroma_filter12 = 0.008204665;
            float chroma_filter13 = 0.009298238;
            float chroma_filter14 = 0.010473450;
            float chroma_filter15 = 0.011725413;
            float chroma_filter16 = 0.013047155;
            float chroma_filter17 = 0.014429548;
            float chroma_filter18 = 0.015861306;
            float chroma_filter19 = 0.017329037;
            float chroma_filter20 = 0.018817382;
            float chroma_filter21 = 0.020309220;
            float chroma_filter22 = 0.021785952;
            float chroma_filter23 = 0.023227857;
            float chroma_filter24 = 0.024614500;
            float chroma_filter25 = 0.025925203;
            float chroma_filter26 = 0.027139546;
            float chroma_filter27 = 0.028237893;
            float chroma_filter28 = 0.029201910;
            float chroma_filter29 = 0.030015081;
            float chroma_filter30 = 0.030663170;
            float chroma_filter31 = 0.031134640;
            float chroma_filter32 = 0.031420995;
            float chroma_filter33 = 0.031517031;

            #define fetch_offset(offset, one_x) rgb2yiq(texture2D(u_Sampler0, v_TextureCoordinate + vec2((offset) * (one_x), 0.0)).rgb)

            void main() {
                float one_x = 1.0 / 1280.0;
                vec3 signal = vec3(0.0);
                float offset;
                vec3 sums;

                ${new Array(32)
                    .fill(0)
                    .map(
                        (_, i) => `
                offset = float(${i});
                sums = fetch_offset(offset - 32., one_x) + fetch_offset(32. - offset, one_x);
                signal += sums * vec3(luma_filter${i + 1}, chroma_filter${i + 1}, chroma_filter${i + 1});
                `
                    )
                    .join('\n')}

                signal += texture2D(u_Sampler0, v_TextureCoordinate).rgb *
                    vec3(luma_filter33, chroma_filter33, chroma_filter33);

                vec3 rgb = yiq2rgb(signal);
                gl_FragColor = vec4(pow(rgb, vec3(2.5 / 2.0)), 1.0);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0'
        }
    }
}
