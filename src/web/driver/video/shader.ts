/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import { Capabilities } from './Capabilities';

function precisionFsh(capabilities: Capabilities): string {
    return `precision ${capabilities.highpInVsh ? 'highp' : 'mediump'} float;`;
}

function precisionVsh(capabilities: Capabilities): string {
    return `precision ${capabilities.highpInVsh ? 'highp' : 'mediump'} float;`;
}

export namespace vsh {
    export namespace plain {
        export const source = (capabilities: Capabilities) => `
            ${precisionVsh(capabilities)}

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
            textureCoordinate = 'a_TextureCoordinate',
        }
    }
}

export namespace fsh {
    export namespace blit {
        export const source = (capabilities: Capabilities) => `
            ${precisionFsh(capabilities)}

            varying vec2 v_TextureCoordinate;

            uniform sampler2D u_Sampler0;

            void main() {
                gl_FragColor = vec4(texture2D(u_Sampler0, v_TextureCoordinate).rgb, 1.0);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0',
        }
    }

    export namespace blitWithGamma {
        export const source = (capabilities: Capabilities) => `
            ${precisionFsh(capabilities)}

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
            gamma = 'u_Gamma',
        }
    }

    export namespace phosphor {
        export const source = (capabilities: Capabilities) => `
            ${precisionFsh(capabilities)}

            varying vec2 v_TextureCoordinate;

            uniform float u_PhosphorLevel;
            uniform sampler2D u_Sampler_NewImage;
            uniform sampler2D u_Sampler_PreviousImage;

            float applyPhosphor(float new, float previous) {
                float decayed = previous * u_PhosphorLevel;
                decayed = step(0.5, (previous - decayed) * 255.0) * decayed;

                return max(new, decayed);
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
            textureUnitPrevious = 'u_Sampler_PreviousImage',
        }
    }

    export namespace ntscPass1 {
        export const source = (capabilities: Capabilities) => `
            ${precisionFsh(capabilities)}

            #define PI 3.14159265

            #define CHROMA_MOD_FREQ (PI / 3.0)

            #define SATURATION 1.0
            #define BRIGHTNESS 1.0

            uniform sampler2D u_Sampler0;
            uniform float u_Fringing;
            uniform float u_Artifacting;

            varying vec2 v_TextureCoordinate;

            const mat3 yiq_mat = mat3(
                0.2989, 0.5870, 0.1140,
                0.5959, -0.2744, -0.3216,
                0.2115, -0.5229, 0.3114
            );

            vec3 rgb2yiq(vec3 col) {
                return col * yiq_mat;
            }

            ${
                capabilities.floatTextures || capabilities.halfFloatTextures
                    ? ''
                    : `
                vec4 pack(vec3 yiq) {
                    yiq += 1.2;
                    yiq /= 3.4;

                    int y_byte = int(yiq.r * 1024.0);
                    int i_byte = int(yiq.g * 1024.0);
                    int q_byte = int(yiq.b * 1024.0);

                    int y_high = (y_byte / 4) * 4;
                    int i_high = (i_byte / 4) * 4;
                    int q_high = (q_byte / 4) * 4;
                    int alpha = (q_byte - q_high) * 16 + (i_byte - i_high) * 4 + (y_byte - y_high);

                    return vec4(
                        float(y_high / 4) / 255.0,
                        float(i_high / 4) / 255.0,
                        float(q_high / 4) / 255.0,
                        float(alpha) / 255.0
                    );
                }
                `
            }

            void main() {
                mat3 mix_mat = mat3(
                    BRIGHTNESS, u_Fringing, u_Fringing,
                    u_Artifacting, 2.0 * SATURATION, 0.0,
                    u_Artifacting, 0.0, 2.0 * SATURATION
                );

                vec3 col = texture2D(u_Sampler0, v_TextureCoordinate).rgb;
                vec3 yiq = rgb2yiq(col);

                float mod_phase = v_TextureCoordinate.x * 960.0 * CHROMA_MOD_FREQ;

                float i_mod = cos(mod_phase);
                float q_mod = sin(mod_phase);

                yiq.yz *= vec2(i_mod, q_mod); // Modulate.
                yiq *= mix_mat; // Cross-talk.
                yiq.yz *= vec2(i_mod, q_mod); // Demodulate.

                gl_FragColor = ${
                    capabilities.floatTextures || capabilities.halfFloatTextures ? 'vec4(yiq, 1.0)' : 'pack(yiq)'
                };
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0',
            artifacting = 'u_Artifacting',
            fringing = 'u_Fringing',
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
            0.190176552,
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
            0.079052396,
        ];

        function maybeUnpack(capabilities: Capabilities, expr: string): string {
            return capabilities.floatTextures || capabilities.halfFloatTextures ? `${expr}.rgb` : `unpack(${expr})`;
        }

        export const source = (capabilities: Capabilities) => `
            ${precisionFsh(capabilities)}

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

            ${
                capabilities.floatTextures || capabilities.halfFloatTextures
                    ? ''
                    : `
                vec3 unpack(vec4 yiqPacked) {
                    int y_high = int(yiqPacked.r * 1024.0);
                    int i_high = int(yiqPacked.g * 1024.0);
                    int q_high = int(yiqPacked.b * 1024.0);
                    int alpha = int(yiqPacked.a * 256.0);

                    int y_low = alpha - (alpha / 4) * 4;
                    int i_low = alpha - y_low - (alpha / 16) * 16;
                    int q_low = alpha - i_low - y_low;

                    return vec3(
                        float(y_high + y_low) / 1023.0,
                        float(i_high + i_low) / 1023.0,
                        float(q_high + q_low) / 1023.0
                    ) * 3.4 - 1.2;
                }
                `
            }

            vec3 fetch_offset(int offset) {
                float x = (floor(v_TextureCoordinate.x * 960.0) + 0.5 + float(offset)) / 960.0;

                return step(0.0, x) * step(-1.0, -x) *
                    ${maybeUnpack(capabilities, 'texture2D(u_Sampler0, vec2(x, v_TextureCoordinate.y))')};
            }

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

                signal += ${maybeUnpack(capabilities, 'texture2D(u_Sampler0, v_TextureCoordinate)')} *
                    vec3(${lumaFilter[24]}, ${chromaFilter[24]}, ${chromaFilter[24]});

                vec3 rgb = yiq2rgb(signal);
                gl_FragColor = vec4(rgb, 1.0);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0',
        }
    }

    export namespace scanlines {
        export const source = (capabilities: Capabilities) => `
            ${precisionFsh(capabilities)}

            uniform sampler2D u_Sampler0;
            uniform float u_Level;
            uniform float u_Height;

            varying vec2 v_TextureCoordinate;

            void main() {
                vec3 texel = texture2D(u_Sampler0, v_TextureCoordinate).rgb;

                gl_FragColor = vec4(
                    (step(1.0, mod(v_TextureCoordinate.y * u_Height, 2.0)) * (1.0 - u_Level) + u_Level) * texel, 1.0);
            }
        `;

        export const enum uniform {
            textureUnit = 'u_Sampler0',
            level = 'u_Level',
            height = 'u_Height',
        }
    }
}
