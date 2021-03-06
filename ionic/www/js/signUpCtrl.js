angular.module('signUp', [])
  //=======Home screen controller======================
  .controller('signUpCtrl', function($scope, $timeout, $rootScope, appConstants, $cordovaSQLite,
    $ionicHistory, $ionicPopup, $q, $compile, $ionicModal, $http, $ionicLoading, profileDataManager,
    databaseManager, dataStoreManager, syncDataFactory, $base64, surveyDataManager, $state, userService,
    $window, $cordovaDeviceMotion, $cordovaMedia, $cordovaGeolocation) {

    profileDataManager.getUserProfileFields().then(function(response) {
      var userProfile = response;
      var thisUser = userProfile.profiles[userProfile.default];
      var items = thisUser.items;
      //$scope.text = thisUser.text ;
      $scope.title = thisUser.title;
      $scope.profileDiv = '';
      for (var i = 0; i < items.length; i++) {
        $scope.profileDiv += generateProfileDiv(items[i]);
      }

      var dynamicContent = angular.element(document.querySelector('#dynamicContent'));
      dynamicContent.append($scope.profileDiv);
      $compile(dynamicContent)($scope);


      var result = $rootScope.consentFullJson;
      for (var i = 0; i < result.length; i++) {
        var type = result[i].type;
        if (type == "IRK-CONSENT-REVIEW-STEP") {
          if (result[i].participantFamilyName) {
            $scope.firstName_firstName = result[i].participantGivenName;
            $scope.lastName_lastName = result[i].participantFamilyName;
          }
        }
      }

    });

    $scope.passcodeValidation = function() {
      // to get all the items
      var steps = angular.element(document.querySelectorAll('.item-input'));
      var formValid = true;
      var keepGoing = true;
      var password = null;
      var password_confirm = null;
      var emailId = null;
      var dataCache = [];
      var userSignUpData = new Array();

      //iterate the form and validate the form
      for (var i = 0; i < steps.length; i++) {
        var lableId = steps[i].id;
        var spanTag = angular.element(document.querySelectorAll('.item-input')[i].querySelector('span'));
        var text = spanTag[0].textContent;
        if (keepGoing) {
          var inputValue = angular.element(document.querySelectorAll('.item-input')[i].querySelector('input'));
          var type = inputValue.prop('type');
          var placeholder = inputValue.prop('placeholder');
          var value = inputValue.prop('value');
          switch (lableId.toLowerCase()) {
            case 'firstname':
              if (value == '') {
                formValid = false;
                keepGoing = false;
                //clear the array
                $scope.callAlertDailog(appConstants.missingFieldInGeneral + text);
              } else {
                obj = {
                  "id": lableId,
                  "placeholder": placeholder,
                  "text": text,
                  "type": type,
                  "value": value
                };
                dataCache.push(obj);
                userSignUpData.push({
                  'firstName': value
                });
              }
              break;
            case 'lastname':
              if (value == '') {
                formValid = false;
                keepGoing = false;
                $scope.callAlertDailog(appConstants.missingFieldInGeneral + text);
              } else {
                obj = {
                  "id": lableId,
                  "placeholder": placeholder,
                  "text": text,
                  "type": type,
                  "value": value
                };
                dataCache.push(obj);
                userSignUpData.push({
                  'lastName': value
                });
              }
              break;
            case 'email':
              if (value == '') {
                formValid = false;
                keepGoing = false;
                $scope.callAlertDailog(appConstants.missingFieldInGeneral + text);
              } else {
                //is email valid
                if (inputValue.hasClass('ng-invalid-email') || inputValue.hasClass('ng-invalid')) {
                  formValid = false;
                  keepGoing = false;
                  $scope.callAlertDailog('Email ' + value + ' is invalid.');
                } else {
                  emailId = value;
                  obj = {
                    "id": lableId,
                    "placeholder": placeholder,
                    "text": text,
                    "type": type,
                    "value": value
                  };
                  dataCache.push(obj);
                  userSignUpData.push({
                    'email': value
                  });
                }
              }
              break;
            case 'password':
              password = value;
              if (password == '') {
                formValid = false;
                keepGoing = false;
                $scope.callAlertDailog(appConstants.missingFieldInGeneral + text);
              } else {
                if (password.length < 6) {
                  formValid = false;
                  keepGoing = false;
                  $scope.callAlertDailog(appConstants.passwordLengthOfSixCharacter);
                } else {
                  userSignUpData.push({
                    'password': value
                  });
                }
              }
              break;
            case 'password_confirm':
              password_confirm = value;
              if (password_confirm == '') {
                formValid = false;
                keepGoing = false;
                $scope.callAlertDailog(appConstants.missingFieldInGeneral + text);
              } else {
                if (password_confirm.length < 6) {
                  formValid = false;
                  keepGoing = false;
                  $scope.callAlertDailog(appConstants.confirmPasswordLengthOfSixCharacter);
                }
              }
              break;

            case 'gender':
              var select = angular.element(document.querySelectorAll('.item-input')[i].querySelector('select'));
              var value = select.prop('value');
              var options = select.prop('options');
              var placeholder = select.prop('placeholder');
              var choices = new Array();
              for (var k = 0; k < options.length; k++) {
                choices.push(options[k].value);
              }
              obj = {
                "id": lableId,
                "placeholder": placeholder,
                "text": text,
                "type": 'radio',
                "value": value,
                "choices": choices
              };
              dataCache.push(obj);
              break;

            case 'dateofbirth':
              obj = {
                "id": lableId,
                "placeholder": placeholder,
                "text": text,
                "type": type,
                "value": value
              };
              dataCache.push(obj);
              break;

            case 'weight':
              obj = {
                "id": lableId,
                "placeholder": placeholder,
                "text": text,
                "type": type,
                "value": value
              };
              dataCache.push(obj);
              break;

            case 'height':
              obj = {
                "id": lableId,
                "placeholder": placeholder,
                "text": text,
                "type": type,
                "value": value
              };
              dataCache.push(obj);
              break;
            default:
              break;
          }
        }
      }

      if (formValid) {
        //check password equal to confirm password
        if (password == password_confirm) {
          $scope.emailId = emailId;
          //clear the sign up form
          $scope.clearSignUpDiv();
          $scope.password = password;
          $ionicLoading.show();
          var loginString = new Date().getTime();
          var login = userSignUpData[0].firstName + userSignUpData[1].lastName + loginString;
          userSignUpData.push({
            'login': login
          });

          dataStoreManager.createGlobalUser(userSignUpData).then(function(res) {
            if (res.status == 200) {
              var resultData = res.data;
              var userId = resultData._id;
              if (userId) {
                var userVerified = "no";
                var consentResult = $rootScope.consentResult;
                var profileJsonString = JSON.stringify(dataCache);
                var docDefinition = "";
                if (consentResult) {
                  docDefinition = JSON.stringify(consentResult.docDefinition);
                }
                profileDataManager.getAppJSON().then(function(appJson) {
                  if (appJson) {
                    var appJson = JSON.stringify(appJson);
                    profileDataManager.createNewUser(dataCache, $scope.emailId, userId, "", userVerified).then(function(localUserId) {
                      if (localUserId) {
                        $scope.localUserId = localUserId;
                        $rootScope.emailId = $scope.emailId; // save it to access in update profile
                        $rootScope.activeUser = $scope.emailId;
                        var folderId = "";
                        var itemId = "";
                        var addToSyncQueue = [];
                        addToSyncQueue.push(syncDataFactory.addToSyncQueue("", localUserId, "app_json", appJson, folderId, itemId, false));
                        addToSyncQueue.push(syncDataFactory.addToSyncQueue("", localUserId, "consent_json", docDefinition, folderId, itemId, false));
                        addToSyncQueue.push(syncDataFactory.addToSyncQueue("", localUserId, "profile_json", profileJsonString, folderId, itemId, false));
                        $q.all(addToSyncQueue).then(function(createLocalData) {
                          var consent = "";
                          if (consentResult) {
                            consent = consentResult.docDefinition;
                          }
                          surveyDataManager.addResultToDb(localUserId, consent, 'consent').then(function(response) {
                            $ionicLoading.hide();
                            $scope.removeSignUpDiv();
                            $scope.launchPinScreen();
                          });
                        });
                      }
                    });
                  }
                });
              }
            }
          }, function(error) {
            if (!error.statusText) {
              if (window.Connection) {
                if (navigator.connection.type == Connection.NONE) {
                  $scope.callAlertDailog(appConstants.checkInternetConnectionMessage);
                } else {
                  $scope.callAlertDailog(appConstants.failedToCreateUserWithEmptyStatus);
                }
              }
            }
          });
        } else {
          formValid = false;
          keepGoing = false;
          $scope.callAlertDailog(appConstants.passwordMissMatchWithConfirmPassword);
        }
      } else {
        // redefine the array make sure to clear the array
        dataCache = [];
      }
    }

    $scope.callAlertDailog = function(message) {
      document.activeElement.blur(); // remove the keypad
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: appConstants.signUpValidationMessageTitle,
        template: message
      });
    }

    $scope.skipSignUp = function() {
      $ionicHistory.clearCache().then(function() {
        $state.transitionTo('tab.Activities');
      });
    }

    $scope.launchPinScreen = function() {

      if (ionic.Platform.isIOS()) {
        $scope.ShowIos = true;


      } else if (ionic.Platform.isAndroid()) {
        $scope.ShowAndroid = true;
      }
      $ionicHistory.clearCache().then(function() {
        $ionicModal.fromTemplateUrl('templates/choosepassode.html', {
          scope: $scope,
          animation: 'slide-in-left',
          hardwareBackButtonClose: false,
        }).then(function(modal) {
          $scope.modal = modal;
          $scope.modal.show();
        });
      });
    }


    //=====sign up cancel ====================================
    $scope.backtohome = function() {
      $scope.clearSignUpDiv();
      $ionicHistory.clearCache().then(function() {
        $state.go('home', {
          cache: false
        });
      });
    }

    $scope.clearSignUpDiv = function() {
      var steps = angular.element(document.querySelectorAll('input'));
      for (var i = 0; i < steps.length; i++) {
        var lableId = steps[i].id;
        $scope.labelId = "";
      }
    }

    $scope.removeSignUpDiv = function() {
        angular.element(document.querySelectorAll('.item-input')).remove();
        angular.element(document.querySelectorAll('#signUpDiv')).remove();
        //var select = angular.element(document.querySelectorAll('.item-input')[i].querySelector('select'));
        //  removeSignUpDiv.remove();
      }
      //=================================================== forgot passcode handler ============================

    $scope.checkPasscodeDigits = function() {
      var inputDiv = angular.element(document.querySelector('#passcode'));
      var passcode = angular.element(document.querySelector('#passcode')).prop('value');
      //  var isNumber = /^\d+$/.test(passcode);
      var isNumber = true;
      /* if (ionic.Platform.isAndroid()) {
        if (passcode[0] == "0") {
          isNumber = false;
          inputDiv.val("");
          $scope.callAlertDailog(appConstants.numberOnly);
        }
      }
      */
      if (isNumber) {
        if (passcode.length == 4) {
          $scope.passcode = passcode;
          $scope.managePasscode = true;
          document.activeElement.blur(); // remove the keypad
          $scope.passcodeLabel = "Confirm Passcode";
          $scope.managePasscodeConfirm = false;
        } else if (passcode.length > 4) {
          $scope.callAlertDailog(appConstants.passcodeOfFourDigitLength);
        }
      }
    }

    //=================================================== confirm  passcode handler ============================

    $scope.passcodeLabel = "Create passcode";
    $scope.managePasscode = false;
    $scope.managePasscodeConfirm = true;
    $scope.confirmLoop = 0;

    $scope.checkConfirmPasscodeDigits = function() {

      var confirm_passcode_div = angular.element(document.querySelector('#confirm_passcode'));
      var confirm_passcode = angular.element(document.querySelector('#confirm_passcode')).prop('value');
      //var isNumber = /^\d+$/.test(confirm_passcode);

      var isNumber = true;
      /*  if (ionic.Platform.isAndroid()) {
          if (confirm_passcode[0] == "0") {
            isNumber = false;
            confirm_passcode_div.val("");
            $scope.callAlertDailog(appConstants.numberOnly);
          }
        }
        */
      if (isNumber) {
        if (confirm_passcode.length == 4) {
          //check is both are equal
          if ($scope.passcode == confirm_passcode) {
            var email = $scope.emailId;
            var authToken = "";
            if (email) {
              profileDataManager.getUserIDByEmail(email).then(function(res) {
                profileDataManager.addPasscodeToUserID(res, $scope.passcode, email, authToken).then(function(res) {
                  $scope.openVerification();
                });
              });
            }
          } else {
            //reset div
            $scope.confirm_passcode = '';
            //  $compile(confirm_passcode_div)($scope);
            confirm_passcode_div.val("");
            $scope.callAlertDailog(appConstants.passcodeMissMatchWithConfirmPasscode);
            $scope.confirmLoop = $scope.confirmLoop + 1;
            if ($scope.confirmLoop >= 3) {
              document.activeElement.blur(); // remove the keypad
              $scope.passcodeLabel = "Create passcode";
              $scope.managePasscode = false;
              $scope.managePasscodeConfirm = true;
              $scope.confirmLoop = 0;
              //clear div
              var passcode_div = angular.element(document.querySelector('#passcode'));
              $scope.passcode = '';
              // $compile(passcode_div)($scope);
              passcode_div.val("");
            }
          }
        } else if (confirm_passcode.length > 4) {
          $scope.callAlertDailog(appConstants.passcodeOfFourDigitLength);
        }
      }
    }



    //=================== verify user later ======
    $scope.verifyLater = function() {

      $ionicModal.fromTemplateUrl('templates/locationservice.html', {
        scope: $scope,
        animation: 'slide-in-left',
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.modal.remove();
        $scope.modal = modal;
        $scope.modal.show();
        //  $scope.accelerationLabel='Allow';
        $scope.microPhoneLabel = 'ALLOW';
        $scope.geoLabel = 'ALLOW';
        if (window.localStorage.getItem('Geo') == 'YES') {
          var myEl = angular.element(document.querySelector('#geo'));
          myEl.removeClass('irk-btnloc');
          myEl.addClass('irk-btnlocG');
          $scope.geoLabel = 'GRANTED'

        } else if (window.localStorage.getItem('Geo') == 'NO') {
          $scope.geoLabel = 'DENIED'
        } else {
          $scope.geoLabel = 'ALLOW'
        }

        $scope.allowAccelerometer();
        $scope.Disable = false;
      });
    }


    //========================All set go to next screen ===========================
    $scope.openVerification = function() {
      $scope.disableVerifyButton = false;
      $ionicModal.fromTemplateUrl('templates/verification.html', {
        scope: $scope,
        animation: 'slide-in-left',
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.modal.remove();
        $scope.modal = modal;
        $scope.modal.show();
      });
    };

    $scope.openPermisssions = function() {
      $scope.disableVerifyButton = true;
      var email = $scope.emailId;
      var password = $scope.password;
      if (email && password && !$scope.userSyncStatus) {
        var beforeEncode = email.trim() + ':' + password.trim();
        var encoded = 'Basic ' + $base64.encode(unescape(encodeURIComponent(beforeEncode)));
        // $ionicLoading.show();
        $ionicLoading.show({
          noBackdrop: true
        });

        syncDataFactory.verifyUserToFetchToken(encoded).then(function(res) {
          $ionicLoading.hide();
          $scope.disableVerifyButton = false;
          if (res.status == 200 || !res.data) {
            $scope.userSyncStatus = true;
            $scope.startSyncServices();
          } else {
            $scope.failureMessage(res.data.message);
          }
        }, function(error) {
          $scope.disableVerifyButton = false;
          $scope.failureMessage(error.statusText);
        });

      } else if ($scope.userSyncStatus) {
        $scope.verifyLater();
        $scope.disableVerifyButton = false;
      }
    };

    $scope.startSyncServices = function() {
      // start sync services to upload the data
      syncDataFactory.checkDataAvailableToSync().then(function(res) {
        if (res.length > 0) {
          syncDataFactory.startSyncServiesTouploadData(res).then(function(res) {
            $ionicLoading.hide();
            $scope.verifyLater();
          }, function(error) {
            $scope.failureMessage(error.statusText);
          });
        } else {
          $scope.verifyLater();
          $ionicLoading.hide();
        }
      });
    }

    $scope.failureMessage = function(message) {
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: appConstants.errorDailogTitle,
        template: message
      });
    }

    $scope.allowGeoLocation = function() {
      $scope.Disable = true;
      var posOptions = {
        timeout: 10000,
        enableHighAccuracy: false
      };


      $cordovaGeolocation
        .getCurrentPosition(posOptions)

      .then(function(position) {
        if (position) {
          var myEl = angular.element(document.querySelector('#geo'));
          myEl.removeClass('irk-btnloc');
          myEl.addClass('irk-btnlocG');
          window.localStorage.setItem('Geo', 'YES');
        }

        var lat = position.coords.latitude
        var long = position.coords.longitude
        $scope.geoLabel = 'GRANTED';

      }, function(err) {
        window.localStorage.setItem('Geo', 'NO');
        $ionicPopup.alert({
          title: appConstants.syncOnceAccountVerifiedTitle,
          template: appConstants.infoMessageToAllowLocationServiceLater
        });
        $scope.geoLabel = 'DENIED';
        $scope.Disable = false;
      });
    };

    $scope.allowAccelerometer = function() {
      $scope.options = {
        frequency: 20, // Measure every 100ms
        deviation: 25 // We'll use deviation to determine the shake event, best values in the range between 25 and 30
      };
      $scope.watch = $cordovaDeviceMotion.watchAcceleration($scope.options);
      // Device motion initilaization
      $scope.watch.then(null, function(error) {
          $scope.accelerationLabel = 'ALLOW';
          $scope.Disable = false;
        },
        function(accelerometerSuccess) {
          // Set current data
          var myEl = angular.element(document.querySelector('#acc'));
          myEl.removeClass('irk-btnloc');
          myEl.addClass('irk-btnlocG');
          $scope.accelerationLabel = 'GRANTED';
          $scope.Disable = true;
        });
    };

    $scope.allDone = function() {
      /*  if (!$scope.userSyncStatus) {
          $scope.enableLocalNotification();
        } else {
          $scope.disableLocalNotification();
        }
        */
      $ionicModal.fromTemplateUrl('templates/alldone.html', {
        scope: $scope,
        animation: 'slide-in-left',
        hardwareBackButtonClose: false,
      }).then(function(modal) {
        $scope.modal.remove();
        $scope.modal = modal;
        $scope.modal.show();
      });
    };

    $scope.enableLocalNotification = function() {
      cordova.plugins.notification.local.hasPermission(function(granted) {
        if (granted) {
          console.log('permissions given');
          $scope.scheduleNotification();
        } else {
          cordova.plugins.notification.local.registerPermission(function(granted) {
            console.log('Permission has been granted: ' + granted);
            if (granted) {
              $scope.scheduleNotification();
            } else {
              console.log('Enable notifications from Device Settings');
            }
          });
        }
      });
    }

    $scope.scheduleNotification = function() {
      var notifyDate = new Date();
      notifyDate.setHours(18);
      notifyDate.setMinutes(30);
      notifyDate.setSeconds(00);
      cordova.plugins.notification.local.schedule({
        id: $scope.localUserId,
        title: "Account verify",
        text: $scope.emailId.trim(),
        at: notifyDate,
        every: appConstants.scheduleNotificationEvery
      });
    }

    $scope.disableLocalNotification = function() {
      cordova.plugins.notification.local.cancel($scope.localUserId, function() {
        console.log("done");
      });
    }

    $scope.consentReview = function() {
      $ionicHistory.clearCache().then(function() {
        $scope.modal.remove();
        $state.transitionTo('tab.Activities');
      });
    }

    $scope.closeModal = function() {
      $scope.modal.remove();
    };

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      // $scope.modal.remove();
    });

    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
      // Execute action
    });

    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
      // Execute action
    });

  });
