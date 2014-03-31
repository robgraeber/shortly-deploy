app.controller('DisplayLinks', function($scope, LinkService, LoginService){
   if(!LoginService.checkLogin()){
    return;
  }
  $scope.orderParam = "-visits";
  $scope.orderFn = function(link){
    if($scope.searchBy === undefined){
      return true;
    }
    return link.title.toUpperCase().indexOf($scope.searchBy.toUpperCase()) !== -1;

  }
  LinkService.getLinks().then(function(data){
    console.log("LINKs")
    $scope.links = data;
  });
  //get links
  //bind links to scope
});