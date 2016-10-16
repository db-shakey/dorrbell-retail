import { Injectable } from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import { AngularFire } from 'angularfire2';
import {Observable} from 'rxjs/Rx';

const endpoint: string = 'https://dorrbell-test.herokuapp.com';
// const endpoint: string = 'http://localhost:5050';

@Injectable()
export class HerokuService {
  public loading: boolean = false;
  constructor(private http: Http, private af: AngularFire) {}

  createAuthorizationHeader() {

    let headers = new Headers();
    return Observable.create(observer => {
      firebase.auth().currentUser.getToken(false).then(function(token){
        headers.append('authorization', token);
        observer.next(headers);
        observer.complete();
      });
    });
  }

  get(url) {
    this.loading = true;
    let postResult = this.createAuthorizationHeader().flatMap(headers => this.http.get(endpoint + url, {headers : headers})).share();

    postResult.subscribe(res => {
      this.loading = false;
    }, err => {
      this.loading = false;
    });
    return postResult;
  }

  post(url, data) {
    this.loading = true;
    let postResult = this.createAuthorizationHeader().flatMap(headers => this.http.post(endpoint + url, data, {headers : headers})).share();

    postResult.subscribe(res => {
      this.loading = false;
    }, err => {
      this.loading = false;
    });

    return postResult;

  }
}
