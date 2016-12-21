var rest = require('restler');
var moment = require('moment');
var _ = require('lodash');

// Instantiate with a credentials object that is persistant
function Nodio (credentials) {

	/**
	 * The nodio object to be returned from the module
	 *
	 * @type    object
	 */
	var nodio = {
		VERSION: '0.0.2'
	};

	if (!_.has(credentials, 'app_id')) {
		throw new Error('You must specify an app_id');
	}
	if (!_.has(credentials, 'app_token')) {
		throw new Error('You must specify an app_token');
	}
	if (!_.has(credentials, 'client_id')) {
		throw new Error('You must specify a client_id');
	}
	if (!_.has(credentials, 'client_secret')) {
		throw new Error('You must specify a client_secret');
	}

	/**
	 * Token that Podio returns to allow the interacting with an app
	 *
	 * @type    object
	 */
	var access_token;

	/**
	 * Number of milliseconds in which the access token expires
	 *
	 * @type    integer
	 */
	var expires_in;

	/**
	 * The time the the access token was authenticated
	 *
	 * @type    object
	 */
	var authentication_time;


	/**
	 * Validates the provided credentials against Podio's OAUTH api
	 *
	 * @param   function    callback        Run on completion
	 *
	 * @return  void
	 */
	function validateCredentials (callback) {
		//We're using the app authentication flow
		credentials.grant_type = "app";


		if (!access_token || expires_in <= ((moment() - authentication_time) / 1000)) {
			//OAuth to get our Podio access token
			rest.post('https://podio.com/oauth/token', {
				data: credentials
			}).on('complete', function (data, response) {
				if (data.access_token){
					// (Re)set current access details
					access_token = data.access_token;
					expires_in = data.expires_in;
					authentication_time = moment();

					callback();
				}
				else {
					// Return an informative error object
					callback({statusCode: response.statusCode, responseRaw: response.rawEncoded});
				}
			});
		}
		else {
			callback();
		}
	}

	/**
	 * Add an item to the Podio app
	 *
	 * @param   type        item_fields     Must contain valid fields for the item
	 * @param   function    callback        Function to run on completion
	 *
	 * return   void
	 */
	nodio.addNewItem = function(item_fields, callback) {

		//Prepare item field structure
		var item = {
			fields: item_fields
		};

		// Validate credentials
		validateCredentials(function (err) {
			if (!err){
				// Let's push the item to Podio passing the access token as a header
				rest.postJson('https://api.podio.com/item/app/' + credentials.app_id + '/', item , {
					headers: {'Authorization': 'OAuth2 ' + access_token}
				}).on('complete', function(data, response) {
					// If everything's ok
					if(response.statusCode === 200){
						callback(null, data);
					}
					else {
						// Return an informative error object
						callback({statusCode: response.statusCode, responseRaw: response.rawEncoded});
					}
				});
			}
			else{
				callback(err);
			}
		});
	};


  /**
   * Get an item based on its item ID
   *
   * @param   integer     item_id     ID of item to retrieve (must be within the specified Podio app)
   * @param   function    callback    Run on completion
   *
   * @return  void
   */
  nodio.getItem = function (item_id, callback) {
    validateCredentials(function (err) {
      if (!err) {
        // Make a get request for the item, passing the access token as a header
        rest.get('https://api.podio.com/item/' + item_id, {
          headers: {'Authorization': 'OAuth2 ' + access_token}
        })
          .on('complete', function(data, response) {
            // If everything's ok
            if (response.statusCode === 200) {
              callback(null, data);
            }
            else {
              // Return an informative error object
              callback({statusCode: response.statusCode, responseRaw: response.rawEncoded});
            }
          });
      }
      else {
        callback(err);
      }
    });
  };


	/**
	 * Get an item based on its app item ID
	 *
	 * @param   integer     app_item_id App item ID of item to retrieve (must be within the specified Podio app)
	 * @param   function    callback    Run on completion
	 *
	 * @return  void
	 */
	nodio.getItemByAppItemId = function (app_item_id, callback) {
		validateCredentials(function (err) {
			if (!err) {
				// Make a get request for the item, passing the access token as a header
				rest.get('https://api.podio.com/app/' + credentials.app_id + '/item/' + app_item_id, {
					headers: {'Authorization': 'OAuth2 ' + access_token}
				})
					.on('complete', function(data, response) {
						// If everything's ok
						if (response.statusCode === 200) {
							callback(null, data);
						}
						else {
							// Return an informative error object
							callback({statusCode: response.statusCode, responseRaw: response.rawEncoded});
						}
					});
			}
			else {
				callback(err);
			}
		});
	};


  /**
   * Filter items from the app
   *
   * @param   object      filter_options   Options object for the filter
   * @param   function    callback         Run on completion
   *
   * @return  void
   */
  nodio.filterItems = function (filter_options, callback) {
    validateCredentials(function (err) {
      if (!err) {
        // Make a get request for the item, passing the access token as a header
        rest.postJson('https://api.podio.com/item/app/' + credentials.app_id + '/filter/', filter_options, {
          headers: {'Authorization': 'OAuth2 ' + access_token}
        })
          .on('complete', function(data, response) {
            // If everything's ok
            if (response.statusCode === 200) {
              callback(null, data);
            }
            else {
              // Return an informative error object
              callback({statusCode: response.statusCode, responseRaw: response.rawEncoded});
            }
          });
      }
      else {
        callback(err);
      }
    });
  };


   /**
   * Update an item in the Podio app
   *
   * @param   integer     item_id         The Item ID to update
   * @param   type        item_fields     Must contain valid fields for the item
   * @param   function    callback        Function to run on completion
   *
   * return   void
   */
  nodio.updateItem = function(item_id, item_fields, callback) {

    var item = {
      fields: item_fields
    };

    validateCredentials(function (err) {
      if (!err){
        rest.putJson('https://api.podio.com/item/' + item_id, item, {
          headers: {'Authorization': 'OAuth2 ' + access_token}
        }).on('complete', function(data, response) {
          if(response.statusCode === 200){
            callback(null, data);
          }
          else {
            callback({statusCode: response.statusCode, responseRaw: response.rawEncoded});
          }
        });
      }
      else{
        callback(err);
      }
    });
  };

	return nodio;
}


/**
 * Handle Nodio being instantiated in the old way.
 *
 */
Nodio.addNewItem = function () {
	console.log('Nodio must be instantiated with credentials in the form: require("nodio")(credentials);');
};
Nodio.getItem = function () {
	console.log('Nodio must be instantiated with credentials in the form: require("nodio")(credentials);');
};

// Finally, export `Nodio` to the world.
module.exports = Nodio;