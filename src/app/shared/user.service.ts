import { Injectable } from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class UserService {

  loggedIn = false;
  auth: any;
  user: any;

  constructor(public af: AngularFire) {}

  getUser(){
    if(this.auth)
      return this.af.database.object('/customers/' + this.auth.uid);
    else
      return this.af.auth.flatMap(auth => this.af.database.object('/customers/' + auth.uid));
  }

  login(email, password){
    return this.af.auth.login({ email: email, password: password }).then(data => {
      this.auth = data;
      return data;
    });
  }

  logout(){
    this.loggedIn = false;

    return this.af.auth.logout();
  }

  isLoggedIn() {
    return Observable.create(observer => {
      this.getUser().subscribe(
        user => {
          observer.next(user != null && user.contact.RecordType.DeveloperName == 'Retailer_Contact');
          this.loggedIn = (user != null && user.contact.RecordType.DeveloperName == 'Retailer_Contact');
          observer.complete();
        },
        err => {
          observer.next(false);
          this.loggedIn = false;
          observer.complete();
        }
      )
    });
  }
}
