(function() {
	angular.module('myBin', ['ui.router', 'ngStorage'])
	.config(['$provide', '$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function ($provide, $stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
		$provide.decorator('$sniffer', function($delegate) {
			$delegate.history = false;
			return $delegate;
		});
		$locationProvider.html5Mode(false);
		$urlRouterProvider.otherwise('/');
		$stateProvider
		.state('index', { url : '/', templateUrl: 'partials/home.html'})
		.state('popular', { url : '/populer-arsivler', templateUrl: 'partials/popular.html'})
		.state('archivers', { url : '/son-arsivciler', templateUrl: 'partials/archivers.html'})
		.state('archives', { url : '/son-arsivler', templateUrl: 'partials/archives.html'})
		.state('user', { url : '/uye', templateUrl: 'partials/user/layout.html', controller : 'SiteUserController'})
		.state('user.linkbank', { url : '/link-bankam', templateUrl: 'partials/user/linkbank.html' })
		.state('user.account', { url : '/hesap-bilgilerim', templateUrl: 'partials/user/account.html' })
		.state('user.logout', { url : '/cikis', templateUrl: 'partials/user/logout.html'})
		;

		$httpProvider.interceptors.push(['$q', '$location', '$localStorage', function($q, $location, $localStorage) {
			return {
				'request': function (config) { config.headers = config.headers || {}; if ($localStorage.token) { config.headers.Authorization = 'Bearer ' + $localStorage.token; } return config; },
				'responseError': function(response) { if(response.status === 401 || response.status === 403) { $location.path('/signin'); } return $q.reject(response); }
			};
		}]);

	}])
	.controller('SiteUserController', ['$rootScope', '$scope', '$location', '$localStorage', 'SiteUserService', '$state', '$timeout', function($rootScope, $scope, $location, $localStorage, SiteUserService,$state, $timeout) {
		$scope.token = $localStorage.token;
		if (!$rootScope.logged_user) {$state.transitionTo('index'); }
		if($state.current.name == 'profile') { SiteUserService.profile($state.params.username ,function(response) { console.log(response.success); $scope.user = response.data; }, function() { console.log('Failed to fetch details'); }) }
		if($state.current.name == 'user.logout') { if (!$scope.token) $state.go('user.home'); };
		$scope.signin 		= function() { var formData = { email: $scope.email, password: $scope.password }; SiteUserService.signin(formData, function(res) { if (res.warning) $scope.result = {warning : true, message : res.warning }; else if (res.danger) $scope.result = {danger : true, message : res.danger }; else{ $scope.result = {success : true, message : res.success }; $localStorage.token = res.token; $timeout(function(){ $state.go('index'); }, 2000); } }, function() { $rootScope.error = 'Failed to signin'; }) };
		$scope.signup 		= function() { var formData = { email: $scope.email, password: $scope.password }; SiteUserService.save(formData, function(res) { if (res.type == false) { alert(res.data) } else { $localStorage.token = res.data.token; $state.go('index'); } }, function() { $rootScope.error = 'Failed to signup'; }) };
		$scope.me 			= function() { SiteUserService.me(function(res) { $scope.myDetails = res; }, function() { $rootScope.error = 'Failed to fetch details'; }) };
		$scope.logout 		= function() { SiteUserService.logout(function() { $scope.logged_user = {}; $state.go('index'); }, function() { alert("Failed to logout!"); }); };
		$scope.logout_cancel 	= function() { $state.go('index'); };
		SiteUserService.logged_user(function(res) { $rootScope.logged_user = res.data; }, function() { console.log("Failed to fetch details"); })
		$rootScope.logged_user = true;
	}])
	.factory('SiteUserService', ['$http', '$localStorage', function($http, $localStorage){
		var api_url = "api/v1";
		return {
			signup 	: function(data, success, error) { $http.post(api_url + '/signup', data).success(success).error(error)},
			signin 	: function(data, success, error) { $http.post(api_url + '/signin', data).success(success).error(error)},
			profile 	: function(username, success, error) { $http.get(api_url + '/user/' + username).success(success).error(error)},
			me 		: function(success, error) { $http.get(api_url + '/me').success(success).error(error)},
			logout 	: function(success) { delete $localStorage.token; success();},
			logged_user: function(success, error) { var token = $localStorage.token; var user = {}; if (typeof token !== 'undefined') user = $http.get(api_url + '/validate_token/' + token).success(success).error(error) }
		};
	}])
})();

$(function(){
	$('.tooltips').tooltip();
	$('.popovers').popover({html:true});
});