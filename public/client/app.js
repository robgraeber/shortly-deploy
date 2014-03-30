window.app = angular.module('myApp', ['ngRoute']);

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/client/templates/links.html',
        controller: 'DisplayLinks'
      })
      .when('/create', {
        templateUrl: '/client/templates/create.html',
        controller: 'CreateLinks'
      })
      .when('/login', {
        templateUrl: '/client/templates/login.html',
        controller: 'LoginController'
      })
      .when('/signup', {
        templateUrl: '/client/templates/signup.html',
        // controller: 'PhoneDetailCtrl'
      });
  }]);
app.service('LinkService', function($http){
  this.getLinks = function(){
    return $http.get('/links').then(function (response) {
      return response.data;
    }); 
  }
  this.postLink = function(link){
    return $http.post('/links', link).then(function (response) {
      return response.data;
    }); 
  }
});
app.service('LoginService', function($http, $rootScope, $location){
  this.submitLogin = function(username, password){
    var user = {
      username: username,
      password: password
    };
    return $http.post('/login', user).then(function (response) {
      console.log("login response:", response);
      $rootScope.isLoggedIn = response.data.isValid;
      return $rootScope.isLoggedIn;
    }); 
  }
  this.checkLogin = function(){
    if(!$rootScope.isLoggedIn){
       $location.path('/login');
    }
    return $rootScope.isLoggedIn;
  }
});