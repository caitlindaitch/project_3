"use strict";

(function(){
  angular
  .module("trips", [
    "ui.router",
    "ngResource"
  ])
  .config([
    "$stateProvider",
    RouterFunction
  ])
  .config(["$sceProvider", function($sceProvider){
    $sceProvider.enabled(false);
  }])
  .factory( "Trip", [
    "$resource",
    Trip
  ])
  .factory( "SearchFactory", [
    "$resource",
    SearchFactory
  ])
  .factory( "LocationFactory", [
    "$resource",
    LocationFactory
  ])
  .controller("indexCtrl", [
    "SearchFactory",
    "Trip",
    indexControllerFunction
  ])
  .controller( "tripNewCtrl", [
    "Trip",
    "$stateParams",
    tripFormFunction
  ])
  .controller( "tripEditCtrl", [
    "Trip",
    "$stateParams",
    tripEditControllerFunction
  ])
  .controller( "tripShowCtrl", [
    "SearchFactory",
    "Trip",
    "$stateParams",
    "LocationFactory",
    "$window",
    showCtrlFunction
  ])
  .directive("tripForm",[
    "Trip",
    "$state",
    "$window",
    tripFormDirectiveFunction
  ]);

  function showCtrlFunction( Search, Trip, $stateParams, LocationFactory, $window ){
    var showVM = this;
    showVM.trip = Trip.get({id: $stateParams.id},function(trip){
      console.log(trip.locations)
      showVM.mapUrl = generateMapURL(trip.locations);
      // console.log("showVM trip assign:", trip)
      showVM.trip = trip;
    });
    showVM.search = function() {
      showVM.places = Search.query({q:showVM.query}, function(results){
        showVM.places = results;
        // console.log(results)
      })
    };
    showVM.location = new LocationFactory();
    showVM.createLocation = function(trip_id, name, lat, long, place_id){
      showVM.location.$save({trip_id: trip_id, name: name, lat: lat, long: long, place_id: place_id});
      $window.location.reload();
    }
  };

  function indexControllerFunction( Search, Trip ){
    var indexVM = this;
    indexVM.trips = Trip.all;
  };

  function Trip( $resource ){
    var Trip = $resource( "/trips/:id.json", {}, {
      update: {
        method: "PUT",
        isArray: true
      },
    });
    Trip.all = Trip.query();
    return Trip;
  };

  function SearchFactory( $resource ){
    var Search = $resource( "/trips/1/locations/search", {}, {
      query: {
        method: "GET",
        isArray: true
      },
    });
    Search.all = Search.query()
    return Search;
  };

  function LocationFactory( $resource ){
    var Location = $resource( "/trips/:trip_id/locations/:id", {trip_id: "@trip_id"}, {
      update: {
        method: "PUT"
      }
    });
    return Location;
  }

  function RouterFunction($stateProvider){
    $stateProvider
    .state("tripIndex", {
      url: "/trips",
      templateUrl: "/ng-views/trip.index.html",
      controller: "indexCtrl",
      controllerAs: "indexVM"
    })
    .state("tripNew", {
      url: "/trips/new",
      templateUrl: "/ng-views/trip.new.html",
      controller: "tripNewCtrl",
      controllerAs: "tripNewVM"
    })
    .state("tripEdit", {
      url: "/trips/:id/edit",
      templateUrl: "/ng-views/trip.edit.html",
      controller: "tripEditCtrl",
      controllerAs: "tripEditVM"
    })
    .state("tripShow", {
      url: "/trips/:id",
      templateUrl: "/ng-views/trip.show.html",
      controller: "tripShowCtrl",
      controllerAs: "tripShowVM"
    })
  };
  function tripFormDirectiveFunction(Trip, $state, $window){
    return{
      templateUrl: "/ng-views/_trip_form.html",
      restrict: "C",
      scope: {
        trip: "=",
        formType: "@",
      },
      link: function(scope){
        scope.create = function(){
          Trip.save(scope.trip, function(response){
            Trip.all.push(response);
            $state.go("tripShow", {id: response.id});
          });
        }
        scope.update = function(){
          Trip.update({id: scope.trip.id}, scope.trip, function(response){
            $state.go("tripShow", {id: response.id});
          })
        }
        scope.delete = function(){
          Trip.delete({id: scope.trip.id}, scope.trip, function(response){
            $state.go("tripIndex");
          })
        }
      }
    }
  }

  function tripFormFunction(){

  }

  function tripEditControllerFunction( Trip, $stateParams ) {
    this.trip = Trip.get({id: $stateParams.id});
  }

  function generateMapURL(args) {
    // [...args] makes a new array so that we don't  mutate the data.
    // args = [...args];
    var args = args.slice();
    var string = "https://www.google.com/maps/embed/v1/directions?key=AIzaSyAg39LEeoWxSherOtvNqnYGg24ojPJFJDM&";
    if (args.length === 1 ){
      console.log("arg 1")
      return string+="origin=place_id:"+args[0].place_id+"&destination=place_id:"+args[0].place_id
    }
    if (args.length === 2){
      console.log("arg 2")
      return string+="origin=place_id:"+args[0].place_id+"&destination=place_id:"+args[1].place_id
    }
    if (args.length === 3){
      return string+="origin=place_id:"+args[0].place_id+"&destination=place_id:"+args[2].place_id+"&waypoints=place_id:"+args[1].place_id
    }
    var first = args.shift();
    var last = args.pop();
    var wayPoints = "&waypoints=";
    for (var i=0; i<(args.length-1); i++){
      wayPoints += "place_id:"+ args[i].place_id + "|"
    }
    wayPoints += "place_id:"+args[args.length-1].place_id

    return string+="origin=place_id:"+first.place_id+"&destination=place_id:"+last.place_id+wayPoints;
  }
  // 
  // function hideMap(place){
  //   if (place == undefined) {
  //     document.body.querySelector(".map").classList.add("display-none");
  //   }
  // }
})();
