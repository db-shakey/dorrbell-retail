import { Component, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { UserService } from '../shared/user.service';
import { Observable } from 'rxjs/Observable';
import { OrderBy } from "../shared/orderBy";
import { HerokuService } from "../shared/heroku.service";

import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';

declare var moment: any;
declare var $: any;
declare var Materialize: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  pipes : [OrderBy],
  directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES]
})
export class DashboardComponent implements OnInit, AfterViewInit {

  team: Observable<any>;
  cases: Observable<any>;
  orders: FirebaseListObservable<any>;
  metrics : any = {};
  caseForm : FormGroup;

  constructor(private af: AngularFire, private userService: UserService, private herokuService: HerokuService) {
  }

  ngOnInit() {
    this.userService.getUser().subscribe(user =>  {
      this.cases = this.af.database.list('/customers/' + user.firebaseId + '/contact/Cases/records',{
        query : {limitToLast: 10, orderByChild : 'CreatedDate'}
      })
      this.team = this.af.database.list('/retailers/' + user.contact.Store__c + '/record/Contacts__r/records',{
        query : {limitToLast: 10, orderByKey : true}
      })

      this.af.database.list('/retailers/' + user.contact.Store__c + '/orders', {
        query : {orderByChild : 'Order__r/Marked_Completed__c', startAt : moment().startOf('month').toISOString(), endAt : moment().endOf("month").toISOString()},
        preserveSnapshot : true
      }).subscribe(snapshots => {
        this.metrics.income = 0;
        snapshots.forEach(snapshot => {
          this.metrics.income += snapshot.val().Total__c;
        })
      });

      this.af.database.list('/retailers/' + user.contact.Store__c + '/orders', {
        query : {orderByChild : 'Order__r/In_Home_Try_On_Start__c', startAt : moment().startOf('week').toISOString(), endAt : moment().endOf("week").toISOString()},
        preserveSnapshot : true
      }).subscribe(snapshots => {
        this.metrics.orders = 0;
        snapshots.forEach(snapshot => {
          this.metrics.orders += 1;
        })
      });

      this.orders = this.af.database.list('/retailers/' + user.contact.Store__c + '/orders', {
        query : {orderByChild: 'Status__c', equalTo: 'New'}
      });

      this.metrics.products = this.af.database.object('/retailers/' + user.contact.Store__c + '/record/Products__r/totalSize');
    });
    this.buildCaseForm();
  }

  smsChange(user, event){
    user.Do_Not_Text__c = !event.srcElement.checked;
    this.herokuService.post('/retail/user', {Id : user.Id, Do_Not_Text__c: user.Do_Not_Text__c}).subscribe(
      res => {},
      err => { Materialize.toast((err._body) ? err._body : err, 2000, 'red'); }
    )
  }
  statusChange(user, event){
    user.Status__c = (event.srcElement.checked) ? 'Active' : 'Disabled';
    this.herokuService.post('/retail/user', {Id : user.Id, Status__c: user.Status__c}).subscribe(
      res => {},
      err => { Materialize.toast((err._body) ? err._body : err, 2000, 'red'); }
    )
  }

  onSubmit(value){
    $("#case-modal").closeModal();
    this.herokuService.post('/retail/case', value).subscribe(
      res => { Materialize.toast('Your case has been submitted.', 2000); },
      err => { Materialize.toast(err, 2000, 'red'); }
    );
  }

  buildCaseForm(){
    this.caseForm = new FormGroup({
      subject : new FormControl('', Validators.required),
      description: new FormControl('', Validators.required)
    })
  }

  ngAfterViewInit() {
    $(".modal-trigger").leanModal();
  }
}
