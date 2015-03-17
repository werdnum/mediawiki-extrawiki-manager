module.exports = function(grunt) {

	grunt.initConfig({
		less: {
			compile: {
				files: {
					'static/styles.css' : 'less/main.less'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('default', ['less']);
};
