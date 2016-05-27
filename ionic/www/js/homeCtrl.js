angular.module('homeCtrl',[])
//=======Home screen controller======================
.controller('homeCtrl', function($scope,$compile,$timeout,$rootScope,$cordovaSQLite,$ionicPopup,$ionicHistory,$controller,$ionicModal,$http,$ionicLoading,userService,databaseManager,
  dataStoreManager,profileDataManager,$cordovaEmailComposer, eligiblityDataManager,irkResults,$base64,$state,$location,$window) {

 databaseManager.checkDatabaseExists().then(function(res){
       if (res == 5 ) {
            //call a method and read from local json and create schema
             userService.getConfigJson().then(function(response){
            var eligibility = JSON.stringify(response.eligibility);
            var profile = JSON.stringify(response.profile);
            var consent_screens = JSON.stringify(response.consent_screens);
            var surveyJson =  JSON.stringify(response.surveys);
            var tasksJson =  JSON.stringify(response.tasks);
            var completeJson = JSON.stringify(response);

          databaseManager.createAppContentTable(response.version, response.URL,eligibility,profile,consent_screens,completeJson).then(function(resp){
                 console.log('createAppContentTable  '+ resp);
            });

            databaseManager.createTasksTable(tasksJson).then(function(resp){
                 console.log('createTasksTable  '+ resp);
            });

            databaseManager.createSurveyTempTable().then(function(resp){
                 console.log('createSurveyTempTable  '+ resp);
            });

              databaseManager.createSurveysTable(surveyJson).then(function(resp){
                   console.log('createSurveysTable  '+ resp);
              });

            databaseManager.createSurveyQuestionExpiryTable().then(function(resp){
                 console.log('createSurveyQuestionTable  '+ resp);
            });

          });
       }
 });

  //openOnlineResource
  $scope.openOnlineResource = function() {
    $ionicModal.fromTemplateUrl('templates/modal-online-resource.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.modal.show();
    });
};

$scope.go = function () {
  $scope.modal.remove();
};

$scope.joinStudy = function () {
  $ionicHistory.clearCache().then(function(){
      $state.transitionTo('eligiblityTest');
  });
};

$scope.GoBack = function () {
  $scope.modal.remove();
};

$scope.sendConsentDoc = function (){
  console.log('send consent doc ');
  var email = {
     to: 'teste@example.com',
     cc: 'teste@example.com',
     bcc: ['john@doe.com', 'jane@doe.com'],
  /*   attachments: [
       'file://img/logo.png',
       'res://icon.png',
       'base64:icon.png//iVBORw0KGgoAAAANSUhEUg...',
       'file://README.pdf'
     ],
    */ subject: 'Mail subject',
     body: 'How are you? Nice greetings from Leipzig',
     isHtml: true
  };

 // $cordovaEmailComposer.open(email).then(null, function () {
 //   // user cancelled email
 //  });

 $cordovaEmailComposer.isAvailable().then(function() {
    // is available
    $cordovaEmailComposer.open(email).then(null, function () {
      console.log('email ');
    });

  }, function () {
    // not available
    console.log('email not available' );

  });


}

//==================================Select email view ==========
     $scope.openSignInChooseEmail = function() {
    //get IP like email ids
     profileDataManager.getEmailList().then(function(response){
       var griderArray = new Array() ;
       for (var i = 0; i < response.length; i++) {
         griderArray.push({'emailId':response.item(i).emailId});
       }
       $scope.emails = griderArray;
    });

    $ionicModal.fromTemplateUrl('templates/signin-choose-email.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.modal.show();
      $scope.setPasscodeFocus = true ;
      $scope.hidePasscodeDiv = true ;
      $scope.hideImageDiv = false ;
    });
  };

  $scope.resetInput = function() {
       $scope.hidePasscodeDiv = false;
       $scope.hideImageDiv = true ;
       var passcode_div = angular.element(document.querySelector('#passcode'));
       $scope.passcodeDiv = '';
       $scope.setPasscodeFocus = true ;
       passcode_div.val('');
  };

//sign in via email and passcode on change of passcode call this function
  $scope.loginViaPasscode = function (){
      var inputValue = angular.element(document.querySelectorAll('#passcode'));
      var passcode = inputValue.prop('value') ;
      if(passcode.length == 4){
        var emailDiv = angular.element(document.querySelectorAll('.passcode-dropdown'));
        var email = emailDiv.prop('selectedOptions')[0].value ;
        if (email && passcode) {
          //get IP like email ids
          profileDataManager.logInViaPasscode(email,passcode).then(function(res){
                       if (res) {
                          // All set go to next page
                          $ionicHistory.clearCache().then(function(){
                          $rootScope.emailId = email ; // save it to access in update profile
                          $scope.modal.remove();
                          $rootScope.activeUser = email;
                          $state.transitionTo('tab.Activities');
                          });
                       }else {
                         $scope.resetInput();
                         $scope.callAlertDailog('Invalid passcode!!!');
                        }
                    });
           }
      }
  };

//from Sign in screen to  eligiblityTest
  $scope.showEligibilityTestView = function() {
     $scope.modal.remove();
     $ionicHistory.clearCache().then(function(){
     $state.transitionTo('eligiblityTest');
   });
};

   // ==== Close the existing modal and open Sign in html in new modal========
  $scope.openSignIn = function() {
       $ionicModal.fromTemplateUrl('templates/Login-IRK.html', {
         scope: $scope,
         animation: 'slide-in-up'
       }).then(function(modal) {
         $scope.modal.remove();
         $scope.modal = modal;
         $scope.modal.show();
       });
  };

  //=========================================== from sign in screen to forgot passcode ===================
  $scope.forgotPasscodeDialog = function() {
    var emailDiv = angular.element(document.querySelectorAll('.passcode-dropdown'));
    var email = emailDiv.prop('selectedOptions')[0].value ;
    $scope.emailId = email.trim(); //capture the email id selected
    $ionicModal.fromTemplateUrl('templates/signin-enter-passcode.html', {
       scope: $scope,
       animation: 'slide-in-up'
     }).then(function(modal) {
       $scope.modal.remove();
       $scope.modal = modal;
       $scope.modal.show();
     });
  };

//====================================================Sign in for both forgot passcode and sign in screen ========
$scope.signInSubmit = function (statePassed) { // recive the state to determine the UI Input and the call is coming from
    var formValid = false;
    formValid = $scope.validateSignInForm();
    if (formValid) {
        var password  = angular.element(document.querySelector('#password')).prop('value');
        var email  = angular.element(document.querySelector('#email')).prop('value');
        if (email && password ) {
          var beforeEncode = email.trim()+':'+password.trim();
          var encoded = 'Basic '+ $base64.encode(unescape(encodeURIComponent(beforeEncode)));
          dataStoreManager.signInGlobalUser(encoded).then(function(res){
               if (res.status == 200) {
                        var token = res.data.authToken['token'] ;
                        var email = res.data.user['email'] ;
                        // check if the email id exists locally else launch the set pin screen
                      profileDataManager.checkUserExistsByEmailOnly(email).then(function(userExistsId){
                        $scope.emailId = email ;
                          if (userExistsId) {
                                  profileDataManager.updateUserAuthToken(email,token).then(function(insertId){
                                    $rootScope.emailId = email ; // save it to access in update profile
                                    $scope.modal.remove();
                                    if (statePassed == 'signin') {  // if the user coming from sign in page
                                     $scope.transition('tab.Activities');
                                    }else if (statePassed == 'passcode') { // if the user coming from forgot passcode
                                    $scope.emailId = email ;
                                    $scope.launchpinScreen();
                                   }
                                });
                          }else {
                            // valid user doesn't exists locally so get the profile data and set the pin
                            var profileJson = ''; //  fetch this once grider intigrated
                            profileDataManager.createNewUser(profileJson,$scope.emailId,token).then(function(insertId){
                                  if (insertId) {
                                    // ask to reset the pin
                                    $scope.launchpinScreen();
                                  }
                              });
                          }
                      });
                 }
           });
         } // validate

      } // form valid
}; // submit

// =====================validate sign in form ============
$scope.validateSignInForm = function (){
  var keepGoing = true; var formValid = true;
  // validate input fields
  var inputValue = angular.element(document.getElementById("signIn").querySelectorAll(".item-input"));
  for (var i = 0; i < inputValue.length; i++) {
        var inputTag = angular.element(inputValue[i].querySelector('input'));
        var value = inputTag.prop('value');
        var placeholder = inputTag.prop('placeholder');
        if(keepGoing){
          switch (placeholder.toLowerCase()) {
           case 'email':
                     if(value ==''){
                       formValid = false; keepGoing = false;
                       $scope.callAlertDailog('Please enter your '+placeholder);
                     }else {
                       //is email valid
                       if(inputTag.hasClass('ng-invalid-email') || inputTag.hasClass('ng-invalid')){
                         formValid = false ; keepGoing = false;
                         $scope.callAlertDailog('Email '+value+' is invalid.');
                        }
                     }
                 break;
            case 'password':  if(value ==''){
                              formValid = false; keepGoing = false;
                              $scope.callAlertDailog('Please enter your '+placeholder);
                              }
                              break ;
             default: break ;
               }
        }
  }
  return formValid ;
};

//on forgot passcode launch pin screen and reset the passcode
$scope.launchpinScreen = function(){
     $ionicModal.fromTemplateUrl('templates/choosepassode.html', {
       scope: $scope,
       animation: 'slide-in-up',
     }).then(function(modal) {
         $scope.modal = modal;
         $scope.passcodeLabel = "Enter Passcode";
         $scope.managePasscode = false ;
         $scope.managePasscodeConfirm = true ;
         $scope.confirmLoop = 0;
         $scope.emailId = $rootScope.emailId ;
         $scope.modal.show();
      });
  };

//===================================================passcode handler ============================
  $scope.checkConfirmPasscodeDigits = function(){
      var confirm_passcode_div = angular.element(document.querySelector('#confirm_passcode'));
      var confirm_passcode = confirm_passcode_div.prop('value');
         if(confirm_passcode.length == 4){
          //check is both are equal
          if($scope.passcode == confirm_passcode){
              var email = $scope.emailId ;
              if (email) {
                profileDataManager.getUserIDByEmail(email).then(function(res){
                       profileDataManager.addPasscodeToUserID(res,$scope.passcode,email).then(function(res){
                            $scope.modal.remove();
                            $scope.transition('tab.Activities');
                          });
                    });
                }
            }else {
            //reset div
            $scope.confirm_passcode = '';
            $scope.passcodeDiv = '';
            confirm_passcode_div.val(''); // clear the div

            $scope.callAlertDailog("Passcode should match with confirm");
            $scope.confirmLoop = $scope.confirmLoop +1;
             if($scope.confirmLoop >= 3){
               $scope.passcodeLabel = "Enter Passcode";
               $scope.managePasscode = false ;
               $scope.managePasscodeConfirm = true ;
               $scope.confirmLoop = 0;
               //clear div
               var passcode_div = angular.element(document.querySelector('#passcode'));
               $scope.passcode = '';
               passcode_div.val(''); // clear the div
             }
           }
          }else if(confirm_passcode.length > 4) {
          $scope.callAlertDailog("Passcode length should be max 4.");
         }
  };

  $scope.checkPasscodeDigits = function(){
       var passcode = angular.element(document.querySelector('#passcode')).prop('value') ;
       if(passcode.length == 4){
         $scope.passcode = passcode ;
         $scope.managePasscode = true ;
         $scope.passcodeLabel = "Confirm Passcode";
         $scope.managePasscodeConfirm = false ;
       }else if(passcode.length > 4) {
        $scope.callAlertDailog("Passcode length should be max 4.");
       }
   };

//==================forgot password login via email ================
$scope.forgotPassword = function (){
  var myPopup = $ionicPopup.show({
    template: '<input style="text-align: center" type="Email" id="email_recover" placeholder="Email" focus-me>',
    title: 'Forgot Password',
    subTitle: 'Please enter your email',
    scope: $scope,
    buttons: [
       { text: 'Cancel' },
       {
        text: '<b>Done</b>',
        type: 'button-positive',
        onTap: function(e) {
          var emailId = angular.element(document.querySelector('#email_recover')).prop('value') ;
          if (emailId.length != 0) {
              // process the request
              dataStoreManager.userForgotPassword(emailId).then(function(res){
                  if (res.status == 200) {
                         $scope.callAlertDailog(res.message);
                       }else if (res.status == 400){
                         e.preventDefault();
                         $scope.callAlertDailog(res.message);
                       }
                  return $scope ;
                 });
               } else {
               e.preventDefault();
            }
          }
        }
      ]
    });
 };

//skip sign in from home->signIn->signIn->skip
$scope.skipSignIn = function (){
   $ionicHistory.clearCache().then(function(){
     $scope.modal.remove();
     $state.transitionTo('eligiblityTest');
   });
 };

//error handler dailog
$scope.callAlertDailog =  function (message){
        $ionicPopup.alert({
         title: 'Error',
         template: message
        });
  };

//on done clear states and travel to next screen
$scope.transition =  function (state){
     $ionicHistory.clearCache().then(function(){
     $state.transitionTo(state);
     });
  };

});