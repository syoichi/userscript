/* jshint node: true, indent: 2 */
'use strict';

module.exports = function createGruntConfig(grunt) {
  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'src/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', 'jshint');
};
