app.controller('LoginController', function($scope, LoginService, $location){
  $scope.asdfasdf = 435243;
  $scope.sendLogin = function(){
    console.log("Sending login!");
    $scope.message = "";
    LoginService.submitLogin($scope.username, $scope.password)
    .then(function(isLoggedIn){
      if(isLoggedIn){
        $location.path('/');
      }else{
        $scope.message = "User or password not found!!!";
      }
    });
  }
});