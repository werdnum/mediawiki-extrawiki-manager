(function($) {
var updateEndpoint = '/api/wikis/update',
	actionsInProgress = 0,
	updateWidget;

function actionStarted() {
	// Clear error state
	$( '.error' ).remove();
	if ( actionsInProgress === 0 ) {
		updateWidget.setDisabled(true);
		$progressBar = (new OO.ui.ProgressBarWidget( { 'progress': false } ) ).$element;
		$progressBar.appendTo( $( '.container' ) );
	}
	actionsInProgress++;
}

function actionFinished() {
	actionsInProgress--;

	if ( actionsInProgress === 0 ) {
		$progressBar.remove();
		$progressBar = undefined;
		updateWidget.setDisabled(false);
	}
}

$(function() {
	updateWidget = new OO.ui.ButtonWidget({
		label: 'Update',
		flags: ['constructive', 'primary']
	});

	$('.update-button').replaceWith(updateWidget.$element);

	updateWidget.on('click', function(e) {
		actionStarted();
		$.post( updateEndpoint, {} )
			.then( function(data) {
				if ( data.updated ) {
					$( 'tt.version' ).text( data.version );
					actionFinished();
				} else {
					return $.Deferred().reject();
				}
			} )
			.fail( function() {
				$( '<div/>' ).addClass( 'error' )
					.text( 'An error occurred' )
					.appendTo( $( '.container' ) );
				actionFinished();
			} );
	});
});
})(jQuery);
