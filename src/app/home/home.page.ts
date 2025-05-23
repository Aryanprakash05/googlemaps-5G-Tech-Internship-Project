import { GmapsService } from './../services/gmaps/gmaps.service';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('map', { static: true }) mapElementRef: ElementRef;
  googleMaps: any;
  center = { lat: 13.0827, lng: 80.2707 };
  map: any;
  mapClickListener: any;
  markerClickListener: any;
  markers: any[] = [];
  polyline: any;

  constructor(
    private gmaps: GmapsService,
    private renderer: Renderer2,
    private actionSheetCtrl: ActionSheetController
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.loadMap();
  }

  async loadMap() {
    try {
      let googleMaps: any = await this.gmaps.loadGoogleMaps();
      this.googleMaps = googleMaps;
      const mapEl = this.mapElementRef.nativeElement;
      const location = new googleMaps.LatLng(this.center.lat, this.center.lng);
      this.map = new googleMaps.Map(mapEl, {
        center: location,
        zoom: 12
      });
      this.renderer.addClass(mapEl, 'visible');
      this.onMapClick();
    } catch (e) {
      console.log(e);
    }
  }

  onMapClick() {
    this.mapClickListener = this.googleMaps.event.addListener(
      this.map,
      'click',
      (mapsMouseEvent) => {
        const location = mapsMouseEvent.latLng;
        this.addMarker(location);
        if (this.markers.length === 2) {
          this.drawPathAndShowDistance();
        }
      }
    );
  }

  addMarker(location) {
    let googleMaps: any = this.googleMaps;
    const icon = {
      url: 'assets/icons/location-pin.png',
      scaledSize: new googleMaps.Size(50, 50)
    };
    const marker = new googleMaps.Marker({
      position: location,
      map: this.map,
      icon: icon,
      animation: googleMaps.Animation.DROP
    });
    this.markers.push(marker);

    this.markerClickListener = this.googleMaps.event.addListener(
      marker,
      'click',
      () => {
        this.checkAndRemoveMarker(marker);
      }
    );
  }

  drawPathAndShowDistance() {
    if (this.polyline) {
      this.polyline.setMap(null); 
    }
  
    const [marker1, marker2] = this.markers;
  
    const pathCoordinates = [
      marker1.getPosition(),
      marker2.getPosition()
    ];
  
    this.polyline = new this.googleMaps.Polyline({
      path: pathCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
  
    this.polyline.setMap(this.map);
  
    const distanceMeters = this.googleMaps.geometry.spherical.computeDistanceBetween(
      marker1.getPosition(),
      marker2.getPosition()
    );
    const distanceKm = (distanceMeters / 1000).toFixed(2);
  
    const midLat = (marker1.getPosition().lat() + marker2.getPosition().lat()) / 2;
    const midLng = (marker1.getPosition().lng() + marker2.getPosition().lng()) / 2;
  
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `<div style="color: black; font-size: 14px;"><strong>Distance:</strong> ${distanceKm} km</div>`;

  
    const infoWindow = new this.googleMaps.InfoWindow({
      content: infoDiv,
      position: { lat: midLat, lng: midLng }
    });
  
    infoWindow.open(this.map);
  }
  

  checkAndRemoveMarker(marker) {
    const index = this.markers.findIndex(
      (x) =>
        x.position.lat() == marker.position.lat() &&
        x.position.lng() == marker.position.lng()
    );
    if (index >= 0) {
      this.markers[index].setMap(null);
      this.markers.splice(index, 1);
      if (this.polyline) {
        this.polyline.setMap(null);
      }
    }
  }

  ngOnDestroy() {
    if (this.mapClickListener) {
      this.googleMaps.event.removeListener(this.mapClickListener);
    }
    if (this.markerClickListener) {
      this.googleMaps.event.removeListener(this.markerClickListener);
    }
  }
}
