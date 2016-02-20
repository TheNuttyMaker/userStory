angular.module('mainCtrl', [])


.controller('MainController', function($rootScope, $location, Auth) {

	var vm = this;


	vm.loggedIn = Auth.isLoggedIn();

	$rootScope.$on('$routeChangeStart', function() {

		vm.loggedIn = Auth.isLoggedIn();

		Auth.getUser()
			.then(function(data) {
				vm.user = data.data;
			});
	});


	vm.doLogin = function() {
		console.log("controller ke dologin ke andar");
		vm.processing = true;

		vm.error = '';

		Auth.login(vm.loginData.username, vm.loginData.password)
			.success(function(data){
				vm.processing = false;

				Auth.getUser()
					.then(function(data){
						console.log("controller ke getUser ke andar");
						vm.user = data.data;
					});
				if(data.success){
					console.log("controller ke success ke andar");
					$location.path('/');
				}
				else{
					console.log("controller ke else ke andar");
					vm.error = data.message;
				}
				
			});
			console.log("controller end");
	}

	vm.doLogout = function(){
		Auth.logout();
		$location.path('/logout');

	}
});