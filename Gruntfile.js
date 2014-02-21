/* jshint node: true, indent: 2 */
'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'src/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  // load tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // alias
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('travis', 'jshint');
  grunt.registerTask('default', 'lint');
};
