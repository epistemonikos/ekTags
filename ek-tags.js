
/**
 * @ngdoc directive
 * @name ekTags.directive:ekDocumentTags
 *
 * @description
 * ekDocumentTags is an Epistemonikos-taylored Angular directive that provides a tag box widget
 * providing retrieval, addition and deletion operations for document tags. It relies on an API
 * which actually stores the tag information.
 * 
 *
 * @param {string=} identifier Epistemonikos document ID.
 * @param {string=} kind Kind of tags. It can be any class supported by the backend. Currently the only supported one is 'country'.
 * @param {string=} src URL where the RESTful tag retrieval and store service is hosted.
 * @requires ngTagsInput http://mbenford.github.io/ngTagsInput/
 *
 */

(function() {
'use strict';

var tagsModule = angular.module('ekTags', ['ngTagsInput']);

    tagsModule.directive("ekDocumentTags", ['$http', function($http) {

    var httpConfig = {
	responseType: 'application/json',
	headers: { 'Content-Type': 'application/json' }
    };

    return {
	restrict: 'E',
	scope: {
	    'identifier':'@',
	    'kind':'@',
	    'src':'@',
	    'readonly':'@',
	    'confirmCallback':'&onConfirm',
            'customEditableClass':'@',
            'customUneditableClass':'@',
	    'confirmButtonClass':'@'
	},
	link: function(scope) {

	    httpConfig.url = scope.src + '/metadata/' + scope.identifier + '/' + scope.kind + '/';

	    var getTags = function() {

		httpConfig.method = 'GET';
		httpConfig.data = 'null'

		$http(httpConfig)
		    .success(function(data) {
			scope.tags = data;
			initConfirmationStatus();
		    })
		    .error(function(data) {
			console.log("Error while getting tags. Received data: " + data);
		    });

	    }

	    scope.addTag = function(addedTag) {

		httpConfig.method = 'PUT';
		httpConfig.data = JSON.stringify(addedTag);

		$http(httpConfig)
		    .error(function(data) {
			console.log("Error while adding tag. Received data: " + data);
		    });
	    };

	    scope.removeTag = function(removedTag) {

		httpConfig.method = 'DELETE';
		httpConfig.data = JSON.stringify(removedTag);

		$http(httpConfig)
		    .error(function(data) {
			console.log("Error while removing tag. Received data: " + data);
		    });
	    }

	    var initEditableStatus = function () {

		scope.allowTagEdition = false || !(scope.readonly == "true");

	    }

	    var updateTagsEditableStatus = function(confirmationStatus) {

		if ( scope.readonly == "true" ) {
		    return;
		}
		else {
		    scope.allowTagEdition = !confirmationStatus;
		    scope.buttonLegend = (confirmationStatus)?"Reopen":"Confirm";
		}

	    };

	    var initConfirmationStatus = function() {

		httpConfig.method = 'POST';
		httpConfig.data = JSON.stringify({ 'action': 'inform', 'piece': 'confirmationStatus' });

		$http(httpConfig)
		    .success(function(data) {
			scope.confirmed = JSON.parse(data);
			updateTagsEditableStatus(scope.confirmed);
			scope.disableConfirmButton = false;
		    })
		    .error(function() {
			console.log("Error while retrieving confirmation status.");
		    });
	    };

	    var setTagsConfirmation = function(confirm) {

		if ( confirm == scope.confirmed) {
		    console.warn("Asked to confirm already confirmed tags.");
		    return;
		}

		httpConfig.method = 'POST';
		var action = (confirm)?'confirm':'reopen';
		httpConfig.data = JSON.stringify({ 'action': action });

		$http(httpConfig)
		    .success(function() {
			scope.confirmed = confirm;
			updateTagsEditableStatus(scope.confirmed);
		    })
		    .error(function() {
			console.log("Error while performing tag " + action + " action.");
		    });
	    };

	    scope.buttonHandler = function () {

		if ( !scope.confirmed ) {
		    console.log("Marking tags as confirmed...");
		    setTagsConfirmation(true);
		    console.log("Done.");
		    scope.confirmCallback()(scope.tags);
		} else {
		    setTagsConfirmation(false);
		}

	    };

            initEditableStatus();
	    scope.disableConfirmButton = true;
	    getTags();

	},
	template: '<tags-input custom-editable-class="{{ customEditableClass }}" custom-uneditable-class="{{ customUneditableClass }}" editable="allowTagEdition" ng-model=tags on-tag-added="addTag($tag)" on-tag-removed="removeTag($tag)"></tags-input><button class="{{ confirmButtonClass }}" ng-disabled="disableConfirmButton" ng-click="buttonHandler()" ng-hide="readonly">{{ buttonLegend }}</button>'
    };

}]);

}());