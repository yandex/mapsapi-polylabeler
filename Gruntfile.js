module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            build: {
                src: [
                    'src/*.js'
                ],
                dest: 'build/util.polylabel.js'
            }
        },
        uglify: {
            build: {
                src: 'build/util.polylabel.js',
                dest: 'build/util.polylabel.min.js'
            }
        },
        watch: {
            files: 'src/*.js',
            tasks: 'default'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'uglify', 'watch']);
};
