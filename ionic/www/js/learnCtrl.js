angular.module('learnModule',[])
//=======Home screen controller======================
.controller('LearnCtrl', function($scope,$ionicHistory,$rootScope,$state) {

  $scope.go = function () {
          $ionicHistory.clearCache().then(function(){
                      $rootScope.emailId = null;
                      $state.transitionTo('home');
          });
   }

});
