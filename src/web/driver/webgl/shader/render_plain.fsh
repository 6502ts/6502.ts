precision mediump float;

varying vec2 v_TextureCoordinate;

uniform sampler2D u_Sampler0;
uniform float u_Gamma;

void main() {
    vec4 texel = texture2D(u_Sampler0, v_TextureCoordinate);

    gl_FragColor = vec4(pow(texel.rgb, vec3(u_Gamma)), 1.);
}
