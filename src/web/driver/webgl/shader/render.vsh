attribute vec2 a_VertexPosition;
attribute vec2 a_TextureCoordinate;

varying vec2 v_TextureCoordinate;

void main() {
    v_TextureCoordinate = a_TextureCoordinate;
    gl_Position = vec4(a_VertexPosition, 0, 1);
}
