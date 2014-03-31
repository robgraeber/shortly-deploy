app.controller('CreateLinks', function($scope, LinkService, LoginService){
   if(!LoginService.checkLogin()){
    return;
  }  
  $scope.isLoading = false;
  $scope.message = "";
  $scope.link = null;
  $scope.sendLink = function(){
    if($scope.isLoading) return;
    $scope.message = "";
    $scope.isLoading = true;
    $scope.link = null;
    LinkService.postLink({url:$scope.urlText}).then(function(data){
      $scope.isLoading = false;
      $scope.link = data;
      console.log(data);
    }).catch(function(){
      $scope.isLoading = false;
      $scope.message = 'Please enter a valid URL';

    })
  }
});