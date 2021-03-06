import { Component, OnInit } from '@angular/core';
import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { UserService } from '../shared/user.service';
import { OrderBy } from "../shared/orderBy";
import { Router } from "@angular/router";

@Component({
  selector: 'app-orders',
  templateUrl: 'orders.component.html',
  styleUrls: ['orders.component.scss'],
  pipes : [OrderBy]
})

export class OrdersComponent implements OnInit {
  items: FirebaseListObservable<any[]>;

  constructor(private af: AngularFire, private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.userService.getUser().subscribe(user => {
      this.items = this.af.database.list('retailers/' + user.contact.Store__c + '/orders', {
        query : {orderByChild : "Order__r/In_Home_Try_On_Start__c", limitToLast: 20}
      });
    });
  }

  goToOrder(orderId){
    console.log('here');
    this.router.navigate(['/order', orderId]);
  }

}
