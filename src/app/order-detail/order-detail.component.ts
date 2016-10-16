import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../shared/user.service';
import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { HerokuService } from '../shared/heroku.service';
import { ControlsService, CustomControl } from '../shared/controls.service';

import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import MaskedInput from 'angular2-text-mask/dist/angular2TextMask';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

declare var google: any;
declare var $: any;
declare var Materialize: any;

@Component({
  selector: 'app-order-detail',
  templateUrl: 'order-detail.component.html',
  styleUrls: ['order-detail.component.scss'],
  directives: [MaskedInput]
})
export class OrderDetailComponent implements OnInit {
  //Local variables
  order: any;
  productList : any[];
  selectedRecord: any;
  public currencyMask;
  productForm : FormGroup;
  reference : FirebaseListObservable<any>;
  map : any;
  removeView: boolean = false;

  //Map component element reference
  @ViewChild('googleMap') mapRef : ElementRef;
  //Modal reference
  @ViewChild('verifyModal') verifyModalRef : ElementRef;

  constructor(private af: AngularFire, private route: ActivatedRoute, private userService: UserService, private herokuService: HerokuService, private controlsService: ControlsService) {
    this.currencyMask = {
      mask : createNumberMask({
        allowDecimal : true,
        prefix: ''
      })
    };
  }

  ngOnInit() {
    this.userService.getUser().subscribe((user) => {
      this.af.database.object('/retailers/' + user.contact.Store__c + '/products')
      .subscribe
        (
          products => {
            this.reference = this.af.database.list('/retailers/' + user.contact.Store__c + '/orders', { query : {orderByChild: 'Order__c', equalTo: this.route.snapshot.params['id']}});
            this.reference.subscribe(orderList => this.onLoad(orderList, products));
          }
        )
      }
    );
  }

  onLoad(orderList, allProducts){
    this.productList = [];
    this.order = orderList[0];

    //Set the main top button
    if(this.order && this.order.Status__c == 'New'){
      this.controlsService.setControls([
        new CustomControl('Accept Delivery', 'Accepting...', this.order.Status__c != 'New', this.acceptDelivery.bind(this))
      ]);
    }


    //Load the map
    if(this.order){
      let index: number = 0;
      this.order.Order_Products__r.records.forEach(orderProduct => {
        allProducts.forEach(product => {
          if(product.PricebookEntries && orderProduct.PricebookEntryId == product.PricebookEntries.records[0].Id)
          this.productList.push({
            orderProduct : orderProduct,
            product : product,
            index : index
          });
        })
        index++;
      })

      var latLng = {lat: this.order.Order__r.ShippingLatitude, lng: this.order.Order__r.ShippingLongitude};
      if(!this.map){
        this.map = new google.maps.Map(this.mapRef.nativeElement, {
          center: latLng,
          zoom: 16
        });
        var marker = new google.maps.Marker({
          position: latLng,
          map: this.map,
          animation: google.maps.Animation.DROP,
          title: this.order.Order__r.ShipToContact.Name
        });
      }
    }
  }

  acceptDelivery(){
    this.herokuService.post('/retail/delivery/accept/' + this.order.Id, null).subscribe(
      res => {
          this.reference.update(this.order.$key, {Status__c : 'Accepted By Retailer'});
          Materialize.toast('This delivery has been accepted', 2000);
          this.controlsService.setControls([]);
      },
      err => {
        Materialize.toast(err, 2000, 'red');
      }
    );

  }

  openVerifyModal(record){
    record.orderProduct.UnitPrice = (!record.orderProduct.UnitPrice || String(record.orderProduct.UnitPrice).trim().length == 0) ? "0" : record.orderProduct.UnitPrice;
    this.productForm = new FormGroup({
      UnitPrice : new FormControl(record.orderProduct.UnitPrice),
      RemoveReason : new FormControl("Can't Find Item")
    });

    this.selectedRecord = record;
    $(this.verifyModalRef.nativeElement).openModal({
      ready : function(){
        $(".remove-select").material_select();
      }
    });
  }

  goToRemove(){
    this.removeView = true;
    setTimeout(() => {
      $(".remove-select").material_select();
      $(".remove-select").on('change', (evt) => {
        this.selectedRecord.orderProduct.Removed_Reason__c = evt.target.value;
        console.log(this.selectedRecord.orderProduct.Removed_Reason__c);
      });
    });
  }

  onSubmit(index){
    let removing:boolean = this.removeView;
    this.closeModal();
    let endpoint:string = (removing) ? '/retail/OrderItem/remove' : '/retail/OrderItem/verify';
    this.herokuService.post(endpoint, {product : this.selectedRecord.orderProduct, deliveryId : this.order.Id}).subscribe(
      res => {
        if(removing){
          Materialize.toast('Product has been removed.', 2000);
          this.reference.update(this.order.$key + '/Order_Products__r/records/' + index, {Status__c : 'Removed'});
        }else{
          Materialize.toast('Product has been confirmed.', 2000);
          this.reference.update(this.order.$key + '/Order_Products__r/records/' + index, {UnitPrice : this.selectedRecord.orderProduct.UnitPrice, Status__c : 'Ready For Check Out'});
        }
      },
      err => { Materialize.toast(err, 2000, 'red'); }
    );
  }

  closeModal(){
    this.removeView = false;
    $(this.verifyModalRef.nativeElement).closeModal();
  }

}
