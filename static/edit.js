(function($) {

var apiEndpoint = '/api/wikis/edit',
	actionsInProgress = 0,
	$progressBar;

function getItemForWiki(wiki) {
	return $('ul.wikis > li')
		.filter( function() { return $( this ).data('wiki') === wiki; } );
}

function actionStarted() {
	// Clear error state
	$( '.error' ).remove();
	if ( actionsInProgress === 0 ) {
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
	}
}

function doUpdate(serverResponse) {
	actionFinished();

	if ( serverResponse.added ) {
		$.each( serverResponse.added, function(i, added) {
			if ( ! getItemForWiki(added).length ) {
				var $li = $( '<li/>' )
					.text( added )
					.data( 'wiki', added )
					.appendTo( $( 'ul.wikis' ) );
				$.proxy( setupDeleteButton, $li[0] )();
			}
		} );
	}

	if ( serverResponse.deleted ) {
		$.each( serverResponse.deleted, function( i, deleted ) {
			getItemForWiki(deleted).remove();
		} );
	}
}

function handleError(err) {
	actionFinished();
	$( '.error' ).remove();

	$( '<div/>' ).addClass( 'error' )
		.text( 'An error occurred' )
		.appendTo( $( '.container' ) );
}

function setupDeleteButton() {
	var $li = $(this),
		button = new OO.ui.ButtonWidget( {
			'flags': 'destructive',
			'framed' : false,
			'label': 'Remove',
			'icon': 'remove'
		} );

	button.on('click', function( e ) {
		actionStarted();
		$.post( apiEndpoint, { 'delete': $li.data( 'wiki' ) } )
			.done( doUpdate ).error( handleError );
	});

	button.$element.appendTo( $li );
}

$(function() {
	var textbox = new OO.ui.TextInputWidget( {
			'placeholder': 'my-test-wiki',
			'validate' : /^[a-z][a-z0-9_-]{0,15}$/
		} ),
		createButton = new OO.ui.ButtonWidget( {
			'label': 'Add new wiki',
			'flags' : ['constructive', 'primary'],
			'disabled' : true
		} ),
		$createBox = $( '.add-form' )
			.append( textbox.$element )
			.append( createButton.$element );

	textbox.on('change', function(e) {
		textbox.isValid().then( function( isValid ) {
			createButton.setDisabled( !isValid );
		} );
	});

	createButton.on('click', function(e) {
		var newWiki = textbox.getValue();
		textbox.setValue( '' );
		actionStarted();
		$.post( apiEndpoint, { 'add': newWiki } )
			.done( doUpdate ).error( handleError );
	} );


	$( 'ul.wikis li' ).each( setupDeleteButton );
});
})(jQuery);
