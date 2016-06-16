function postProcessingManager() {

    this.initBuffers = function() {

        for (var i = 0; i < this.textures.length; i++) {
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i].texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                gl.drawingBufferWidth / Math.pow(2, i % 4), gl.drawingBufferHeight / Math.pow(2, i % 4), 0, gl.RGBA, gl.FLOAT, null);
        }

        this.width = gl.drawingBufferWidth;
        this.height = gl.drawingBufferHeight;
    };

    this.init = function() {
        gl.getExtension('OES_texture_float_linear');
        
        this.framebuffers = [
            gl.createFramebuffer(),
            gl.createFramebuffer()
        ];

        this.textures = [
            new texture().init(),
            new texture().init(),
            new texture().init(),
            new texture().init(),
            new texture().init(),
            new texture().init(),
            new texture().init(),
            new texture().init()
        ];

        this.initBuffers();

        return this;
    };

    this.bloom = function(width, height, screenQuad, textures) {
        if (this.width != width || this.height != height) {
            this.initBuffers();
        }

        var horizontal = true;
        var tex;
        gl.useProgram(screenQuad.shaders[1].program);

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 2; j++) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[horizontal ? 1 : 0]);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[horizontal ? i + 4 : i].texture, 0);
                gl.uniform1i(gl.getUniformLocation(screenQuad.shaders[1].program, "horizontal"), horizontal);
                gl.uniform1f(gl.getUniformLocation(screenQuad.shaders[1].program, "width"),  width / Math.pow(2, i));
                gl.uniform1f(gl.getUniformLocation(screenQuad.shaders[1].program, "height"), height / Math.pow(2, i));

                tex = j == 0 ? textures[1] : this.textures[i + 4];
                tex.apply(0);
                gl.uniform1i(gl.getUniformLocation(screenQuad.shaders[1].program, "image"), 0);
                gl.viewport(0, 0, width / Math.pow(2, i), height / Math.pow(2, i));
                screenQuad.draw(1);
                horizontal = !horizontal;
            }
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(screenQuad.shaders[2].program);
        textures[0].apply(0);
        gl.uniform1i(gl.getUniformLocation(screenQuad.shaders[2].program, "scene"), 0);
        for (var i = 0; i < 4; i++) {
            this.textures[i].apply(i + 1);
            gl.uniform1i(gl.getUniformLocation(screenQuad.shaders[2].program, "bloom" + i), i + 1);
        }
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        screenQuad.draw(2);
    };

    return this;
}