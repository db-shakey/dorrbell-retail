import { Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Router } from '@angular/router';
import { UserService } from '../shared/user.service';
import { ControlsService } from '../shared/controls.service';
import { FormGroup, FormControl, FormBuilder, Validators} from '@angular/forms';
import { HerokuService } from '../shared/heroku.service';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: 'navigation.component.html',
  styleUrls: ['navigation.component.scss']
})


export class NavigationComponent implements AfterViewInit, OnInit {
  @ViewChild('loginModal') el: ElementRef;
  @ViewChild('dropdownButton') dropdownButton: ElementRef;
  @ViewChild('menuButton') menuButton: ElementRef;
  loginForm = new FormGroup({
    email : new FormControl(),
    password : new FormControl()
  });
  submitted = false;
  herokuService : HerokuService;
  store: any = {};
  user: any = {};

  constructor(private userService: UserService, private formBuilder: FormBuilder, private router: Router, private controlsService: ControlsService, herokuSerivce: HerokuService, private af: AngularFire) {
    this.herokuService = herokuSerivce;
  }

  ngOnInit(){
    this.loginForm = this.formBuilder.group({
      email : ['',  Validators.required],
      password : ['', Validators.required]
    })
  }

  onSubmit(){
    if(this.loginForm.valid){
      this.userService.login(this.loginForm.value.email, this.loginForm.value.password).then(data => {
        this.ngAfterViewInit();
        this.router.navigate(['/']);
      });
    }
    this.submitted = true;
  }

  logout(){
    this.userService.logout();
    $(this.el.nativeElement).openModal({
     dismissible : false
   });
  }

  ngAfterViewInit(){
    this.userService.isLoggedIn().subscribe(loggedIn => {
      if(!loggedIn){
        $(this.el.nativeElement).openModal({
           dismissible : false
         });
      }else{
        $(this.el.nativeElement).closeModal();
        $(this.dropdownButton.nativeElement).dropdown();
        $(this.menuButton.nativeElement).sideNav();
        this.userService.getUser().subscribe((user) => {
          this.user = user;
          this.af.database.object('/retailers/' + user.contact.Store__c + '/record').subscribe((store) => this.store = store);
        });
      }
    });
  }
}
